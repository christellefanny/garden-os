import { createHash, randomUUID } from "node:crypto";
import { adminDatabase } from "./reminders-server";
import { generateWeeklyBrief, loadBriefContext } from "./weekly-brief-server";
import {
  emailPreferenceKey,
  renderWeeklyEmail,
  unsubscribeToken,
  validEmailPreferences,
  type EmailPreferences,
} from "./weekly-email";
import { localDay } from "./growing-calendar";
import { weekBounds } from "./weekly-brief";
export function emailReady() {
  return !!(
    process.env.RESEND_API_KEY &&
    process.env.GARDEN_EMAIL_FROM &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.CRON_SECRET
  );
}
export function emailSecret() {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || "";
}
export function emailOrigin() {
  const origin = new URL(
    process.env.GARDEN_APP_ORIGIN || "https://garden-os-beta.vercel.app",
  );
  if (origin.protocol !== "https:") throw new Error("Email links require HTTPS.");
  return origin.origin;
}
export type EmailDispatchResult = {
  ready: boolean;
  runId: string | null;
  sent: number; // Provider acceptance, not confirmed inbox delivery.
  failed: number;
  skipped: number;
  reviewRequired: number;
  deferred: number;
  reasons: Record<string, number>;
};
export function emailDispatchHealthy(result: EmailDispatchResult) {
  return result.ready && !result.failed && !result.reviewRequired && !result.deferred;
}
const ledger = "garden_weekly_email_deliveries";
const runs = "garden_email_dispatch_runs";
const maxAttempts = 3;
const budgetMs = 35000;
function fingerprint(pref: EmailPreferences) {
  // Hash the saved preference, not a recipient supplied to the dispatch endpoint.
  return createHash("sha256").update(JSON.stringify([
    pref.nonce, pref.day, pref.gardenId, pref.email || null, pref.firstName || null,
  ])).digest("hex");
}
function scheduledDate(day: string, weekday: number) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() - weekday + 7) % 7);
  return date.toISOString().slice(0, 10);
}
/** Authenticated daily cron only. Never retries an ambiguous provider outcome.
 * The migration must be applied before deployment; audit/claim failures fail closed.
 */
export async function dispatchWeeklyEmails(now = new Date()): Promise<EmailDispatchResult> {
  const result: EmailDispatchResult = {
    ready: emailReady(), runId: null, sent: 0, failed: 0, skipped: 0,
    reviewRequired: 0, deferred: 0, reasons: {},
  };
  const reason = (code: string) => {
    result.reasons[code] = (result.reasons[code] || 0) + 1;
  };
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    reason("non_production");
    return result;
  }
  const started = Date.now();
  const db = adminDatabase();
  const day = localDay(now);
  result.runId = randomUUID();
  const { error: runError } = await db.from(runs).insert({
    id: result.runId, started_at: now.toISOString(), status: "running",
  });
  if (runError) {
    result.failed++;
    reason("audit_start_failed");
    console.error("weekly_email_dispatch", result);
    return result;
  }
  try {
    if (!result.ready) {
      result.failed++;
      reason("configuration_missing");
      return result;
    }
    // Keyset pagination avoids silently ignoring subscribers after the first 200.
    let after: string | undefined;
    while (true) {
      if (Date.now() - started > budgetMs) {
        result.deferred++;
        reason("run_budget_exhausted");
        break;
      }
      let query = db.from("garden_os_state").select("user_id,key,value")
        .like("key", "garden-os-weekly-email-%").order("user_id").limit(100);
      if (after) query = query.gt("user_id", after);
      const { data, error } = await query;
      if (error) {
        result.failed++;
        reason("subscription_read_failed");
        break;
      }
      const records = data || [];
      for (const record of records) {
        if (Date.now() - started > budgetMs) {
          result.deferred++;
          reason("run_budget_exhausted");
          break;
        }
        after = record.user_id;
        const pref = record.value;
        if (record.key !== emailPreferenceKey(record.user_id) || !validEmailPreferences(pref)) {
          result.skipped++;
          reason("invalid_preference");
          continue;
        }
        if (!pref.enabled) {
          result.skipped++;
          reason("disabled");
          continue;
        }
        const scheduled = scheduledDate(day, pref.day);
        const week = weekBounds(scheduled).start;
        const deliveryKey = `garden-os-weekly-delivery-${record.user_id}-${week}`;
        const identity = fingerprint(pref);
        const { data: previous, error: readError } = await db.from(ledger)
          .select("*").eq("user_id", record.user_id).eq("week_start", week).maybeSingle();
        if (readError) {
          result.failed++;
          reason("delivery_read_failed");
          continue;
        }
        const attempt = previous ? previous.attempts + 1 : 1;
        const version = previous ? previous.version + 1 : 1;
        const attemptId = randomUUID();
        const pending = {
          status: "pending", attempts: attempt, version, attempt_id: attemptId,
          last_attempt_at: now.toISOString(), next_attempt_at: null,
          run_id: result.runId, reason: null, provider_status: null,
        };
        if (previous) {
          if (previous.status !== "retryable") {
            result.skipped++;
            reason(`held_${previous.status}`);
            if (["pending", "unknown", "rejected"].includes(previous.status)) result.reviewRequired++;
            continue;
          }
          if (previous.preference_fingerprint !== identity || previous.scheduled_day !== scheduled) {
            result.skipped++;
            reason("subscription_changed");
            continue;
          }
          if (attempt > maxAttempts) {
            result.reviewRequired++;
            reason("attempts_exhausted");
            continue;
          }
          if (!previous.next_attempt_at || Date.parse(previous.next_attempt_at) > now.getTime()) {
            result.skipped++;
            reason("retry_waiting");
            continue;
          }
          const { data: claimed, error: claimError } = await db.from(ledger)
            .update(pending).eq("user_id", record.user_id).eq("week_start", week)
            .eq("version", previous.version).eq("status", "retryable").select("user_id");
          if (claimError || !claimed?.length) {
            if (claimError) result.failed++; else result.skipped++;
            reason(claimError ? "claim_failed" : "concurrent_claim");
            continue;
          }
        } else {
          // New attempts are only created on the selected day. A late signup or
          // absent cron must not cause an unsolicited catch-up email days later.
          if (scheduled !== day) {
            result.skipped++;
            reason("not_due");
            continue;
          }
          const { data: legacy, error: legacyError } = await db.from("garden_os_state")
            .select("value").eq("user_id", record.user_id).eq("key", deliveryKey).maybeSingle();
          if (legacyError) {
            result.failed++;
            reason("legacy_claim_read_failed");
            continue;
          }
          // Existing claims remain a duplicate barrier, but are never trusted
          // as retry authority because this old namespace is owner-writable.
          if (legacy) {
            result.skipped++;
            reason("legacy_claim_held");
            if (legacy.value?.status !== "sent") result.reviewRequired++;
            continue;
          }
          const { error: claimError } = await db.from(ledger).insert({
            user_id: record.user_id, week_start: week, scheduled_day: scheduled,
            preference_fingerprint: identity, ...pending,
          });
          if (claimError) {
            if (claimError.code === "23505") result.skipped++; else result.failed++;
            reason(claimError.code === "23505" ? "concurrent_claim" : "claim_failed");
            continue;
          }
        }
        let outcome = "retryable";
        let code = "preparation_failed";
        let providerStatus: number | null = null;
        let providerId: string | null = null;
        try {
          if (!previous) {
            // Preserve the old dispatcher’s duplicate barrier during a rolling
            // deployment or rollback. Retry authority remains in the private ledger.
            const { error: barrierError } = await db.from("garden_os_state").insert({
              user_id: record.user_id, key: deliveryKey,
              value: { status: "pending", created: now.toISOString(), ledger: true },
            });
            if (barrierError) {
              outcome = "unknown";
              code = "legacy_barrier_failed";
              throw new Error("Could not establish compatibility barrier.");
            }
          }
          const { data: account, error: authError } = await db.auth.admin.getUserById(record.user_id);
          if (authError) throw new Error("Account lookup failed.");
          if (!account.user?.email || !account.user.email_confirmed_at) {
            outcome = "rejected";
            code = "account_unconfirmed";
            throw new Error("Account is not confirmed.");
          }
          const recipientHash = createHash("sha256").update(pref.email || account.user.email).digest("hex");
          if (previous?.recipient_hash && previous.recipient_hash !== recipientHash) {
            outcome = "cancelled";
            code = "recipient_changed";
            throw new Error("Recipient changed.");
          }
          const { data: recipientSaved, error: recipientError } = await db.from(ledger)
            .update({ recipient_hash: recipientHash }).eq("user_id", record.user_id)
            .eq("week_start", week).eq("attempt_id", attemptId).eq("status", "pending").select("user_id");
          if (recipientError || !recipientSaved?.length) throw new Error("Could not record recipient fingerprint.");
          const context = await loadBriefContext(db, record.user_id, pref.gardenId);
          const brief = await generateWeeklyBrief(context, now);
          const { data: latest, error: consentError } = await db.from("garden_os_state")
            .select("value").eq("user_id", record.user_id).eq("key", record.key).maybeSingle();
          if (consentError) throw new Error("Consent lookup failed.");
          if (!validEmailPreferences(latest?.value) || !latest.value.enabled || fingerprint(latest.value) !== identity) {
            outcome = "cancelled";
            code = "subscription_changed";
            throw new Error("Subscription changed.");
          }
          // Do not start a provider call once preparation has consumed the budget.
          if (Date.now() - started > budgetMs - 10000) {
            code = "send_budget_exhausted";
            throw new Error("Insufficient send budget.");
          }
          const origin = emailOrigin();
          const unsubscribe = `${origin}/api/weekly-email/unsubscribe?token=${encodeURIComponent(unsubscribeToken(record.user_id, pref.nonce, emailSecret()))}`;
          const mail = renderWeeklyEmail(brief, origin, unsubscribe, undefined, pref.firstName);
          outcome = "unknown";
          code = "provider_outcome_unknown";
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
              "Idempotency-Key": `${deliveryKey}-a${attempt}`,
            },
            body: JSON.stringify({
              from: process.env.GARDEN_EMAIL_FROM, to: [pref.email || account.user.email], ...mail,
              headers: { "List-Unsubscribe": `<${unsubscribe}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
            }),
            signal: AbortSignal.timeout(10000),
          });
          providerStatus = response.status;
          if (!response.ok) {
            // 429 is a definite rate-limit rejection. Do not assume a 5xx,
            // 408, 409 or unexpected response means the provider did not send.
            if (response.status === 429) { outcome = "retryable"; code = "provider_rate_limited"; }
            else if (response.status >= 400 && response.status < 500 && ![408, 409].includes(response.status)) {
              outcome = "rejected"; code = "provider_rejected";
            }
            throw new Error("Provider request failed.");
          }
          const receipt = await response.json();
          if (typeof receipt.id !== "string" || !receipt.id) throw new Error("Missing provider receipt.");
          providerId = receipt.id;
          outcome = "accepted";
          code = "provider_accepted";
          result.sent++;
        } catch {
          if (outcome === "cancelled") result.skipped++;
          else result.failed++;
        }
        if (outcome === "retryable" && attempt >= maxAttempts) { outcome = "rejected"; code = "attempts_exhausted"; }
        if (outcome === "unknown" || outcome === "rejected") result.reviewRequired++;
        reason(code);
        const { data: saved, error: saveError } = await db.from(ledger).update({
          status: outcome, reason: code, provider_status: providerStatus, provider_id: providerId,
          next_attempt_at: outcome === "retryable" ? new Date(now.getTime() + 3600000).toISOString() : null,
          version: version + 1,
        }).eq("user_id", record.user_id).eq("week_start", week)
          .eq("version", version).eq("attempt_id", attemptId).eq("status", "pending").select("user_id");
        if (saveError || !saved?.length) {
          result.failed++;
          result.reviewRequired++;
          reason("outcome_save_failed");
          // Never release/recreate a claim after sending, even if persistence fails.
        }
      }
      if (result.deferred || records.length < 100) break;
    }
  } catch {
    result.failed++;
    reason("dispatch_exception");
  } finally {
    try {
    const { data: saved, error } = await db.from(runs).update({
      finished_at: new Date().toISOString(),
      status: emailDispatchHealthy(result) ? "completed" : "attention",
      summary: result,
    }).eq("id", result.runId).select("id");
    if (error || !saved?.length) { result.failed++; reason("audit_finish_failed"); }
    } catch { result.failed++; reason("audit_finish_failed"); }
    // Fixed codes and counts only; never raw exceptions, addresses or message bodies.
    if (!emailDispatchHealthy(result)) console.error("weekly_email_dispatch", result);
  }
  return result;
}

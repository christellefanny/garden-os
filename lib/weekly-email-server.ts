import { adminDatabase } from "./reminders-server";
import { generateWeeklyBrief, loadBriefContext } from "./weekly-brief-server";
import {
  emailPreferenceKey,
  renderWeeklyEmail,
  unsubscribeToken,
  validEmailPreferences,
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
  if (origin.protocol !== "https:")
    throw new Error("Email links require HTTPS.");
  return origin.origin;
}
/** Called only by the authenticated daily cron. Uses account emails from Auth,
 * never a recipient supplied by a browser. Independent of phone subscriptions.
 */
export async function dispatchWeeklyEmails(now = new Date()) {
  const result = { ready: emailReady(), sent: 0, failed: 0, skipped: 0 };
  if (
    !result.ready ||
    (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production")
  )
    return result;
  const db = adminDatabase(),
    day = localDay(now),
    weekday = new Date(day + "T12:00:00Z").getUTCDay();
  const { data, error } = await db
    .from("garden_os_state")
    .select("user_id,key,value")
    .like("key", "garden-os-weekly-email-%")
    .order("user_id")
    .limit(200);
  if (error) throw new Error("Could not read email subscriptions.");
  // Keep each run inside the existing daily function's execution budget.
  const started = Date.now();
  for (const record of data || []) {
    const pref = record.value;
    if (
      record.key !== emailPreferenceKey(record.user_id) ||
      !validEmailPreferences(pref) ||
      !pref.enabled ||
      pref.day !== weekday
    )
      continue;
    if (Date.now() - started > 35000) {
      result.skipped++;
      continue;
    }
    const deliveryKey = `garden-os-weekly-delivery-${record.user_id}-${weekBounds(day).start}`;
    const { error: claimError } = await db
      .from("garden_os_state")
      .insert({
        user_id: record.user_id,
        key: deliveryKey,
        value: { status: "pending", created: now.toISOString() },
      });
    if (claimError) {
      if (claimError.code === "23505") result.skipped++;
      else result.failed++;
      continue;
    }
    let uncertain = false;
    try {
      const { data: account, error: authError } =
        await db.auth.admin.getUserById(record.user_id);
      if (authError || !account.user?.email || !account.user.email_confirmed_at)
        throw new Error("A confirmed account email is required.");
      const context = await loadBriefContext(db, record.user_id, pref.gardenId);
      const brief = await generateWeeklyBrief(context, now);
      // Re-read consent immediately before sending, including unsubscribe/changes.
      const { data: latest, error: readError } = await db
        .from("garden_os_state")
        .select("value")
        .eq("user_id", record.user_id)
        .eq("key", record.key)
        .maybeSingle();
      if (
        readError ||
        !latest?.value?.enabled ||
        latest.value.nonce !== pref.nonce ||
        latest.value.gardenId !== pref.gardenId
      )
        throw new Error("Subscription changed.");
      const origin = emailOrigin(),
        unsubscribe = `${origin}/api/weekly-email/unsubscribe?token=${encodeURIComponent(unsubscribeToken(record.user_id, pref.nonce, emailSecret()))}`;
      const mail = renderWeeklyEmail(brief, origin, unsubscribe);
      uncertain = true;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": deliveryKey,
        },
        body: JSON.stringify({
          from: process.env.GARDEN_EMAIL_FROM,
          to: [account.user.email],
          ...mail,
          headers: {
            "List-Unsubscribe": `<${unsubscribe}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        uncertain = false;
        throw new Error("Email provider rejected delivery.");
      }
      const receipt = await response.json();
      if (typeof receipt.id !== "string")
        throw new Error("Delivery outcome could not be confirmed.");
      await db
        .from("garden_os_state")
        .update({
          value: {
            status: "sent",
            sent: now.toISOString(),
            providerId: receipt.id,
          },
        })
        .eq("user_id", record.user_id)
        .eq("key", deliveryKey);
      result.sent++;
    } catch {
      result.failed++;
      // A timeout may occur after provider acceptance. Keep the claim to avoid
      // another email; explicit failures before acceptance can safely retry.
      if (!uncertain)
        await db
          .from("garden_os_state")
          .delete()
          .eq("user_id", record.user_id)
          .eq("key", deliveryKey);
    }
  }
  return result;
}

import { randomUUID } from "node:crypto";
import { authenticated } from "@/lib/reminders-server";
import {
  emailReady,
  emailOrigin,
  emailSecret,
} from "@/lib/weekly-email-server";
import {
  emailPreferenceKey,
  validEmailPreferences,
  renderWeeklyEmail,
  unsubscribeToken,
} from "@/lib/weekly-email";
import {
  loadBriefContext,
  generateWeeklyBrief,
} from "@/lib/weekly-brief-server";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  const auth = await authenticated(request);
  if (!auth)
    return Response.json(
      { error: "Sign in to send a test email." },
      { status: 401, headers },
    );
  if (
    !emailReady() ||
    (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production")
  )
    return Response.json(
      {
        error:
          "Test emails are available on the production site after the mail service is connected.",
      },
      { status: 503, headers },
    );
  if (!auth.user.email || !auth.user.email_confirmed_at)
    return Response.json(
      { error: "Confirm your account email before sending a test." },
      { status: 403, headers },
    );
  const { data: subscription, error: readError } = await auth.db
    .from("garden_os_state")
    .select("value")
    .eq("user_id", auth.user.id)
    .eq("key", emailPreferenceKey(auth.user.id))
    .maybeSingle();
  if (readError)
    return Response.json(
      { error: "Could not read your weekly email preferences." },
      { status: 503, headers },
    );
  if (
    !validEmailPreferences(subscription?.value) ||
    !subscription.value.enabled
  )
    return Response.json(
      { error: "Enable and save your weekly email preferences first." },
      { status: 400, headers },
    );
  const pref = subscription.value;
  // One version-checked operational record provides a per-account cooldown and
  // an atomic claim across concurrent clicks, without touching weekly delivery.
  const key = `garden-os-email-test-${auth.user.id}`;
  const { data: previous, error: previousError } = await auth.db
    .from("garden_os_state")
    .select("value,version")
    .eq("user_id", auth.user.id)
    .eq("key", key)
    .maybeSingle();
  if (previousError)
    return Response.json(
      { error: "Could not check the test email cooldown." },
      { status: 503, headers },
    );
  const last = Date.parse(previous?.value?.attemptedAt || "");
  if (Number.isFinite(last) && Date.now() - last < 60000)
    return Response.json(
      { error: "Wait one minute before sending another test." },
      { status: 429, headers },
    );
  const id = randomUUID();
  const { data: claim, error: claimError } = await auth.db.rpc(
    "garden_os_save_state",
    {
      p_key: key,
      p_version: previous?.version || 0,
      p_value: { attemptedAt: new Date().toISOString(), attemptId: id },
    },
  );
  if (claimError || !claim?.length)
    return Response.json(
      {
        error:
          "Another test was just requested. Wait one minute and try again.",
      },
      { status: 429, headers },
    );
  try {
    const context = await loadBriefContext(
      auth.db,
      auth.user.id,
      pref.gardenId,
    );
    const brief = await generateWeeklyBrief(context);
    const origin = emailOrigin();
    const unsubscribe = `${origin}/api/weekly-email/unsubscribe?token=${encodeURIComponent(unsubscribeToken(auth.user.id, pref.nonce, emailSecret()))}`;
    const mail = renderWeeklyEmail(brief, origin, unsubscribe);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `garden-test-${auth.user.id}-${id}`,
      },
      body: JSON.stringify({
        from: process.env.GARDEN_EMAIL_FROM,
        to: [auth.user.email],
        ...mail,
        subject: `[Test] ${mail.subject}`,
        headers: {
          "List-Unsubscribe": `<${unsubscribe}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      return Response.json(
        {
          error:
            response.status === 401
              ? "The mail service rejected the API key. Check RESEND_API_KEY in Vercel."
              : response.status === 403
                ? "The mail service rejected the sender or recipient. Check your verified sending domain and Resend sending access."
                : response.status === 429
                  ? "The mail service rate limit was reached. Please try again later."
                  : "The mail service could not accept the test email. Check the Resend email logs.",
        },
        { status: 502, headers },
      );
    const receipt = await response.json();
    if (typeof receipt.id !== "string") throw new Error("No receipt");
    return Response.json(
      {
        ok: true,
        message:
          "Test email accepted by the mail service. Check your account inbox and spam folder. Your weekly schedule is unchanged.",
      },
      { headers },
    );
  } catch {
    return Response.json(
      {
        error:
          "Could not confirm test email delivery. Check your inbox and Resend email logs before trying again.",
      },
      { status: 502, headers },
    );
  }
}

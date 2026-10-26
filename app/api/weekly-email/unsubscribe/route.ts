import { adminDatabase } from "@/lib/reminders-server";
import { emailSecret } from "@/lib/weekly-email-server";
import { emailPreferenceKey, readUnsubscribeToken } from "@/lib/weekly-email";
function page(message: string, status = 200, form = "") {
  return new Response(
    `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Garden Atelier · Weekly emails</title><body style="margin:0;background:#faf6ed;color:#304734;font:18px/1.6 Georgia,serif"><main style="max-width:520px;margin:10vh auto;padding:24px"><h1>Garden Atelier</h1><p>${message}</p>${form}<p><a href="/">Return to your garden</a></p></main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!readUnsubscribeToken(token, emailSecret()))
    return page(
      "This unsubscribe link is invalid. You can manage weekly emails from your Growing Calendar.",
      400,
    );
  // Confirmation protects against email security scanners following links.
  return page(
    "Would you like to stop weekly garden emails?",
    200,
    '<form method="post"><button style="padding:12px 18px;font:inherit" type="submit">Stop weekly emails</button></form>',
  );
}
export async function POST(request: Request) {
  const payload = readUnsubscribeToken(
    new URL(request.url).searchParams.get("token") || "",
    emailSecret(),
  );
  if (!payload)
    return page(
      "This unsubscribe link is invalid. Manage weekly emails from your Growing Calendar.",
      400,
    );
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return page(
      "Email preferences are temporarily unavailable. Please try again.",
      503,
    );
  const db = adminDatabase(),
    key = emailPreferenceKey(payload.userId);
  const { data, error } = await db
    .from("garden_os_state")
    .select("value,version")
    .eq("user_id", payload.userId)
    .eq("key", key)
    .maybeSingle();
  if (error)
    return page("Could not update your preferences. Please try again.", 503);
  if (!data || !data.value.enabled)
    return page(
      "Weekly garden emails are off. You can enable them again from your Growing Calendar.",
    );
  if (data.value.nonce !== payload.nonce)
    return page(
      "Your email preferences have changed since this link was created. Use the link in your latest email or manage delivery in your Growing Calendar.",
      409,
    );
  const { data: updated, error: writeError } = await db
    .from("garden_os_state")
    .update({
      value: { ...data.value, enabled: false },
      version: data.version + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", payload.userId)
    .eq("key", key)
    .eq("version", data.version)
    .select("key");
  return writeError || !updated?.length
    ? page("Your preferences changed. Please try again.", 409)
    : page(
        "You’re unsubscribed. Your gardens, plants, and calendar are still here whenever you need them.",
      );
}

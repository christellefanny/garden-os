import {
  authenticated,
  body,
  remindersReady,
  sendReminder,
  setupError,
  validEndpoint,
} from "@/lib/reminders-server";
export async function POST(request: Request) {
  const auth = await authenticated(request);
  if (!auth)
    return Response.json({ error: "Sign in to send a test." }, { status: 401 });
  if (!remindersReady()) return setupError();
  try {
    const input = await body(request);
    if (!validEndpoint(input.endpoint))
      return Response.json({ error: "Invalid device." }, { status: 400 });
    const { data, error } = await auth.db
      .from("garden_reminder_devices")
      .select("subscription,last_test_at")
      .eq("user_id", auth.user.id)
      .eq("endpoint", input.endpoint)
      .maybeSingle();
    if (error) return setupError();
    if (!data)
      return Response.json(
        { error: "Enable reminders on this device first." },
        { status: 404 },
      );
    const threshold = new Date(Date.now() - 60000).toISOString();
    const { data: claimed, error: claimError } = await auth.db
      .from("garden_reminder_devices")
      .update({ last_test_at: new Date().toISOString() })
      .eq("user_id", auth.user.id)
      .eq("endpoint", input.endpoint)
      .or(`last_test_at.is.null,last_test_at.lt.${threshold}`)
      .select("endpoint");
    if (claimError || !claimed?.length)
      return Response.json(
        { error: "Wait a minute before sending another test." },
        { status: 429 },
      );
    await sendReminder(
      data.subscription,
      "Garden OS reminders are ready",
      "Your phone can receive growing tasks. Tap to open your calendar.",
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      {
        error:
          "Could not deliver a notification. Try turning reminders off and enabling them again.",
      },
      { status: 502 },
    );
  }
}

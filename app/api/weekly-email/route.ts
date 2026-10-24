import { randomUUID } from "node:crypto";
import { authenticated } from "@/lib/reminders-server";
import { emailReady } from "@/lib/weekly-email-server";
import { emailPreferenceKey, validEmailPreferences } from "@/lib/weekly-email";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const auth = await authenticated(request);
  if (!auth)
    return Response.json(
      { error: "Sign in to manage weekly emails." },
      { status: 401, headers },
    );
  const { data, error } = await auth.db
    .from("garden_os_state")
    .select("value,version")
    .eq("user_id", auth.user.id)
    .eq("key", emailPreferenceKey(auth.user.id))
    .maybeSingle();
  if (error || (data && !validEmailPreferences(data.value)))
    return Response.json(
      { error: "Email preferences could not be read safely." },
      { status: 503, headers },
    );
  return Response.json(
    {
      ready: emailReady(),
      email: auth.user.email || "",
      confirmed: !!auth.user.email_confirmed_at,
      preferences: data
        ? {
            enabled: data.value.enabled,
            day: data.value.day,
            gardenId: data.value.gardenId,
          }
        : null,
      version: data?.version || 0,
    },
    { headers },
  );
}
export async function POST(request: Request) {
  const auth = await authenticated(request);
  if (!auth)
    return Response.json(
      { error: "Sign in to manage weekly emails." },
      { status: 401, headers },
    );
  let input;
  try {
    const text = await request.text();
    if (text.length > 2000) throw new Error();
    input = JSON.parse(text);
  } catch {
    return Response.json(
      { error: "Invalid preferences." },
      { status: 400, headers },
    );
  }
  if (
    !input ||
    typeof input !== "object" ||
    typeof input.enabled !== "boolean" ||
    !Number.isInteger(input.day) ||
    input.day < 0 ||
    input.day > 6 ||
    typeof input.gardenId !== "string" ||
    input.gardenId.length > 100 ||
    !Number.isInteger(input.version) ||
    input.version < 0
  )
    return Response.json(
      { error: "Choose a garden and delivery day." },
      { status: 400, headers },
    );
  if (
    input.enabled &&
    (!emailReady() || !auth.user.email_confirmed_at || !auth.user.email)
  )
    return Response.json(
      {
        error:
          "Weekly email needs a connected mail service and confirmed account email.",
      },
      { status: 503, headers },
    );
  if (input.enabled) {
    const { data, error } = await auth.db
      .from("gardens")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("id", input.gardenId)
      .maybeSingle();
    if (error || !data)
      return Response.json(
        { error: "Choose one of your existing gardens." },
        { status: 400, headers },
      );
  }
  const { data, error } = await auth.db.rpc("garden_os_save_state", {
    p_key: emailPreferenceKey(auth.user.id),
    p_value: {
      enabled: input.enabled,
      day: input.day,
      gardenId: input.gardenId,
      nonce: randomUUID(),
    },
    p_version: input.version,
  });
  if (error || !data?.[0])
    return Response.json(
      {
        error:
          "Preferences changed on another device. Close and reopen email settings to try again.",
      },
      { status: 409, headers },
    );
  return Response.json(
    {
      ok: true,
      preferences: {
        enabled: input.enabled,
        day: input.day,
        gardenId: input.gardenId,
      },
      version: data[0].version,
    },
    { headers },
  );
}

import {
  authenticated,
  body,
  remindersReady,
  setupError,
  validEndpoint,
  validSubscription,
} from "@/lib/reminders-server";
export async function POST(request: Request) {
  const auth = await authenticated(request);
  if (!auth)
    return Response.json(
      { error: "Sign in to manage reminders." },
      { status: 401 },
    );
  if (!remindersReady()) return setupError();
  try {
    const input = await body(request);
    if (input.disable === true) {
      if (!validEndpoint(input.endpoint))
        return Response.json({ error: "Invalid device." }, { status: 400 });
      const { error } = await auth.db
        .from("garden_reminder_devices")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("endpoint", input.endpoint);
      return error ? setupError() : Response.json({ ok: true });
    }
    if (
      !validSubscription(input.subscription) ||
      !Array.isArray(input.tasks) ||
      input.tasks.length > 5000
    )
      return Response.json(
        { error: "Invalid reminder data." },
        { status: 400 },
      );
    const ids = new Set<string>();
    const tasks = [];
    for (const t of input.tasks) {
      if (
        !t ||
        typeof t.id !== "string" ||
        t.id.length > 1000 ||
        ids.has(t.id) ||
        typeof t.date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(t.date) ||
        new Date(t.date + "T12:00:00Z").toISOString().slice(0, 10) !== t.date ||
        typeof t.title !== "string" ||
        t.title.length > 200 ||
        typeof t.plant !== "string" ||
        t.plant.length > 200
      )
        return Response.json(
          { error: "Invalid calendar task." },
          { status: 400 },
        );
      ids.add(t.id);
      tasks.push({ id: t.id, date: t.date, title: t.title, plant: t.plant });
    }
    const { error } = await auth.db
      .from("garden_reminder_devices")
      .upsert(
        {
          user_id: auth.user.id,
          endpoint: input.subscription.endpoint,
          subscription: input.subscription,
          tasks,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" },
      );
    return error ? setupError() : Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Could not read reminder data." },
      { status: 400 },
    );
  }
}

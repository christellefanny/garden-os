import { timingSafeEqual } from "node:crypto";
import {
  adminDatabase,
  remindersReady,
  sendReminder,
  setupError,
} from "@/lib/reminders-server";
import {groupReminders} from "@/lib/reminder-groups";
import { localDay } from "@/lib/growing-calendar";
export const maxDuration = 60;
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") || "";
  if (
    !expected ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(`Bearer ${expected}`) ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(`Bearer ${expected}`))
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!remindersReady()) return setupError();
  const db = adminDatabase(),
    day = localDay();
  const { data, error } = await db
    .from("garden_reminder_devices")
    .select("id,subscription,tasks,last_sent_day")
    .order("id")
    .limit(500);
  if (error) return setupError();
  let sent = 0,
    failed = 0;
  for (const device of data || []) {
    const due = (Array.isArray(device.tasks) ? device.tasks : []).filter(
      (t: { date?: string; title?: string; plant?: string } | null) =>
        t &&
        t.date === day &&
        typeof t.title === "string" &&
        typeof t.plant === "string",
    );
    if (!due.length || device.last_sent_day === day) continue;
    const { data: claimed, error: claimError } = await db
      .from("garden_reminder_devices")
      .update({ last_sent_day: day })
      .eq("id", device.id)
      .or(`last_sent_day.is.null,last_sent_day.neq.${day}`)
      .select("id");
    if (claimError || !claimed?.length) continue;
    try {
      const groups = groupReminders(due as {title:string;plant:string}[]);
      const summary = groups.slice(0,2).map(g => {
        const plants = [...new Set(g.tasks.map(t=>t.plant))];
        return `${g.title}: ${plants.slice(0,3).join(", ")}${plants.length>3?` +${plants.length-3} more`:""}`;
      }).join(" · ");
      await sendReminder(
        device.subscription,
        groups.length === 1 ? groups[0].title : `${groups.length} garden reminders today`,
        summary,
      );
      sent++;
    } catch (e) {
      failed++;
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410)
        await db.from("garden_reminder_devices").delete().eq("id", device.id);
      else
        await db
          .from("garden_reminder_devices")
          .update({ last_sent_day: null })
          .eq("id", device.id)
          .eq("last_sent_day", day);
    }
  }
  return Response.json(
    { ok: true, sent, failed },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { timingSafeEqual } from "node:crypto";
import {
  adminDatabase,
  remindersReady,
  sendReminder,
  setupError,
} from "@/lib/reminders-server";
import { groupReminders } from "@/lib/reminder-groups";
import {
  generateWeeklyBrief,
  loadBriefContext,
} from "@/lib/weekly-brief-server";
import { weeklyDue, type WeeklyBrief } from "@/lib/weekly-brief";
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
    .select("id,user_id,subscription,tasks,last_sent_day")
    .order("id")
    .limit(500);
  if (error) return setupError();
  let sent = 0,
    failed = 0,
    weeklySent = 0;
  const userIds = [...new Set((data || []).map((d) => d.user_id))];
  const { data: preferences, error: preferenceError } = userIds.length
    ? await db
        .from("garden_os_state")
        .select("user_id,key,value")
        .in("user_id", userIds)
        .in(
          "key",
          userIds.map((id) => `garden-os-calendar-${id}`),
        )
    : { data: [], error: null };
  const weeklyPreferences = new Map(
    (preferences || []).map((p) => [p.user_id, p.value?.weekly]),
  );
  let weeklyFailed = preferenceError ? userIds.length : 0;
  const briefings = new Map<string, Promise<WeeklyBrief | null>>();
  async function briefing(userId: string) {
    if (!weeklyDue(weeklyPreferences.get(userId), day)) return null;
    if (!briefings.has(userId))
      briefings.set(
        userId,
        (async () => {
          const context = await loadBriefContext(db, userId);
          if (!weeklyDue(context.calendar.weekly, day)) return null;
          return generateWeeklyBrief(context);
        })().catch(() => {
          weeklyFailed++;
          return null;
        }),
      );
    return briefings.get(userId)!;
  }
  for (const device of data || []) {
    const due = (Array.isArray(device.tasks) ? device.tasks : []).filter(
      (t: { date?: string; title?: string; plant?: string } | null) =>
        t &&
        t.date === day &&
        typeof t.title === "string" &&
        typeof t.plant === "string",
    );
    if (device.last_sent_day === day) continue;
    const weekly = await briefing(device.user_id);
    if (!due.length && !weekly) continue;
    const { data: claimed, error: claimError } = await db
      .from("garden_reminder_devices")
      .update({ last_sent_day: day })
      .eq("id", device.id)
      .or(`last_sent_day.is.null,last_sent_day.neq.${day}`)
      .select("id");
    if (claimError || !claimed?.length) continue;
    try {
      const groups = groupReminders(due as { title: string; plant: string }[]);
      const summary = groups
        .slice(0, 2)
        .map((g) => {
          const plants = [...new Set(g.tasks.map((t) => t.plant))];
          return `${g.title}: ${plants.slice(0, 3).join(", ")}${plants.length > 3 ? ` +${plants.length - 3} more` : ""}`;
        })
        .join(" · ");
      await sendReminder(
        device.subscription,
        weekly
          ? "Your weekly garden priorities"
          : groups.length === 1
            ? groups[0].title
            : `${groups.length} garden reminders today`,
        weekly
          ? [...weekly.priorities.map((a) => a.title), summary]
              .filter(Boolean)
              .join(" · ")
              .slice(0, 350) ||
              "Open your garden briefing for this week’s plan."
          : summary,
        weekly
          ? {
              url: "/?view=calendar&brief=weekly",
              tag: "garden-os-weekly-brief",
            }
          : undefined,
      );
      sent++;
      if (weekly) weeklySent++;
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
    { ok: true, sent, failed, weeklySent, weeklyFailed },
    { headers: { "Cache-Control": "no-store" } },
  );
}

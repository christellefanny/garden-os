"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { VaultPlant } from "@/components/PlantVault";
import {
  buildGrowingTasks,
  loadCalendarOptions,
  reminderSnapshot,
  defaultMode,
  includedByDefault,
  localDay,
  shiftDay,
  type CalendarOptions,
} from "@/lib/growing-calendar";
import { calendarFocus, taskTiming } from "@/lib/calendar-focus";
import CalendarTaskCards from "@/components/CalendarTaskCards";
import InteriorHeader, { InteriorStats } from "@/components/InteriorHeader";
import Dialog from "@/components/ui/Dialog";
import PlantReminders from "@/components/PlantReminders";
import WeeklyBriefing from "@/components/WeeklyBriefing";
import WeeklyEmail from "@/components/WeeklyEmail";
import type { Garden } from "@/lib/garden";
import BotanicalCalendar from "@/components/BotanicalCalendar";

import PhoneReminders from "@/components/PhoneReminders";
export default function GrowingCalendar({
  userId,
  location,
  garden,
  gardens,
}: {
  userId: string;
  location?: string;
  garden?: Garden;
  gardens: Garden[];
}) {
  const [plants] = useState<VaultPlant[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`garden-os-plant-vault-${userId}`) || "[]",
      );
    } catch {
      return [];
    }
  });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addingReminder, setAddingReminder] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetail, setEditDetail] = useState("");
  const [editDate, setEditDate] = useState("");
  const [selectedPlantId, setSelectedPlantId] = useState(plants[0]?.id ?? "");
  const [controlsTarget, setControlsTarget] = useState<HTMLDivElement | null>(
    null,
  );
  const headingRef = useRef<HTMLElement>(null);
  const [dayOpen, setDayOpen] = useState(false);
  const [planningOpen, setPlanningOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(() =>
    localDay(),
  );
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  const [options, setOptions] = useState(() => loadCalendarOptions(userId));
  useEffect(() => {
    const refresh = () => setOptions(loadCalendarOptions(userId));
    window.addEventListener("garden-os-data-change", refresh);
    return () => window.removeEventListener("garden-os-data-change", refresh);
  }, [userId]);
  const [today] = useState(() => localDay());
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear),
    [month, setMonth] = useState(today.slice(0, 7)),
    [view, setView] = useState<"week" | "month">("month"),
    [message, setMessage] = useState("");
  const tasks = useMemo(
    () => buildGrowingTasks(plants, year, options),
    [plants, year, options],
  );
  const reminderTasks = useMemo(
    () => reminderSnapshot(plants, options, today),
    [plants, options, today],
  );
  const weeklyTasks = useMemo(
    () => [
      ...buildGrowingTasks(plants, currentYear - 1, options),
      ...buildGrowingTasks(plants, currentYear, options),
      ...buildGrowingTasks(plants, currentYear + 1, options),
    ],
    [plants, currentYear, options],
  );
  const focus = calendarFocus(weeklyTasks, today, shiftDay(today, 6));
  const detailTask = [...tasks, ...weeklyTasks].find(t => t.id === detailId);
  const timing = detailTask ? taskTiming(detailTask, options) : null;
  const shown = (view === "month" ? tasks : weeklyTasks).filter((t) =>
    view === "month"
      ? t.date.startsWith(month)
      : t.date >= today && t.date <= shiftDay(today, 6),
  );
  const visibleTasks =
    selectedDay && view === "month"
      ? shown.filter((t) => t.date === selectedDay)
      : shown;
  const selectableTasks = visibleTasks;
  const selectedVisible = selectableTasks.filter(t => selectedTaskIds.includes(t.id));
  const allSelected = selectableTasks.length > 0 && selectedVisible.length === selectableTasks.length;
  function markSelectedDone() {
    if (!selectedVisible.length) return;
    const updated = { ...options.tasks };
    for (const task of selectedVisible) updated[task.id] = { ...updated[task.id], status: "done" };
    if (save({ ...options, tasks: updated })) {
      setSelectedTaskIds([]);
      setMessage(`${selectedVisible.length} tasks marked done.`);
    }
  }
  function deleteSelectedTasks() {
    if (!selectedVisible.length) return;
    const ids = new Set(selectedVisible.map(t => t.id));
    const updated = { ...options.tasks };
    for (const task of selectedVisible) {
      if (!task.id.startsWith("custom|")) updated[task.id] = { ...updated[task.id], hidden: true };
      else delete updated[task.id];
    }
    const next = {
      ...options,
      tasks: updated,
      reminders: (options.reminders || []).filter(r => !ids.has(r.id)),
    };
    if (save(next)) {
      setSelectedTaskIds([]);
      setConfirmBulkDelete(false);
      setMessage(`${selectedVisible.length} tasks removed from your calendar.`);
    }
  }
  function save(next: CalendarOptions) {
    try {
      localStorage.setItem(
        `garden-os-calendar-${userId}`,
        JSON.stringify(next),
      );
      setOptions(next);
      setMessage("");
      return true;
    } catch {
      setMessage(
        "Could not save calendar changes in this browser. Try exporting your vault to keep a backup.",
      );
      return false;
    }
  }
  function editTaskSave(event: React.FormEvent) {
    event.preventDefault();
    if (!editingTaskId || !editTitle.trim() || !editDate) return;
    const updated = {
      ...options.tasks,
      [editingTaskId]: { ...options.tasks[editingTaskId], title: editTitle.trim(), detail: editDetail.trim(), date: editDate },
    };
    if (save({ ...options, tasks: updated })) {
      setEditingTaskId(null);
      setMessage("Task updated.");
    }
  }
  function taskChange(id: string, value: CalendarOptions["tasks"][string]) {
    save({ ...options, tasks: { ...options.tasks, [id]: { ...options.tasks[id], ...value } } });
  }
  const active = plants.filter(
    (p) => options.plants[p.id]?.included ?? includedByDefault(p),
  ).length;
  return (
    <section
      className="interior-page conservatory-calendar atelier-welcoming-page outline-none"
      ref={headingRef}
      tabIndex={-1}
    >
      <InteriorHeader
        illustration="calendar"
        title="Growing Calendar"
        eyebrow={`${location || "Your growing year"} · ${year}`}
        description="See care reminders and upcoming sowing, planting, and harvest tasks. Choose the plants and planning dates that fit your garden."
      >
        <button
          type="button"
          onClick={() => setAddingReminder(true)}
          className="seasonal-button"
        >
          Add reminder
        </button>
        <button
          type="button"
          onClick={() => setPlanningOpen(true)}
          className="seasonal-outline"
        >
          Plants & planting dates
        </button>
      </InteriorHeader>

      <section className="seasonal-card my-6 rounded-2xl border p-5 sm:p-7" aria-labelledby="calendar-focus-title">
        <p className="modern-eyebrow">Your next steps</p>
        <h2 id="calendar-focus-title" className="font-serif text-3xl">Today & this week</h2>
        <p className="seasonal-muted mt-2 text-sm">Start with today. Open a task for its plants, instructions and timing. Suggested dates are flexible planning targets.</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <section><h3 className="mb-3 text-lg font-semibold">Today · {focus.today.length}</h3>
            {focus.today.length ? <CalendarTaskCards options={options} tasks={focus.today} onOpen={setDetailId} /> : <p className="seasonal-muted py-4">Nothing scheduled today. Enjoy a little breathing room.</p>}
          </section>
          <section><h3 className="mb-3 text-lg font-semibold">Coming up this week · {focus.upcoming.length}</h3>
            {focus.upcoming.length ? <CalendarTaskCards options={options} tasks={focus.upcoming} onOpen={setDetailId} /> : <p className="seasonal-muted py-4">No more tasks scheduled this week.</p>}
          </section>
        </div>
        {!!focus.review.length && <details className="mt-5 border-t pt-4"><summary className="cursor-pointer text-sm font-semibold">Review earlier tasks · {focus.review.length}</summary><p className="seasonal-muted my-3 text-sm">These dates have passed. Check whether each task still applies, then reschedule it or mark it not needed. A past date alone does not mean a plant is at risk.</p><CalendarTaskCards options={options} tasks={focus.review} onOpen={setDetailId} /></details>}
      </section>

      <details className="mb-5"><summary className="cursor-pointer text-sm font-semibold">Planning overview & frost dates</summary>
      <InteriorStats
        items={[
          { label: "Plants in your plan", value: active },
          {
            label: "Steps this week",
            value: weeklyTasks.filter(
              (t) =>
                t.date >= today && t.date <= shiftDay(today, 6) && !t.status,
            ).length,
          },
          {
            label: "Spring frost anchor",
            value: new Date(
              `2000-${options.lastFrost}T12:00:00`,
            ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          },
          {
            label: "Fall frost anchor",
            value: new Date(
              `2000-${options.firstFrost}T12:00:00`,
            ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          },
        ]}
      />
      </details>

      {userId !== "guest" && (
        <PhoneReminders
          userId={userId}
          tasks={reminderTasks}
          showControls={addingReminder && !!controlsTarget}
          controlsTarget={controlsTarget}
        />
      )}
      {userId === "guest" && addingReminder && (
        <p className="interior-notice">
          Your calendar reminders are saved on this device. Background phone
          delivery requires an account; use Save to an account above.
        </p>
      )}
      {addingReminder && (
        <Dialog title="Add reminder" onClose={() => setAddingReminder(false)}>
          {plants.length ? (
            <>
              <label className="block text-sm font-bold">
                Plant
                <select
                  className="seasonal-input mt-2 w-full rounded-xl border p-3"
                  value={selectedPlantId}
                  onChange={(event) => setSelectedPlantId(event.target.value)}
                >
                  {[...plants]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name}
                        {plant.variety ? ` · ${plant.variety}` : ""}
                      </option>
                    ))}
                </select>
              </label>
              {plants.find((plant) => plant.id === selectedPlantId) && (
                <PlantReminders
                  key={selectedPlantId}
                  plant={plants.find((plant) => plant.id === selectedPlantId)!}
                  options={options}
                  onSave={save}
                />
              )}
            </>
          ) : (
            <p className="seasonal-muted">
              Add a plant to your Plant Vault first to create a plant reminder.
            </p>
          )}
          <div ref={setControlsTarget} />
        </Dialog>
      )}
      {planningOpen && (
        <Dialog
          title="Choose plants and adjust planning dates"
          onClose={() => setPlanningOpen(false)}
        >
          <p className="seasonal-muted mt-3 text-sm">Location is optional. Set your own frost dates below to adjust planting recommendations. These dates are planning estimates, not a local weather forecast.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold">
              Spring frost planning date
              <input
                aria-label="Spring frost planning date"
                type="date"
                value={`${year}-${options.lastFrost}`}
                onChange={(e) => {
                  if (e.target.value)
                    save({ ...options, lastFrost: e.target.value.slice(5) });
                }}
                className="seasonal-input mt-2 block rounded-xl border p-2"
              />
            </label>
            <label className="text-sm font-bold">
              Fall frost planning date
              <input
                aria-label="Fall frost planning date"
                type="date"
                value={`${year}-${options.firstFrost}`}
                onChange={(e) => {
                  if (e.target.value)
                    save({ ...options, firstFrost: e.target.value.slice(5) });
                }}
                className="seasonal-input mt-2 block rounded-xl border p-2"
              />
            </label>
          </div>
          <p className="seasonal-muted mt-3 text-xs">
            May 15 and October 15 are adjustable planning anchors, not
            guaranteed frost dates. Past-only and “Not Growing Again” entries
            are excluded by default.
          </p>
          <div className="mt-4 grid max-h-80 gap-2 overflow-auto sm:grid-cols-2">
            {[...plants]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => (
                <div
                  key={p.id}
                  className="seasonal-outline flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        options.plants[p.id]?.included ?? includedByDefault(p)
                      }
                      onChange={(e) =>
                        save({
                          ...options,
                          plants: {
                            ...options.plants,
                            [p.id]: {
                              ...options.plants[p.id],
                              included: e.target.checked,
                            },
                          },
                        })
                      }
                    />
                    {p.name}
                    {p.variety ? ` · ${p.variety}` : ""}
                  </label>
                  <select
                    aria-label={`Growing setting for ${p.name} ${p.variety}`}
                    value={options.plants[p.id]?.mode ?? defaultMode(p)}
                    onChange={(e) =>
                      save({
                        ...options,
                        plants: {
                          ...options.plants,
                          [p.id]: {
                            ...options.plants[p.id],
                            mode: e.target.value as "indoor" | "outdoor",
                          },
                        },
                      })
                    }
                    className="seasonal-input rounded-lg border p-2 text-xs"
                  >
                    <option value="outdoor">Outdoor</option>
                    <option value="indoor">Indoor</option>
                  </select>
                </div>
              ))}
          </div>
        </Dialog>
      )}
      <WeeklyEmail guest={userId === "guest"} gardens={gardens} gardenId={garden?.id || ""} />
      <div className="interior-toolbar calendar-toolbar">
        <button
          aria-pressed={view === "week"}
          onClick={() => {
            setDayOpen(true);
            setView("week");
            setSelectedDay(null);
            setYear(currentYear);
          }}
          className={`rounded-xl border px-4 py-3 font-bold ${view === "week" ? "seasonal-button text-white" : "seasonal-outline"}`}
        >
          This Week
        </button>
        <button
          aria-pressed={view === "month"}
          onClick={() => {
            setView("month");
            setSelectedDay(`${month}-01`);
            setYear(Number(month.slice(0, 4)));
          }}
          className={`rounded-xl border px-4 py-3 font-bold ${view === "month" ? "seasonal-button text-white" : "seasonal-outline"}`}
        >
          Monthly Calendar
        </button>
        {view === "month" && (
          <label className="text-sm font-bold">
            Month
            <input
              aria-label="Calendar month"
              type="month"
              value={month}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDay(`${e.target.value}-01`);
                  setMonth(e.target.value);
                  setYear(Number(e.target.value.slice(0, 4)));
                }
              }}
              className="seasonal-input ml-2 rounded-xl border p-2"
            />
          </label>
        )}
      </div>
      {view === "month" && (
        <BotanicalCalendar
          month={month}
          today={today}
          tasks={tasks}
          selectedDay={selectedDay}
          onSelect={(date) => {
            setSelectedDay(date);
            setSelectedTaskIds([]);
            const dayTasks = tasks.filter(task => task.date === date);
            if (dayTasks.length === 1) {
              setDayOpen(false);
              setDetailId(dayTasks[0].id);
            } else setDayOpen(true);
          }}
          onTask={(id) => { setDayOpen(false); setDetailId(id); }}
          onMonth={(value) => {
            setMonth(value);
            setYear(Number(value.slice(0, 4)));
            setSelectedDay(`${value}-01`);
          }}
        />
      )}

      {editingTaskId && <Dialog title="Edit calendar task" onClose={() => setEditingTaskId(null)}>
        <form className="mt-3 grid gap-4" onSubmit={editTaskSave}>
          <label className="grid gap-2 text-sm font-semibold">Task name<input className="seasonal-input rounded-lg border p-3" required maxLength={180} value={editTitle} onChange={e => setEditTitle(e.target.value)} /></label>
          <label className="grid gap-2 text-sm font-semibold">Description<textarea className="seasonal-input rounded-lg border p-3" rows={4} maxLength={5000} value={editDetail} onChange={e => setEditDetail(e.target.value)} /></label>
          <label className="grid gap-2 text-sm font-semibold">Date<input className="seasonal-input rounded-lg border p-3" type="date" required value={editDate} onChange={e => setEditDate(e.target.value)} /></label>
          <p className="seasonal-muted text-xs">Changes to suggested tasks apply only to this task, not your other plant recommendations.</p>
          <div className="flex gap-3"><button className="seasonal-button rounded-lg px-4 py-2" type="submit">Save changes</button><button type="button" className="seasonal-outline rounded-lg border px-4 py-2" onClick={() => setEditingTaskId(null)}>Cancel</button></div>
        </form>
      </Dialog>}
      {confirmBulkDelete && <Dialog title="Delete selected calendar tasks?" onClose={() => setConfirmBulkDelete(false)}>
        <p className="text-sm">Remove {selectedVisible.length} selected tasks? Saved reminders will be deleted. Planning suggestions will be hidden from your calendar. This cannot be undone from this dialog.</p>
        <div className="mt-5 flex gap-3">
          <button type="button" className="seasonal-button rounded-lg px-4 py-2" onClick={deleteSelectedTasks}>Delete {selectedVisible.length} tasks</button>
          <button type="button" className="seasonal-outline rounded-lg border px-4 py-2" onClick={() => setConfirmBulkDelete(false)}>Cancel</button>
        </div>
      </Dialog>}
      {!plants.length && (
        <p className="seasonal-card mt-5 rounded-xl border p-6">
          Add plants in Plant Vault first, then return here to build your
          calendar.
        </p>
      )}
      {dayOpen && !detailTask && !editingTaskId && !confirmBulkDelete && <Dialog title={selectedDay
        ? new Date(`${selectedDay}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })
        : "This week’s tasks"} onClose={() => { setDayOpen(false); if (view === "week") { setView("month"); setYear(Number(month.slice(0, 4))); } }}>
        <p className="seasonal-muted mb-4 text-sm">Choose a task for its instructions, timing and completion controls.</p>
      {visibleTasks.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" aria-label="Select all visible calendar tasks" checked={allSelected} onChange={e => setSelectedTaskIds(e.target.checked ? visibleTasks.map(t => t.id) : [])} />
            Select all ({visibleTasks.length})
          </label>
          {selectedVisible.length > 0 && <>
            <span className="seasonal-muted text-sm">{selectedVisible.length} selected</span>
            <button type="button" className="seasonal-button rounded-lg px-4 py-2 text-sm" onClick={markSelectedDone}>Mark selected done</button>
            <button type="button" className="seasonal-outline rounded-lg border px-4 py-2 text-sm" onClick={() => setConfirmBulkDelete(true)}>Delete selected</button>
            <button type="button" className="seasonal-link text-sm underline" onClick={() => setSelectedTaskIds([])}>Clear selection</button>
          </>}
        </div>
      )}

        {!visibleTasks.length && <p className="py-5">Nothing scheduled for this day. Enjoy a little breathing room.</p>}
        <CalendarTaskCards options={options} key={`${selectedDay || view}-${month}`} tasks={visibleTasks} onOpen={setDetailId} selected={selectedTaskIds} onSelect={(id, checked) => setSelectedTaskIds(current => checked ? [...new Set([...current, id])] : current.filter(value => value !== id))} />
        {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      </Dialog>}
      {detailTask && timing && <Dialog title={detailTask.title} onClose={() => setDetailId(null)}>
        {dayOpen && <button type="button" className="seasonal-link mb-3 min-h-11" onClick={() => setDetailId(null)}>← Back to tasks</button>}
        <p className="text-lg font-semibold">{detailTask.plant}</p>
        <p className="seasonal-muted mt-2 text-sm">{detailTask.id.startsWith("custom|") ? "You saved this reminder." : "Suggested from your saved plants and calendar planning dates. Check plant stage and local conditions before acting."}</p>
        <dl className="my-5 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold">Scheduled for</dt><dd>{detailTask.date}</dd></div>
          <div><dt className="text-xs font-semibold">Time needed</dt><dd>{timing.duration}</dd></div>
          <div><dt className="text-xs font-semibold">Deadline</dt><dd>{timing.deadline ? `${timing.deadline} (set by you)` : "No fixed deadline recorded"}</dd></div>
        </dl>
        <h3 className="font-semibold">What to do</h3><p className="seasonal-muted mt-2 whitespace-pre-wrap text-sm leading-7">{detailTask.detail}</p>
        <div className="my-5 flex flex-wrap gap-3">
          {detailTask.status ? <><span>{detailTask.status === "done" ? "Completed" : "Not needed"}</span><button type="button" className="seasonal-outline min-h-11 rounded-lg border px-4" onClick={() => taskChange(detailTask.id, { status: undefined })}>Undo</button></> : <>
            <button type="button" className="seasonal-button min-h-11 rounded-lg px-4" onClick={() => { taskChange(detailTask.id, { status: "done" }); }}>Mark done</button>
            <button type="button" className="seasonal-outline min-h-11 rounded-lg border px-4" onClick={() => { taskChange(detailTask.id, { status: "skipped" }); }}>Not needed</button>
          </>}
          <button type="button" className="seasonal-link min-h-11" onClick={() => { setDetailId(null); setEditingTaskId(detailTask.id); setEditTitle(detailTask.title); setEditDetail(detailTask.detail); setEditDate(detailTask.date); }}>Edit instructions</button>
        </div>
        <form key={`${detailTask.id}-${detailTask.date}`} className="grid gap-4 rounded-xl border p-4" onSubmit={event => {
          event.preventDefault(); const form = new FormData(event.currentTarget);
          const date = String(form.get("date")); const dueDate = String(form.get("deadline") || "");
          if (dueDate && dueDate < date) { setMessage("The deadline must be on or after the scheduled date."); return; }
          const minutes = Number(form.get("minutes")) || undefined;
          if (save({ ...options, tasks: { ...options.tasks, [detailTask.id]: { ...options.tasks[detailTask.id], date, dueDate, minutes } } })) setMessage("Task timing saved.");
        }}>
          <label className="grid gap-2 text-sm">Reschedule<input name="date" type="date" required defaultValue={detailTask.date} className="seasonal-input rounded-lg border p-3" /></label>
          <label className="grid gap-2 text-sm">Deadline (optional)<input name="deadline" type="date" defaultValue={timing.deadline} className="seasonal-input rounded-lg border p-3" /></label>
          <label className="grid gap-2 text-sm">Your time estimate in minutes (optional)<input name="minutes" type="number" min="1" max="1440" step="1" defaultValue={options.tasks[detailTask.id]?.minutes || ""} className="seasonal-input rounded-lg border p-3" /></label>
          <p className="seasonal-muted text-xs">Use a deadline only when you know one applies. Estimates depend on the number of plants and the work involved.</p>
          <button type="submit" className="seasonal-button min-h-11 rounded-lg px-4">Save timing</button>
        </form>
        {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      </Dialog>}

      <WeeklyBriefing
        guest={userId === "guest"}
        garden={garden}
        options={options}
        onSave={save}
      />
      <p className="seasonal-muted mt-6 text-xs leading-6">
        Planning guidance:{" "}
        <a
          href="https://extension.illinois.edu/gardening/when-plant"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Illinois Extension planting guide
        </a>{" "}
        and{" "}
        <a
          href="https://extension.illinois.edu/blogs/good-growing/2023-02-10-when-should-i-start-my-seeds"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          seed-starting guidance
        </a>
        . Flower and fruit care entries are review prompts; use species-specific
        instructions. Planning choices sync with your account when cloud storage
        is connected.
      </p>
    </section>
  );
}

"use client";
import { useMemo, useState } from "react";
import type { VaultPlant } from "@/components/PlantVault";
import {
  buildGrowingTasks,
  calendarDefaults,
  defaultMode,
  includedByDefault,
  localDay,
  shiftDay,
  type CalendarOptions,
} from "@/lib/growing-calendar";
import PhoneReminders from "@/components/PhoneReminders";
function loadOptions(userId: string): CalendarOptions {
  try {
    const v = JSON.parse(
      localStorage.getItem(`garden-os-calendar-${userId}`) || "null",
    );
    if (
      v &&
      /^\d{2}-\d{2}$/.test(v.lastFrost) &&
      /^\d{2}-\d{2}$/.test(v.firstFrost) &&
      v.plants &&
      v.tasks
    )
      return v;
  } catch {}
  return calendarDefaults;
}
export default function GrowingCalendar({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
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
  const [options, setOptions] = useState(() => loadOptions(userId));
  const [today] = useState(() => localDay());
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(currentYear),
    [month, setMonth] = useState(today.slice(0, 7)),
    [view, setView] = useState<"week" | "month">("week"),
    [message, setMessage] = useState("");
  const tasks = useMemo(
    () => buildGrowingTasks(plants, year, options),
    [plants, year, options],
  );
  const reminderTasks = useMemo(
    () =>
      [
        ...buildGrowingTasks(plants, currentYear, options),
        ...buildGrowingTasks(plants, currentYear + 1, options),
      ]
        .filter(
          (t) => !t.status && t.date >= today && t.date <= shiftDay(today, 365),
        )
        .map((t) => ({
          id: t.id,
          date: t.date,
          title: t.title,
          plant: t.plant,
        })),
    [plants, currentYear, options, today],
  );
  const weeklyTasks = useMemo(
    () => [
      ...buildGrowingTasks(plants, currentYear, options),
      ...buildGrowingTasks(plants, currentYear + 1, options),
    ],
    [plants, currentYear, options],
  );
  const shown = (view === "month" ? tasks : weeklyTasks).filter((t) =>
    view === "month"
      ? t.date.startsWith(month)
      : t.date >= today && t.date <= shiftDay(today, 7),
  );
  function save(next: CalendarOptions) {
    try {
      localStorage.setItem(
        `garden-os-calendar-${userId}`,
        JSON.stringify(next),
      );
      setOptions(next);
      setMessage("");
    } catch {
      setMessage(
        "Could not save calendar changes in this browser. Try exporting your vault to keep a backup.",
      );
    }
  }
  function taskChange(id: string, value: CalendarOptions["tasks"][string]) {
    save({ ...options, tasks: { ...options.tasks, [id]: value } });
  }
  const active = plants.filter(
    (p) => options.plants[p.id]?.included ?? includedByDefault(p),
  ).length;
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow seasonal-muted">
            Plainfield, Illinois · Central Time
          </p>
          <h2 className="editorial-title seasonal-heading mt-2 text-4xl">
            Growing Calendar
          </h2>
          <p className="seasonal-muted mt-2">
            A year of useful next steps, shaped by your Plant Vault.
          </p>
        </div>
        <button
          onClick={onClose}
          className="seasonal-outline rounded-xl border px-4 py-3 font-bold"
        >
          Back to garden
        </button>
      </div>
      <p className="seasonal-muted mt-4 text-sm">
        {active} plants included. Similar varieties share a task. Dates are
        planning reminders—check your seed packet, soil and local forecast
        before planting.
      </p>
      <PhoneReminders userId={userId} tasks={reminderTasks} />
      <details className="seasonal-card mt-5 rounded-2xl border p-5">
        <summary className="seasonal-heading cursor-pointer font-bold">
          Choose plants and adjust planning dates
        </summary>
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
          May 15 and October 15 are adjustable planning anchors, not guaranteed
          frost dates. Past-only and “Not Growing Again” entries are excluded by
          default.
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
      </details>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          aria-pressed={view === "week"}
          onClick={() => {
            setView("week");
            setYear(currentYear);
          }}
          className={`rounded-xl border px-4 py-3 font-bold ${view === "week" ? "seasonal-button text-white" : "seasonal-outline"}`}
        >
          This Week
        </button>
        <button
          aria-pressed={view === "month"}
          onClick={() => setView("month")}
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
                  setMonth(e.target.value);
                  setYear(Number(e.target.value.slice(0, 4)));
                }
              }}
              className="seasonal-input ml-2 rounded-xl border p-2"
            />
          </label>
        )}
      </div>
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
      {!plants.length && (
        <p className="seasonal-card mt-5 rounded-2xl border p-6">
          Add plants in Plant Vault first, then return here to build your
          calendar.
        </p>
      )}
      {!!plants.length && !shown.length && (
        <p className="seasonal-card mt-5 rounded-2xl border p-6">
          No tasks in this view. Browse another month or adjust the plants
          included in your plan.
        </p>
      )}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {shown.map((t) => (
          <article key={t.id} className="seasonal-card rounded-2xl border p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="eyebrow seasonal-muted">{t.plant}</p>
              <time
                dateTime={t.date}
                className="seasonal-muted whitespace-nowrap text-xs"
              >
                {new Date(t.date + "T12:00:00Z").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  timeZone: "America/Chicago",
                })}
              </time>
            </div>
            <h3 className="seasonal-heading mt-2 text-lg font-bold">
              {t.title}
            </h3>
            <p className="seasonal-muted mt-2 text-sm leading-6">{t.detail}</p>
            {t.status ? (
              <div className="mt-4 flex items-center gap-4">
                <span className="seasonal-icon rounded-full px-3 py-1 text-xs font-bold">
                  {t.status === "done" ? "Completed" : "Skipped"}
                </span>
                <button
                  onClick={() =>
                    taskChange(t.id, { date: options.tasks[t.id]?.date })
                  }
                  className="seasonal-link text-sm font-bold"
                >
                  Undo
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() =>
                    taskChange(t.id, { ...options.tasks[t.id], status: "done" })
                  }
                  className="seasonal-button rounded-xl px-3 py-2 text-sm font-bold text-white"
                >
                  Mark done
                </button>
                <button
                  onClick={() =>
                    taskChange(t.id, {
                      ...options.tasks[t.id],
                      status: "skipped",
                    })
                  }
                  className="seasonal-link px-2 py-2 text-sm font-bold"
                >
                  Skip
                </button>
                <label className="text-xs font-bold">
                  Move to
                  <input
                    aria-label={`Move ${t.title} for ${t.plant} to date`}
                    type="date"
                    value={t.date}
                    onChange={(e) => {
                      if (e.target.value)
                        taskChange(t.id, { date: e.target.value });
                    }}
                    className="seasonal-input ml-2 rounded-lg border p-2"
                  />
                </label>
              </div>
            )}
          </article>
        ))}
      </div>
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
        instructions. Calendar choices are saved in this browser.
      </p>
    </section>
  );
}

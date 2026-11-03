"use client";
import { useCallback, useEffect, useState } from "react";
import { GUEST_ID, readGuest } from "@/lib/guest";
import { buildWeeklyBrief } from "@/lib/weekly-brief";
import { loadCalendarOptions, localDay } from "@/lib/growing-calendar";
import { supabase } from "@/lib/supabase";
import type { CalendarOptions } from "@/lib/growing-calendar";
import type { Garden } from "@/lib/garden";
import type {
  BriefAction,
  WeeklyBrief,
} from "@/lib/weekly-brief";
import WeeklyEmail from "@/components/WeeklyEmail";
async function requestBrief(
  gardenId: string,
  signal?: AbortSignal,
  guest = false,
): Promise<WeeklyBrief> {
  if (guest) {
    const state = readGuest();
    const garden = state.gardens.find(g => g.id === gardenId);
    if (!garden) throw new Error("Create a garden first to prepare your weekly briefing.");
    return buildWeeklyBrief({ garden, spaces: state.spaces,
      vault: JSON.parse(localStorage.getItem(`garden-os-plant-vault-${GUEST_ID}`) || "[]"),
      calendar: loadCalendarOptions(GUEST_ID), today: localDay(),
      weather: { location: garden.location || "Location not set", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, periods: [], alerts: [], warning: "Live weather is unavailable in this device-only briefing. Check your local forecast before acting." },
      sources: [],
    });
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session)
    throw new Error("Sign in again to read your weekly briefing.");
  // Read after local edits have been acknowledged by version-checked cloud sync.
  // Never flush or overwrite records from the briefing route.
  const pendingKey = `garden-os-sync-pending-${data.session.user.id}`;
  const deadline = Date.now() + 12000;
  while (true) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    let pending: Record<string, string>;
    try {
      pending = JSON.parse(localStorage.getItem(pendingKey) || "{}");
    } catch {
      throw new Error(
        "Cloud sync status could not be read. Review synchronization in Settings.",
      );
    }
    if (
      !Object.keys(pending).some(
        (key) =>
          key === `garden-os-calendar-${data.session!.user.id}` ||
          key === `garden-os-plant-vault-${data.session!.user.id}`,
      )
    )
      break;
    if (Date.now() > deadline)
      throw new Error(
        "Your latest garden edits are still waiting to sync. Review Settings, then refresh the briefing; local records remain safe.",
      );
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  const r = await fetch(
    `/api/weekly-brief?garden=${encodeURIComponent(gardenId)}`,
    {
      signal,
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    },
  );
  const value = await r.json();
  if (!r.ok) throw new Error(value.error || "Could not prepare your briefing.");
  return value;
}
export default function WeeklyBriefing({
  garden,
  guest = false,
  gardens,
  options,
  onSave,
}: {
  garden?: Garden;
  guest?: boolean;
  gardens: Garden[];
  options: CalendarOptions;
  onSave: (next: CalendarOptions) => boolean;
}) {
  const [brief, setBrief] = useState<WeeklyBrief | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const chosenGarden = options.weekly?.gardenId || garden?.id || "";
  const generate = useCallback(async () => {
    setBusy(true);
    setMessage("");
    try {
      setBrief(await requestBrief(chosenGarden, undefined, guest));
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not prepare your briefing.",
      );
    } finally {
      setBusy(false);
    }
  }, [chosenGarden, guest]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("brief") !== "weekly")
      return;
    const controller = new AbortController();
    requestBrief(chosenGarden, controller.signal, guest)
      .then((value) => {
        if (!controller.signal.aborted) setBrief(value);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setMessage(e.message);
      });
    return () => controller.abort();
  }, [chosenGarden, guest]);
  function actions(title: string, list: BriefAction[]) {
    return (
      list.length > 0 && (
        <section className="weekly-section">
          <h3>{title}</h3>
          <ol>
            {list.map((a) => (
              <li key={a.id}>
                <div className="weekly-action-heading">
                  <h4>{a.title}</h4>
                  <span>{a.when}</span>
                </div>
                <p>{a.why}</p>
                {a.plants.length > 0 && (
                  <p className="weekly-context">{a.plants.join(" · ")}</p>
                )}
                {a.spaces.length > 0 && (
                  <p className="weekly-context">Where: {a.spaces.join(", ")}</p>
                )}
                <ul>
                  {a.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
                <div className="weekly-source-links">
                  {a.sources.map((id) => {
                    const s = brief?.sources.find((s) => s.id === id);
                    return s ? (
                      <a key={id} href={s.url} target="_blank" rel="noreferrer">
                        {s.title}
                        {s.available === false ? " (not checked live)" : ""}
                      </a>
                    ) : null;
                  })}
                </div>
                {a.taskIds?.map((id) => (
                  <button
                    key={id}
                    className="seasonal-outline"
                    onClick={() => {
                      if (
                        onSave({
                          ...options,
                          tasks: {
                            ...options.tasks,
                            [id]: { ...options.tasks[id], status: "done" },
                          },
                        })
                      ) {
                        setBrief((current) =>
                          current
                            ? {
                                ...current,
                                savedTasks: current.savedTasks.filter(
                                  (t) => t.id !== id,
                                ),
                              }
                            : null,
                        );
                      }
                    }}
                  >
                    Mark complete
                  </button>
                ))}
              </li>
            ))}
          </ol>
        </section>
      )
    );
  }
  return (
    <section className="weekly-briefing seasonal-card" id="weekly-brief">
      <div className="weekly-heading">
        <div>
          <p className="modern-eyebrow">A useful week in the garden</p>
          <h2>Weekly garden priorities</h2>
          <p>
            Specific actions from your saved garden, current forecast, and
            reviewed Extension guidance.
          </p>
        </div>
        <div className="interior-actions">
          <button
            className="seasonal-button"
            onClick={generate}
            disabled={busy || !garden}
          >
            {busy
              ? "Checking garden and sources…"
              : brief
                ? "Refresh briefing"
                : "Read this week’s briefing"}
          </button>
          <WeeklyEmail compact guest={guest} gardens={gardens} gardenId={garden?.id || ""} />
        </div>
      </div>
      {message && <p role="status">{message}</p>}
      {brief && (
        <article aria-label="Weekly garden briefing">
          <header className="weekly-report-header">
            <h3>
              Garden priorities:{" "}
              {new Date(brief.start + "T12:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
              –
              {new Date(brief.end + "T12:00:00").toLocaleDateString("en-US", {
                day: "numeric",
              })}
            </h3>
            <p>
              {brief.garden} · {brief.location}
            </p>
            <p>{brief.summary}</p>
            <p className="weekly-context">
              Prepared {new Date(brief.generated).toLocaleString()}
              {brief.weather.updated
                ? ` · Forecast issued ${new Date(brief.weather.updated).toLocaleString()}`
                : ""}
            </p>
          </header>
          {brief.weather.alerts.length > 0 && (
            <aside className="interior-notice">
              <h4>Official weather alerts</h4>
              {brief.weather.alerts.map((a) => (
                <p key={a}>{a}</p>
              ))}
            </aside>
          )}
          {brief.weather.periods.length > 0 && (
            <details className="weekly-weather">
              <summary>See forecast periods</summary>
              <ul>
                {brief.weather.periods
                  .filter((p) => p.date >= brief.start && p.date <= brief.end)
                  .map((p, i) => (
                    <li key={i}>
                      {p.date} · {p.name}: {p.high ?? p.low}°F · {p.summary} ·{" "}
                      {p.rain}% precipitation chance
                    </li>
                  ))}
              </ul>
              <a
                href={`https://forecast.weather.gov/MapClick.php?lat=${brief.weather.latitude}&lon=${brief.weather.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                National Weather Service forecast
              </a>
              <p className="weekly-context">
                Location lookup: Open-Meteo / GeoNames. Forecast: National
                Weather Service.
              </p>
            </details>
          )}
          {actions("Do now — three highest priorities", brief.priorities)}
          {!brief.priorities.length && (
            <p>
              No urgent plant-specific priorities were identified from the
              current records.
            </p>
          )}
          {actions("Buy or prepare next", brief.prepare)}
          {actions("Can wait", brief.wait)}
          {actions("Your reminders and calendar steps", brief.savedTasks)}
          {brief.harvests.length > 0 && (
            <details>
              <summary>Recorded harvests this season</summary>
              {brief.harvests.map((h) => (
                <p key={h.plant + "|" + h.unit}>
                  {h.plant}: {h.quantity.toLocaleString()} {h.unit} ·{" "}
                  {h.records} harvest records
                </p>
              ))}
            </details>
          )}
          {brief.observations.length > 0 && (
            <details>
              <summary>Recent recorded observations</summary>
              {brief.observations.map((o, i) => (
                <p key={i}>
                  {o.date} · {o.space} · {o.kind}: {o.text || "No written note"}
                </p>
              ))}
            </details>
          )}
          {brief.excluded.length > 0 && (
            <p className="weekly-context">
              Excluded from new planting recommendations:{" "}
              {brief.excluded.join(", ")}. Existing growing plants remain
              eligible for care advice.
            </p>
          )}
          {brief.planningNotes && (
            <details>
              <summary>Your planning notes</summary>
              <p>{brief.planningNotes}</p>
              <p className="weekly-context">
                Notes are shown for context; free-text plans are not
                automatically interpreted or treated as completed work.
              </p>
            </details>
          )}
          <details>
            <summary>How this briefing is prepared</summary>
            {brief.limitations.map((l) => (
              <p key={l}>{l}</p>
            ))}
            <p>
              Uses cloud-saved growing plants, linked beds, collection statuses,
              calendar modes and exclusions, saved reminders, completed steps,
              and recent journal records. Source-based rules prioritize relevant
              actions; this is not an open-ended AI diagnosis. Forecasts cover
              the remaining week and should be rechecked before acting.
            </p>
          </details>
        </article>
      )}
    </section>
  );
}

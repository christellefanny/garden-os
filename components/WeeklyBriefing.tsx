"use client";
import { useCallback, useEffect, useState } from "react";
import { GUEST_ID, readGuest } from "@/lib/guest";
import { buildWeeklyBrief } from "@/lib/weekly-brief";
import { loadCalendarOptions, localDay } from "@/lib/growing-calendar";
import { supabase } from "@/lib/supabase";
import { useCloudData } from "@/components/CloudDataBoundary";
import type { CalendarOptions } from "@/lib/growing-calendar";
import type { Garden } from "@/lib/garden";
import type {
  BriefAction,
  WeeklyBrief,
  WeeklyPreferences,
} from "@/lib/weekly-brief";
import Dialog from "@/components/ui/Dialog";
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
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
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
  const sync = useCloudData();
  const [brief, setBrief] = useState<WeeklyBrief | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [settings, setSettings] = useState(false);
  const [draft, setDraft] = useState<WeeklyPreferences>(
    () =>
      options.weekly || { enabled: false, day: 1, gardenId: garden?.id || "" },
  );
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
  function save() {
    if (
      !gardens.some((g) => g.id === draft.gardenId) ||
      !Number.isInteger(draft.day) ||
      draft.day < 0 ||
      draft.day > 6
    ) {
      setMessage("Choose a garden and delivery day.");
      return;
    }
    if (
      (draft.latitude === undefined) !== (draft.longitude === undefined) ||
      (draft.latitude !== undefined &&
        (!Number.isFinite(draft.latitude) || Math.abs(draft.latitude) > 90)) ||
      (draft.longitude !== undefined &&
        (!Number.isFinite(draft.longitude) || Math.abs(draft.longitude) > 180))
    ) {
      setMessage(
        "Enter both valid latitude and longitude, or leave both blank.",
      );
      return;
    }
    if (onSave({ ...options, weekly: draft })) {
      setSettings(false);
      setBrief(null);
      setMessage(
        "Weekly preferences saved. Phone delivery requires notifications enabled on this device and completed cloud synchronization.",
      );
    }
  }
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
          <button
            className="seasonal-outline"
            onClick={() => {
              setDraft(
                options.weekly || {
                  enabled: false,
                  day: 1,
                  gardenId: garden?.id || "",
                },
              );
              setSettings(true);
            }}
          >
            Weekly settings
          </button>
        </div>
      </div>
      <p className="weekly-delivery">
        {options.weekly?.enabled
          ? `${days[options.weekly.day]} morning briefing · phone notifications must be enabled`
          : "Weekly phone briefing is off. You can read it anytime."}{" "}
        · {sync.status}
      </p>
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
      {settings && (
        <Dialog
          title="Weekly garden briefing"
          onClose={() => setSettings(false)}
        >
          <div className="weekly-settings">
            <label>
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) =>
                  setDraft({ ...draft, enabled: e.target.checked })
                }
              />{" "}
              Send a weekly phone briefing
            </label>
            <label>
              Garden
              <select
                className="seasonal-input"
                aria-label="Weekly briefing garden"
                value={draft.gardenId}
                onChange={(e) =>
                  setDraft({ ...draft, gardenId: e.target.value })
                }
              >
                {gardens.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Delivery day
              <select
                className="seasonal-input"
                aria-label="Delivery day"
                value={draft.day}
                onChange={(e) =>
                  setDraft({ ...draft, day: Number(e.target.value) })
                }
              >
                {days.map((day, i) => (
                  <option key={day} value={i}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
            <p>
              Delivered by the daily morning job, approximately 8–10 a.m.
              Central on the free plan. The notification opens this week’s full
              briefing. Enable phone notifications under Add reminder.
            </p>
            <fieldset>
              <legend>Weather coordinates (optional)</legend>
              <p>
                Use these if the garden’s City, State location cannot be
                resolved. U.S. forecast coverage only.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["latitude", "longitude"] as const).map((key) => (
                  <label key={key}>
                    {key === "latitude" ? "Latitude" : "Longitude"}
                    <input
                      className="seasonal-input"
                      type="number"
                      step="any"
                      min={key === "latitude" ? -90 : -180}
                      max={key === "latitude" ? 90 : 180}
                      value={draft[key] ?? ""}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          [key]:
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              Planning notes
              <textarea
                className="seasonal-input"
                maxLength={2000}
                value={draft.planningNotes || ""}
                onChange={(e) =>
                  setDraft({ ...draft, planningNotes: e.target.value })
                }
              />
            </label>
            <p>
              Use calendar inclusion settings and “Not Growing Again” in the
              vault to exclude varieties from next-season recommendations.
              Record planting and finished crops in their growing spaces.
            </p>
            <button className="seasonal-button" onClick={save}>
              Save weekly settings
            </button>
            {message && <p role="status">{message}</p>}
          </div>
        </Dialog>
      )}
    </section>
  );
}

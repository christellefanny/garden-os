"use client";

import { useState, useSyncExternalStore } from "react";
import { useSeason } from "./SeasonProvider";
import GardenIcon from "@/components/ui/GardenIcon";
import { seasonContent } from "@/lib/seasons";

export function SeasonalHero({
  gardenName,
  gardenYear,
  spaces,
  plants,
  warnings,
}: {
  gardenName: string;
  gardenYear: number;
  spaces: number;
  plants: number;
  warnings: number;
}) {
  const { season } = useSeason();
  const content = seasonContent[season];
  return (
    <section className="seasonal-hero relative isolate min-h-[320px] overflow-hidden rounded-2xl border border-[#d9e0d5] px-7 py-9 text-white sm:px-11 sm:py-12">
      <div className="relative z-10 max-w-2xl">
        <p className="eyebrow text-white/85">{content.name} · {gardenName}</p>
        <h2 className="editorial-title mt-5 max-w-xl text-4xl leading-[1.08] sm:text-6xl">
          Your garden,<br/><em>in every season.</em>
        </h2>
        <p className="mt-5 max-w-md text-sm leading-7 text-white/90">{content.description}</p>
        <div className="mt-8 inline-flex rounded-lg border border-white/30 bg-[#ecede1]/15 px-5 py-3 text-sm text-white">
          Plan today. Grow tomorrow.
        </div>
      </div>
      <div className="relative z-10 mt-9 flex flex-wrap gap-7 border-t border-white/25 pt-5 text-sm">
        <span><strong className="mr-2 text-xl">{spaces}</strong>Growing spaces</span>
        <span><strong className="mr-2 text-xl">{plants}</strong>Plants recorded</span>
        <span><strong className="mr-2 text-xl">{warnings}</strong>Spaces to review</span>
        <span><strong className="mr-2 text-xl">{gardenYear}</strong>Garden year</span>
      </div>
    </section>
  );
}

export function SeasonalGuidanceHeading() {
  const { season } = useSeason();
  return (
    <h2 className="seasonal-heading editorial-title text-3xl">
      A little {seasonContent[season].name.toLowerCase()} perspective.
    </h2>
  );
}

export function SeasonalShortcuts({
  gardenId,
  enabled = true,
}: {
  gardenId: string;
  enabled?: boolean;
}) {
  const { season } = useSeason();
  return (
    <Shortcuts
      key={`${gardenId}-${season}`}
      gardenId={enabled ? gardenId : ""}
      season={season}
      content={seasonContent[season]}
    />
  );
}
const iconKinds: Record<string, string> = {
  "Start Seeds": "seeds",
  "Frost Dates": "frost",
  "Prepare Beds": "bed",
  Plant: "leaf",
  Watering: "water",
  Harvest: "harvest",
  Pests: "pest",
  "Garden Log": "log",
  "Save Seeds": "seeds",
  "Plant Garlic": "garlic",
  Cleanup: "cleanup",
  "Seed Vault": "seeds",
  "Next Season Plan": "plan",
  "Seed Wishlist": "log",
  "Indoor Growing": "indoor",
};
const temporary = new Map<string, string>();
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("garden-os-checklists", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("garden-os-checklists", callback);
  };
}
function Shortcuts({
  content,
  gardenId,
  season,
}: {
  content: (typeof seasonContent)["spring"];
  gardenId: string;
  season: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [storageError, setStorageError] = useState("");
  const storageKey = `garden-os-checklists-${gardenId}`;
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      if (temporary.has(storageKey)) return temporary.get(storageKey)!;
      try {
        return localStorage.getItem(storageKey) ?? "{}";
      } catch {
        return "{}";
      }
    },
    () => "{}",
  );
  let completed: Record<string, boolean> = {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      completed = parsed;
  } catch {
    /* Invalid browser preferences do not block gardening. */
  }
  function toggle(key: string, checked: boolean) {
    const value = JSON.stringify({ ...completed, [key]: checked });
    try {
      localStorage.setItem(storageKey, value);
      temporary.delete(storageKey);
      setStorageError("");
    } catch {
      temporary.set(storageKey, value);
      setStorageError(
        "Browser storage is unavailable. Progress will last only for this visit.",
      );
    }
    window.dispatchEvent(new Event("garden-os-checklists"));
  }
  return (
    <section className="mt-7" aria-label={`${content.name} shortcuts`}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {content.shortcuts.map(({ label }, index) => (
          <button
            key={label}
            type="button"
            aria-expanded={active === label}
            aria-controls={`season-task-${index}`}
            onClick={() => setActive(active === label ? null : label)}
            className={`seasonal-card flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition hover:bg-[var(--primary-soft)] ${active === label ? "ring-1 ring-[var(--primary)]" : ""}`}
          >
            <GardenIcon
              kind={iconKinds[label]}
              className="h-6 w-6 shrink-0 text-[var(--primary)]"
            />
            <span>{label}</span>
            <span aria-hidden="true" className="ml-auto seasonal-muted">
              {active === label ? "−" : "+"}
            </span>
          </button>
        ))}
      </div>
      {content.shortcuts.map(({ label, steps }, index) => (
        <div
          key={label}
          id={`season-task-${index}`}
          hidden={active !== label}
          className="seasonal-card mt-3 rounded-2xl border p-5"
        >
          {active === label && (
            <>
              <h3 className="seasonal-heading text-lg font-bold">
                {label} checklist
              </h3>
              <p className="seasonal-muted mt-1 text-xs">
                {gardenId
                  ? "Progress is remembered for this garden on this browser."
                  : "Create a garden to remember your progress."}
              </p>
              <ul className="mt-3 space-y-2">
                {steps.map((step, stepIndex) => {
                  const key = `${season}:${label}:${stepIndex}`;
                  return (
                    <li key={step}>
                      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
                        <input
                          type="checkbox"
                          disabled={!gardenId}
                          checked={completed[key] === true}
                          onChange={(e) => toggle(key, e.target.checked)}
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                        />
                        <span
                          className={
                            completed[key] ? "seasonal-muted line-through" : ""
                          }
                        >
                          {step}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {storageError && (
                <p role="status" className="mt-2 text-sm">
                  {storageError}
                </p>
              )}
            </>
          )}
        </div>
      ))}
    </section>
  );
}

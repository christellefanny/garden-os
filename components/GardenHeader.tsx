"use client";

import { useSeason } from "@/components/seasonal/SeasonProvider";
import { parseThemeSelection, seasonContent, seasons } from "@/lib/seasons";
import GardenIcon from "@/components/ui/GardenIcon";

export default function GardenHeader({ gardenYear }: { gardenYear: number }) {
  const { season, selection, setSelection } = useSeason();
  return (
    <header className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-3">
          <span className="seasonal-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[var(--primary-dark)]">
            <GardenIcon className="h-8 w-8" />
          </span>
          <h1 className="editorial-title text-4xl tracking-tight text-[var(--primary-dark)] sm:text-5xl">
            Garden OS<span className="text-[var(--accent)]">.</span>
          </h1>
        </div>
        <p className="seasonal-muted mt-3 text-sm">
          Grow smarter. Harvest better.
        </p>
      </div>
      <div className="seasonal-card flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3 sm:max-w-sm">
        <div className="min-w-20">
          <p className="eyebrow seasonal-muted">
            {selection === "automatic" ? "In season" : "Theme"}
          </p>
          <p
            aria-live="polite"
            className="seasonal-heading mt-1 text-lg font-semibold"
          >
            {seasonContent[season].name}
          </p>
          <p className="seasonal-muted text-xs">{gardenYear}</p>
        </div>
        <div className="min-w-36 flex-1">
          <label
            htmlFor="season-theme"
            className="seasonal-muted block text-xs"
          >
            Seasonal theme
          </label>
          <select
            id="season-theme"
            value={selection}
            onChange={(e) => setSelection(parseThemeSelection(e.target.value))}
            aria-describedby="theme-help"
            className="seasonal-input mt-1 min-h-11 w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="automatic">Automatic</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {seasonContent[s].name}
              </option>
            ))}
          </select>
        </div>
        <p id="theme-help" className="seasonal-muted basis-full text-xs">
          Follows your local date, or remembers your choice.
        </p>
      </div>
    </header>
  );
}

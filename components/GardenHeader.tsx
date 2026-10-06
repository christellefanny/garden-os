"use client";

import { useSeason } from "@/components/seasonal/SeasonProvider";
import { parseThemeSelection, seasonContent, seasons } from "@/lib/seasons";
import GardenIcon from "@/components/ui/GardenIcon";

const seasonEmoji = { spring: "🌷", summer: "🦋", fall: "🍂", winter: "❄️" } as const;

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
        <p className="seasonal-muted mt-3 text-sm">Grow smarter. Harvest better.</p>
      </div>

      <div className="seasonal-card relative flex items-center gap-3 overflow-hidden rounded-full border px-3 py-2 shadow-sm">
        <span aria-hidden="true" className="seasonal-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl">
          {seasonEmoji[season]}
        </span>
        <div className="leading-tight">
          <p className="eyebrow seasonal-muted">{selection === "automatic" ? "In season" : "Theme"}</p>
          <p aria-live="polite" className="seasonal-heading text-sm font-bold">
            {seasonContent[season].name} <span className="seasonal-muted font-normal">· {gardenYear}</span>
          </p>
        </div>
        <label htmlFor="season-theme" className="sr-only">Seasonal theme</label>
        <select
          id="season-theme"
          value={selection}
          onChange={(e) => setSelection(parseThemeSelection(e.target.value))}
          aria-label="Change seasonal theme"
          title="Change seasonal theme"
          className="seasonal-input h-9 w-9 cursor-pointer appearance-none rounded-full border p-0 text-center text-sm font-bold"
        >
          <option value="automatic">Automatic</option>
          {seasons.map((s) => <option key={s} value={s}>{seasonContent[s].name}</option>)}
        </select>
        <span className="pointer-events-none absolute right-[1.15rem] text-xs seasonal-muted">⌄</span>
      </div>
    </header>
  );
}

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

      <label className="seasonal-card relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-full border px-3 py-2 pr-9 shadow-sm transition hover:bg-[var(--primary-soft)]" title="Change seasonal theme">
        <span aria-hidden="true" className="text-2xl">{seasonEmoji[season]}</span>
        <span className="leading-tight">
          
          <span aria-live="polite" className="seasonal-heading block text-sm font-bold">
            {seasonContent[season].name} <span className="seasonal-muted font-normal">· {gardenYear}</span>
          </span>
        </span>
        <select value={selection} onChange={(e) => setSelection(parseThemeSelection(e.target.value))} aria-label="Change seasonal theme" className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
          <option value="automatic">Automatic</option>
          {seasons.map((s) => <option key={s} value={s}>{seasonContent[s].name}</option>)}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute right-4 text-sm seasonal-muted">⌄</span>
      </label>
    </header>
  );
}

"use client";

import { useSeason } from "@/components/seasonal/SeasonProvider";
import { parseThemeSelection, seasonContent, seasons } from "@/lib/seasons";

export default function GardenHeader({ gardenYear }: { gardenYear: number }) {
  const { season, selection, setSelection } = useSeason();
  const content = seasonContent[season];
  return (
    <header className="flex flex-col gap-6 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--primary)]">Your garden&apos;s operating system</p>
        <div className="mt-2 flex items-center gap-3">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-2xl shadow-sm">🌿</span>
          <h1 className="text-4xl font-black text-[var(--primary-dark)] sm:text-5xl">Garden OS</h1>
        </div>
        <p className="mt-3 text-lg font-semibold text-[var(--muted)]">Grow Smarter. Harvest Better.</p>
      </div>
      <div className="seasonal-card rounded-2xl border px-5 py-4 shadow-sm sm:w-64">
        <p className="text-sm seasonal-muted">{selection === "automatic" ? "Current season" : "Selected theme"}</p>
        <p aria-live="polite" className="mt-1 font-black text-[var(--primary-dark)]"><span aria-hidden="true">{content.icon} </span>{content.name}</p>
        <p className="mt-1 text-sm seasonal-muted">Garden year · {gardenYear}</p>
        <label htmlFor="season-theme" className="mt-3 block text-sm font-bold">Seasonal theme</label>
        <select id="season-theme" value={selection} onChange={(event) => setSelection(parseThemeSelection(event.target.value))} aria-describedby="theme-help" className="seasonal-input mt-1 min-h-11 w-full rounded-xl border px-3 py-2">
          <option value="automatic">Automatic</option>
          {seasons.map((value) => <option key={value} value={value}>{seasonContent[value].name}</option>)}
        </select>
        <p id="theme-help" className="mt-2 text-xs seasonal-muted">Automatic follows your local date. Your choice is remembered on this browser.</p>
      </div>
    </header>
  );
}

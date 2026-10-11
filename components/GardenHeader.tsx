"use client";

import Link from "next/link";
import { useSeason } from "@/components/seasonal/SeasonProvider";
import { parseThemeSelection, seasonContent, seasons } from "@/lib/seasons";
import GardenIcon from "@/components/ui/GardenIcon";

const seasonEmoji = { spring: "🌷", summer: "🦋", fall: "🍂", winter: "❄️" } as const;

export default function GardenHeader({ gardenYear, onOpenCalendar, onHome, calendarOpen = false }: { gardenYear: number; onOpenCalendar?: () => void; onHome?: () => void; calendarOpen?: boolean }) {
  const { season, selection, setSelection } = useSeason();
  return (
    <header className="flex flex-col justify-between gap-5 border-b border-[var(--border)] pb-7 sm:flex-row sm:items-center">
      <div>
        <div className="flex items-center gap-3">
          <span className="seasonal-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[var(--primary-dark)]">
            <GardenIcon className="h-8 w-8" />
          </span>
          <h1 className="editorial-title text-4xl tracking-tight text-[var(--primary-dark)] sm:text-5xl">
            <Link href="/" aria-label="Garden OS home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]" onClick={event => {
              if (onHome && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
                event.preventDefault();
                onHome();
              }
            }}>Garden OS<span className="text-[var(--accent)]">.</span></Link>
          </h1>
        </div>
        <p className="seasonal-muted mt-3 text-sm">Grow smarter. Harvest better.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
      {onOpenCalendar && <button type="button" onClick={onOpenCalendar} aria-pressed={calendarOpen} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold shadow-sm transition ${calendarOpen ? "seasonal-button text-white" : "seasonal-card hover:bg-[var(--primary-soft)]"}`}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 17h2"/></svg>Growing Calendar</button>}
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
      </div>
    </header>
  );
}

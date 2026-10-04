"use client";

import { useState } from "react";
import { useSeason } from "./SeasonProvider";
import SeasonDecoration from "./SeasonDecoration";
import { seasonContent } from "@/lib/seasons";

export function SeasonalHero({ gardenName, gardenYear, spaces }: { gardenName: string; gardenYear: number; spaces: number }) {
  const { season } = useSeason();
  const content = seasonContent[season];
  return (
    <div className="seasonal-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 break-words text-sm font-semibold uppercase tracking-widest">{gardenName}</p>
        <SeasonDecoration season={season} />
      </div>
      <h2 className="mt-3 text-3xl font-black">{content.title}</h2>
      <p className="mt-3 max-w-2xl leading-7">{content.description} You currently have {spaces} growing spaces.</p>
      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[["Spaces", String(spaces)], ["Plants", "13"], ["Warnings", "1"], ["Garden year", String(gardenYear)]].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-black/15 p-4">
            <p className="text-sm">{label}</p><p className="mt-1 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SeasonalGuidanceHeading() {
  const { season } = useSeason();
  return <h2 className="seasonal-heading text-xl font-bold">{seasonContent[season].name} garden guidance</h2>;
}

export function SeasonalShortcuts() {
  const { season } = useSeason();
  // Keyed content resets its disclosure when the selected season changes.
  return <Shortcuts key={season} content={seasonContent[season]} />;
}

function Shortcuts({ content }: { content: (typeof seasonContent)["spring"] }) {
  const [active, setActive] = useState<string | null>(null);
  const shortcut = content.shortcuts.find((item) => item.label === active);
  return (
    <section className="mt-6" aria-label={`${content.name} shortcuts`}>
      <div className="flex flex-wrap gap-2">
        {content.shortcuts.map(({ icon, label }, index) => (
          <button key={label} type="button" aria-expanded={active === label} aria-controls={`season-task-${index}`} onClick={() => setActive(active === label ? null : label)} className="seasonal-card min-h-11 rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition hover:bg-[var(--primary-soft)]">
            <span className="mr-2" aria-hidden="true">{icon}</span>{label}
          </button>
        ))}
      </div>
      {content.shortcuts.map(({ label }, index) => (
        <div key={label} id={`season-task-${index}`} hidden={active !== label} className="seasonal-card mt-3 rounded-2xl border p-5">
          {active === label && shortcut && <>
            <h3 className="seasonal-heading font-bold">{label} checklist</h3>
            <ul className="mt-2 list-disc space-y-2 pl-5">{shortcut.steps.map((step) => <li key={step}>{step}</li>)}</ul>
          </>}
        </div>
      ))}
    </section>
  );
}

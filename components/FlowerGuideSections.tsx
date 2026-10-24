"use client";

import Image from "next/image";
import { useState } from "react";
import VaultBotanicalPortrait from "@/components/VaultBotanicalPortrait";
import FlowerGardenPortrait from "@/components/FlowerGardenPortrait";

type PlantingGuide = { season: string; title: string; flowers: string; timing: string };
type SeedGuide = { name: string; when: string; how: string };
type CareGuide = { name: string; light: string; care: string; bloom: string };

const seasonPortraits: Record<string, [string, string]> = {
  Spring: ["Pansy", ""], Summer: ["Zinnia", ""], Fall: ["Tulips", ""], Winter: ["Lisianthus", ""],
};
const seasonColors: Record<string, string> = {
  Spring: "#f8edf0", Summer: "#f6e9ee", Fall: "#f7eddf", Winter: "#eaf0eb",
};
const aliases: Record<string, [string, string]> = {
  Marigold: ["French Marigold", ""], Catmint: ["Catmint / Nepeta", ""],
  Tulip: ["Tulips", ""], Allium: ["Allium", "Gladiator"], Hydrangea: ["Hydrangea", "Pink"],
};
const seedNames = ["Zinnia", "Cosmos", "Marigold", "Calendula", "Nasturtium", "Dianthus"];

function GuideIntro({ kind, eyebrow, title, description }: {
  kind: "seasonal" | "care" | "saving"; eyebrow: string; title: string; description: string;
}) {
  const backgrounds = { seasonal: "#eef1e7", care: "#f5edf0", saving: "#f6eddf" };
  const descriptions = {
    seasonal: "Botanical illustration of flower seedlings, tulips, bulbs and a garden notebook",
    care: "Botanical illustration of a watering can, flowering plants and secateurs",
    saving: "Botanical illustration of dried flower heads, paper seed envelopes and a glass jar",
  };
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-[#dedbd1]" style={{ backgroundColor: backgrounds[kind] }}>
      <div className="grid items-center md:grid-cols-[1.1fr_0.9fr]">
        <div className="px-6 pb-3 pt-7 md:p-8 lg:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#58654d]">{eyebrow}</p>
          <h2 className="mt-3 max-w-lg font-serif text-3xl leading-tight text-[#304333] lg:text-4xl">{title}</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#53604f]">{description}</p>
        </div>
        <Image src={`/flower-guides/${kind}.webp`} alt={descriptions[kind]} width={1536} height={1024}
          sizes="(max-width: 767px) 100vw, 520px"
          className="mx-auto h-40 w-full object-contain px-5 pb-4 mix-blend-multiply md:h-64 md:p-5" />
      </div>
    </section>
  );
}

function GuideFlower({ name, variety = "" }: { name: string; variety?: string }) {
  const [plant, cultivar] = aliases[name] || [name, variety];
  return <div aria-hidden="true" className="min-w-0 [&>p]:hidden">
    {name === "Ranunculus" || name === "Lisianthus"
      ? <FlowerGardenPortrait name={name} />
      : <VaultBotanicalPortrait name={plant} variety={cultivar} />}
  </div>;
}

function SeedSpecimen({ name }: { name: string }) {
  const index = seedNames.indexOf(name);
  if (index < 0) return null;
  return <div role="img" aria-label={`Seed-saving illustration of ${name.toLowerCase()}`}
    className="relative aspect-square overflow-hidden rounded-2xl bg-white" style={{ clipPath: "inset(5% round 12px)" }}>
    <Image src="/flower-guides/seed-specimens.webp" alt="" aria-hidden="true" width={1536} height={1024}
      sizes="420px" style={{ position: "absolute", width: "300%", height: "200%", maxWidth: "none", left: `${-(index % 3) * 100}%`, top: `${-Math.floor(index / 3) * 100}%` }} />
  </div>;
}

export function SeasonalFlowerPlanning({ season, current, planting }: {
  season: string; current: { title: string; tasks: string[] }; planting: readonly PlantingGuide[];
}) {
  return <div className="flower-seasonal-planning">
    <GuideIntro kind="seasonal" eyebrow="A garden through the year" title="A little planning. A season of color."
      description="From the first seedlings to next spring’s bulbs, make room for something beautiful in every season." />
    <section className="seasonal-card mt-5 rounded-2xl border p-6 sm:p-7" aria-label="Seasonal flower priorities">
      <p className="eyebrow seasonal-muted capitalize">Flower notes · {season}</p>
      <h2 className="seasonal-heading mt-2 font-serif text-2xl">{current.title}</h2>
      <ol className="mt-5 grid gap-4 lg:grid-cols-3">{current.tasks.map((task, i) => <li key={task} className="flex items-start gap-3 text-sm leading-6">
        <span aria-hidden="true" className="seasonal-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-current/20 text-xs font-semibold">0{i + 1}</span>
        <span>{task}</span>
      </li>)}</ol>
    </section>
    <div className="mb-5 mt-8">
      <h2 className="seasonal-heading font-serif text-2xl">What to plant each season</h2>
      <p className="seasonal-muted mt-2 max-w-3xl text-sm leading-6">General guidance for cold-winter gardens around northern Illinois. Always check your local frost dates and each variety’s requirements.</p>
    </div>
    <div className="grid gap-5 md:grid-cols-2">{planting.map(p => {
      const [plant, variety] = seasonPortraits[p.season];
      const selected = p.season.toLowerCase() === season;
      return <article key={p.season} className="seasonal-card overflow-hidden rounded-2xl border" style={selected ? { borderColor: "var(--primary)" } : undefined}>
        <div className="flex items-center justify-between gap-5 p-5" style={{ backgroundColor: seasonColors[p.season] }}>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#59654d]">{p.season}</p>
            <h3 className="mt-2 font-serif text-2xl leading-tight text-[#304333]">{p.title}</h3>
            {selected && <span className="mt-3 inline-block rounded-full border border-[#809376] bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#40553a]">Season in view</span>}
          </div>
          <div className="w-24 shrink-0 overflow-hidden rounded-2xl bg-white sm:w-28"><GuideFlower name={plant} variety={variety} /></div>
        </div>
        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#65705b]">Flowers to consider</p>
          <p className="mt-2 text-sm font-semibold leading-6">{p.flowers}</p>
          <p className="seasonal-muted mt-3 text-sm leading-7">{p.timing}</p>
        </div>
      </article>;
    })}</div>
  </div>;
}

export function FlowerSeedSaving({ guides }: { guides: readonly SeedGuide[] }) {
  return <div className="flower-seed-saving">
    <GuideIntro kind="saving" eyebrow="A little of this season, saved" title="Let the next garden begin here."
      description="A dry flower head, a paper envelope, a favorite bloom to grow again. Keep a little of the season for next year." />
    <ol aria-label="Seed-saving steps" className="mt-5 grid gap-3 sm:grid-cols-3">{[
      ["Collect", "Choose healthy, mature, dry flower heads."],
      ["Air-dry", "Let seeds dry completely before storing."],
      ["Label & keep", "Use labeled envelopes in a cool, dark, dry place."],
    ].map(([title, text], i) => <li key={title} className="flex gap-3 rounded-2xl border border-[#e4d9c9] bg-[#fbf7ef] p-5">
      <span aria-hidden="true" className="font-serif text-2xl text-[#9b7350]">0{i + 1}</span>
      <div><h3 className="font-serif text-lg text-[#3c4b36]">{title}</h3><p className="mt-1 text-xs leading-6 text-[#626655]">{text}</p></div>
    </li>)}</ol>
    <h2 className="seasonal-heading mt-8 font-serif text-2xl">What seeds to save, and when</h2>
    <p className="seasonal-muted mt-2 max-w-3xl text-sm leading-6">Collect seed from healthy, fully mature, dry flower heads on a dry day. Store completely dry seeds in labeled envelopes in a cool, dark, dry place. Hybrids may not grow true to the parent.</p>
    <div className="mt-5 grid gap-5 md:grid-cols-2">{guides.map(g => <article key={g.name} className="seasonal-card rounded-2xl border p-5 sm:p-6">
      <div className="flex items-center gap-4 border-b border-[#e9e3d7] pb-4">
        <div className="w-24 shrink-0"><SeedSpecimen name={g.name} /></div>
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8a7055]">From flower to seed</p><h3 className="seasonal-heading mt-2 font-serif text-2xl">{g.name}</h3></div>
      </div>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#667150]">When to collect</p>
      <p className="mt-2 text-sm leading-6">{g.when}</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8a7055]">How to save</p>
      <p className="seasonal-muted mt-2 text-sm leading-7">{g.how}</p>
    </article>)}</div>
  </div>;
}

export function FlowerCareLibrary({ guides }: { guides: readonly CareGuide[] }) {
  const [filter, setFilter] = useState("All flowers");
  const shown = guides.filter(g => filter === "All flowers" || (filter === "Sun-loving" ? /^(full sun|sun)/i.test(g.light) : /shade/i.test(g.light)));
  return <div className="flower-care-library">
    <GuideIntro kind="care" eyebrow="The little things that help a garden flourish" title="A little care. More beautiful blooms."
      description="Find each flower’s light, flowering season, and a few thoughtful ways to keep it growing well." />
    <div className="mb-5 mt-8">
      <h2 className="seasonal-heading font-serif text-2xl">Flower care library</h2>
      <p className="seasonal-muted mt-2 max-w-3xl text-sm leading-6">Growing tips for flowers in your garden. Adjust watering, pruning, and winter protection to your specific variety and site.</p>
    </div>
    <div role="group" aria-label="Flower care light filters" className="flex flex-wrap gap-2">{["All flowers", "Sun-loving", "Shade-friendly"].map(value => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? "seasonal-button" : "seasonal-outline"}>{value}</button>)}</div>
    <p aria-live="polite" className="seasonal-muted mt-4 text-xs">{shown.length} flower guides</p>
    <div className="mt-4 grid gap-5 md:grid-cols-2">{shown.map(g => <article key={g.name} className="seasonal-card overflow-hidden rounded-2xl border p-5 sm:p-6">
      <div className="flex items-center justify-between gap-5">
        <div className="min-w-0"><h3 className="seasonal-heading font-serif text-2xl">{g.name}</h3>
          <dl className="mt-4 space-y-3 text-xs">
            <div><dt className="font-semibold uppercase tracking-[0.11em] text-[#667150]">Light</dt><dd className="mt-1 leading-5">{g.light}</dd></div>
            <div><dt className="font-semibold uppercase tracking-[0.11em] text-[#855e68]">Flowering</dt><dd className="mt-1 leading-5">{g.bloom}</dd></div>
          </dl>
        </div>
        <div className="w-28 shrink-0 overflow-hidden rounded-2xl bg-white sm:w-32"><GuideFlower name={g.name} /></div>
      </div>
      <div className="mt-5 rounded-xl bg-[#f2f4ec] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#667150]">A little care</p><p className="mt-2 text-sm leading-7 text-[#44513d]">{g.care}</p></div>
    </article>)}</div>
  </div>;
}

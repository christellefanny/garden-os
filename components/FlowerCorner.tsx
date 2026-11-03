"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Dialog from "@/components/ui/Dialog";
import FlowerCornerPortrait from "@/components/FlowerCornerPortrait";
import IllustratedCareTechniques from "@/components/IllustratedCareTechniques";
import { flowerCornerProfiles, type FlowerCornerProfile } from "@/lib/flower-corner-library";
import { getPlantLifecycles } from "@/lib/flower-corner-classification";
import { defaultFlowerCornerFilters, flowerCornerLibraryUrl, readFlowerCornerFilters, type FlowerCornerFilters } from "@/lib/flower-corner-navigation";
import { cornerCareGuides } from "@/lib/flower-corner-editorial";
import { CornerPlanting, CornerCutFlowers, CornerSeedSaving } from "@/components/FlowerCornerEditorial";
import { useSeason } from "@/components/seasonal/SeasonProvider";

const sections = ["Library", "When & How to Plant", "Cut Flowers & Bouquets", "Seed Saving & Next Season"] as const;
type Section = typeof sections[number];

// Keep the former public care reminders alongside the richer profile, never in a second catalog.
function normalizedName(name: string) { return name.toLowerCase().replace(/s$/, "").trim(); }
export function legacyCare(profile: FlowerCornerProfile) {
  const aliases = [profile.name, profile.artName || "", profile.id, ...(profile.id === "ornamental-alliums" ? ["Allium"] : [])].map(normalizedName);
  return cornerCareGuides.filter(c => aliases.includes(normalizedName(c.name)));
}
export function profileExtraFacts(profile: FlowerCornerProfile): [string, string][] {
  return [["Feeding", profile.feeding], ["Bouquet use", profile.bouquet], ["Seed saving", profile.seedSaving], ["Common problems", profile.problems]];
}

export function matchesLibraryFilters(profile: FlowerCornerProfile, filters: FlowerCornerFilters): boolean {
  const search = filters.query.trim().toLowerCase();
  return (filters.kind === "all" || profile.kind === filters.kind)
    && (filters.life === "all" || getPlantLifecycles(profile).includes(filters.life))
    && (filters.light === "all" || (filters.light === "sun" ? /^full sun/i.test(profile.light) : profile.light.toLowerCase().includes("shade")))
    && `${profile.name} ${profile.botanical} ${profile.summary}`.toLowerCase().includes(search);
}

export default function FlowerCorner() {
  const { season } = useSeason();
  const [section, setSection] = useState<Section>("Library");
  const [filters, setFilters] = useState<FlowerCornerFilters>(defaultFlowerCornerFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [returnPath, setReturnPath] = useState("/flower-corner");
  const [techniques, setTechniques] = useState(false);
  const filtersId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const activeFilters = Number(Boolean(filters.query.trim())) + Number(filters.kind !== "all") + Number(filters.life !== "all") + Number(filters.light !== "all");

  useEffect(() => {
    const restore = () => {
      const restored = readFlowerCornerFilters(new URLSearchParams(window.location.search));
      setFilters(restored);
      if (restored.query || restored.kind !== "all" || restored.life !== "all" || restored.light !== "all") setFiltersOpen(true);
      setReturnPath(window.location.pathname === "/" ? "/" : "/flower-corner");
    };
    const frame = requestAnimationFrame(restore);
    window.addEventListener("popstate", restore);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("popstate", restore); };
  }, []);

  function updateFilters(next: FlowerCornerFilters) {
    setFilters(next);
    window.history.replaceState(window.history.state, "", flowerCornerLibraryUrl(returnPath, next));
  }
  function guideUrl(id: string) {
    return `/flower-corner/${id}?returnTo=${encodeURIComponent(flowerCornerLibraryUrl(returnPath, filters))}`;
  }
  function openSection(next: Section) {
    setSection(next);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  }
  const profiles = flowerCornerProfiles.filter(profile => matchesLibraryFilters(profile, filters));

  return <section className="interior-page flower-corner">
    <header className="corner-hero"><div><p className="modern-eyebrow">A place for everything that blooms — and the foliage around it</p><h1>Flower Corner</h1><p>Find your next favorite. Learn when to plant, how to care for it, and what to bring into a bouquet.</p><p className="corner-public-note">Outdoor guidance for U.S. home gardens. Follow local frost dates, soil conditions and your variety’s instructions; hardiness zones describe winter cold, not planting dates.</p></div><Image src="/flower-botanical-spring.webp" width={650} height={480} alt="Watercolor flowers in a spring garden" sizes="(max-width:700px) 100vw, 40vw" priority /></header>
    <nav className="corner-sections" aria-label="Flower Corner sections">{sections.map(name => <button type="button" key={name} aria-current={section === name ? "page" : undefined} onClick={() => openSection(name)}>{name}</button>)}</nav>
    <h2 className="corner-section-title" ref={heading} tabIndex={-1}>{section}</h2>
    {section === "Library" && <>
      <p className="corner-intro">Flowers and ornamental foliage, together. Explore planting, everyday care, bouquet use and seed saving for each plant.</p>
      <button type="button" className="seasonal-outline" aria-haspopup="dialog" onClick={() => setTechniques(true)}>Care techniques: pinching, deadheading &amp; cutting back</button>
      <section className="corner-filters my-6 rounded-2xl border border-[var(--border)] p-4 sm:p-5" aria-label="Filter the Library">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="seasonal-outline" aria-expanded={filtersOpen} aria-controls={filtersId} onClick={() => setFiltersOpen(!filtersOpen)}>Filters{activeFilters > 0 && <span> · {activeFilters} active</span>} <span aria-hidden="true">{filtersOpen ? "−" : "+"}</span></button>
          {activeFilters > 0 && <button type="button" className="seasonal-outline" onClick={() => updateFilters(defaultFlowerCornerFilters)}>Reset filters</button>}
        </div>
        <div id={filtersId} hidden={!filtersOpen}>
          <div className="learning-toolbar corner-filter-controls">
            <label>Search the Library<input type="search" value={filters.query} maxLength={200} onChange={event => updateFilters({ ...filters, query: event.target.value })} placeholder="Flower, foliage or botanical name…" /></label>
            <label>Plant kind<select value={filters.kind} onChange={event => updateFilters({ ...filters, kind: event.target.value as FlowerCornerFilters["kind"] })}><option value="all">Flowers &amp; foliage</option><option value="flower">Flowers</option><option value="foliage">Ornamental foliage</option></select></label>
            <label>Life cycle<select value={filters.life} onChange={event => updateFilters({ ...filters, life: event.target.value as FlowerCornerFilters["life"] })}><option value="all">All life cycles</option><option value="annual">Annuals</option><option value="biennial">Biennials</option><option value="perennial">Perennials</option></select></label>
            <label>Sunlight<select value={filters.light} onChange={event => updateFilters({ ...filters, light: event.target.value as FlowerCornerFilters["light"] })}><option value="all">All light conditions</option><option value="sun">Full sun options</option><option value="shade">Shade-tolerant options</option></select></label>
          </div>
          <p className="seasonal-muted text-sm">Filters work together. Annuals also include plants commonly grown for one season, even when botanically perennial.</p>
        </div>
      </section>
      <p role="status" aria-live="polite" aria-atomic="true" className="seasonal-muted">{profiles.length} {profiles.length === 1 ? "plant" : "plants"}{activeFilters > 0 ? (profiles.length === 1 ? " matches your filters" : " match your filters") : " to explore"}</p>
      <div className="corner-library-grid">{profiles.map(profile => <article className="corner-library-card" key={profile.id}>
        <Link href={guideUrl(profile.id)} target="_blank" rel="noopener noreferrer" className="corner-picture-link" aria-label={`Explore ${profile.name} (opens in a new tab)`}><FlowerCornerPortrait profile={profile} /></Link>
        <div className="corner-card-copy"><h3><Link href={guideUrl(profile.id)} target="_blank" rel="noopener noreferrer" aria-label={`${profile.name} (opens in a new tab)`}>{profile.name}<span aria-hidden="true" className="ml-1 text-base">↗</span></Link></h3><p><em>{profile.botanical}</em></p><p>{profile.summary}</p></div>
      </article>)}</div>
      {!profiles.length && <div className="interior-empty"><p>No plants match all your filters. Try another name or broaden the plant kind, life cycle or sunlight.</p><button type="button" className="seasonal-outline mt-3" onClick={() => updateFilters(defaultFlowerCornerFilters)}>Clear all filters</button></div>}
    </>}
    {section === "When & How to Plant" && <><p className="corner-intro">Start with the season, then open a plant’s Library guide for indoor sowing, direct sowing, transplanting and germination details. A seed-to-bloom range is not a guarantee.</p><button type="button" className="seasonal-outline" onClick={() => openSection("Library")}>Find a plant’s growing timeline →</button><CornerPlanting season={season} /></>}
    {section === "Cut Flowers & Bouquets" && <CornerCutFlowers />}
    {section === "Seed Saving & Next Season" && <CornerSeedSaving />}
    {techniques && <Dialog title="Care techniques" onClose={() => setTechniques(false)}><IllustratedCareTechniques /></Dialog>}
  </section>;
}

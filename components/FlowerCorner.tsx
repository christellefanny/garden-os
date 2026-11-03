"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Dialog from "@/components/ui/Dialog";
import FlowerGardenPortrait from "@/components/FlowerGardenPortrait";
import VaultBotanicalPortrait from "@/components/VaultBotanicalPortrait";
import { getFlowerGardenArt } from "@/lib/flower-garden-art";
import { flowerCornerProfiles, type FlowerCornerProfile } from "@/lib/flower-corner-library";
import { cornerCareGuides } from "@/lib/flower-corner-editorial";
import { CornerPlanting, CornerCutFlowers, CornerSeedSaving } from "@/components/FlowerCornerEditorial";
import { useSeason } from "@/components/seasonal/SeasonProvider";

const sections = ["Library", "When & How to Plant", "Cut Flowers & Bouquets", "Seed Saving & Next Season"] as const;
type Section = typeof sections[number];
function Portrait({profile}:{profile:FlowerCornerProfile}) {
  const name=profile.artName || profile.name;
  return getFlowerGardenArt(name)?<FlowerGardenPortrait name={name}/>:<VaultBotanicalPortrait name={name} variety={profile.artVariety||""}/>;
}
function Facts({title,items}:{title:string;items:[string,string][]}) {
  return <section className="corner-facts"><h3>{title}</h3><dl>{items.map(([label,text])=><div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl></section>;
}

// Keep the former public care reminders alongside the richer profile, never in a second catalog.
function normalizedName(name:string){return name.toLowerCase().replace(/s$/, "").trim();}
export function legacyCare(profile:FlowerCornerProfile){
  const aliases=[profile.name,profile.artName||"",profile.id,...(profile.id==="ornamental-alliums"?["Allium"]:[])].map(normalizedName);
  return cornerCareGuides.filter(c=>aliases.includes(normalizedName(c.name)));
}
export function profileExtraFacts(profile:FlowerCornerProfile):[string,string][]{
  return [["Feeding",profile.feeding],["Bouquet use",profile.bouquet],["Seed saving",profile.seedSaving],["Common problems",profile.problems]];
}

export default function FlowerCorner() {
  const {season}=useSeason();
  const [section,setSection]=useState<Section>("Library");
  const [query,setQuery]=useState("");
  const [kind,setKind]=useState("all");
  const [light,setLight]=useState("all");
  const [selected,setSelected]=useState<FlowerCornerProfile|null>(null);
  const [techniques,setTechniques]=useState(false);
  const techniqueHeading=useRef<HTMLHeadingElement>(null);
  const profileHeading=useRef<HTMLParagraphElement>(null);
  function openTechniques(){setTechniques(true);requestAnimationFrame(()=>techniqueHeading.current?.focus());}
  function returnToProfile(){setTechniques(false);requestAnimationFrame(()=>profileHeading.current?.focus());}
  const heading=useRef<HTMLHeadingElement>(null);
  function openSection(next:Section){
    setSection(next);
    requestAnimationFrame(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});});
  }
  const search=query.trim().toLowerCase();
  const profiles=flowerCornerProfiles.filter(p=>(kind==="all"||p.kind===kind)&&(light==="all"||(light==="sun"?/^full sun/i.test(p.light):p.light.toLowerCase().includes("shade")))&&`${p.name} ${p.botanical} ${p.summary}`.toLowerCase().includes(search));
  return <section className="interior-page flower-corner">
    <header className="corner-hero"><div><p className="modern-eyebrow">A place for everything that blooms — and the foliage around it</p><h1>Flower Corner</h1><p>Find your next favorite. Learn when to plant, how to care for it, and what to bring into a bouquet.</p><p className="corner-public-note">Open to everyone. No account needed to explore these guides.</p></div><Image src="/flower-botanical-spring.webp" width={650} height={480} alt="Watercolor flowers in a spring garden" sizes="(max-width:700px) 100vw, 40vw" priority/></header>
    <nav className="corner-sections" aria-label="Flower Corner sections">{sections.map(name=><button type="button" key={name} aria-current={section===name?"page":undefined} onClick={()=>openSection(name)}>{name}</button>)}</nav>
    <h2 className="corner-section-title" ref={heading} tabIndex={-1}>{section}</h2>
    <aside className="learning-note"><strong>A guide, not a universal planting date.</strong><p>Outdoor guidance focuses on U.S. home gardens. Use your local frost dates, soil conditions and the exact plant or seed packet. Hardiness zones describe winter cold, not sowing dates. Timing ranges change with cultivar, temperature and growing conditions.</p></aside>
    {section==="Library"&&<>
      <p className="corner-intro">Flowers and ornamental foliage, together. Every plant has one growing guide, with planting, everyday care, bouquet use and seed-saving guidance together.</p>
      <button type="button" className="seasonal-outline" aria-haspopup="dialog" onClick={openTechniques}>Care techniques: pinching, deadheading &amp; cutting back</button>
      <div className="learning-toolbar"><label>Search the Library<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Flower, foliage or botanical name…"/></label><label>Plant type<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Flowers & foliage</option><option value="flower">Flowers</option><option value="foliage">Ornamental foliage</option></select></label><label>Sunlight<select value={light} onChange={e=>setLight(e.target.value)}><option value="all">All light conditions</option><option value="sun">Full sun options</option><option value="shade">Shade-tolerant options</option></select></label></div>
      <p role="status" className="seasonal-muted">{profiles.length} growing guides</p>
      <div className="corner-library-grid">{profiles.map(p=><article className="corner-library-card" key={p.id}><Portrait profile={p}/><div className="corner-card-copy"><p className="modern-eyebrow">{p.kind==="foliage"?"Ornamental foliage":"Flower"} · Growing guide</p><h3>{p.name}</h3><p><em>{p.botanical}</em></p><p>{p.summary}</p><button type="button" className="seasonal-outline" aria-haspopup="dialog" onClick={()=>{setSelected(p);setTechniques(false);}}>Read {p.name} growing guide</button></div></article>)}</div>
      {!profiles.length&&<p className="interior-empty">No matching plants yet. Try another name or broaden the plant type and sunlight filters.</p>}
    </>}
    {section==="When & How to Plant"&&<><p className="corner-intro">Start with the season, then open a plant’s Library guide for indoor sowing, direct sowing, transplanting and germination details. A seed-to-bloom range is not a guarantee.</p><button type="button" className="seasonal-outline" onClick={()=>openSection("Library")}>Find a plant’s growing timeline →</button><CornerPlanting season={season}/></>}
    {section==="Cut Flowers & Bouquets"&&<CornerCutFlowers/>}
    {section==="Seed Saving & Next Season"&&<CornerSeedSaving/>}
    {(selected||techniques)&&<Dialog title={techniques?"Care techniques":selected!.name} onClose={()=>{setSelected(null);setTechniques(false);}}>
      {techniques?<article className="corner-profile"><Image src="/flower-guides/care.webp" alt="Botanical illustration of a watering can, flowering plants and secateurs" width={1536} height={1024} sizes="(max-width:700px) 100vw, 600px" className="h-40 w-full rounded-xl bg-[#f5edf0] object-contain"/><h3 ref={techniqueHeading} tabIndex={-1}>Three different cuts, three different jobs</h3><p>Pinching, deadheading and cutting back are not interchangeable. Check the plant’s growing guide and cultivar instructions before cutting.</p><Facts title="Know the difference" items={[["Pinching","Remove a young growing tip to encourage branching. Not every plant benefits from pinching; single-stem and cultivar-specific exceptions matter."],["Deadheading","Remove faded flowers. This can tidy the plant or encourage further bloom in suitable species, but removes seedheads you may want to save or leave for wildlife."],["Cutting back","Remove more established growth at the appropriate stage. Timing depends on the plant and its flowering wood; do not apply one pruning schedule to every species."]]}/><p>Light, watering, feeding, flowering season and species-specific care are now together in each Library profile. Adjust watering, pruning and winter protection to the variety and site.</p><footer className="learning-sources"><a href="https://extension.illinois.edu/flowers/caring-annuals" target="_blank" rel="noopener noreferrer">University of Illinois Extension · Caring for annuals ↗</a></footer>{selected&&<button type="button" className="seasonal-outline" onClick={returnToProfile}>← Back to {selected.name} growing guide</button>}</article>:selected&&<article className="corner-profile"><p ref={profileHeading} tabIndex={-1}><em>{selected.botanical}</em> · {selected.kind==="foliage"?"Ornamental foliage":"Flower"}</p><p>{selected.summary}</p><Facts title="The right place" items={[["Light",selected.light],["Water",selected.water],["Spacing",selected.spacing],["Mature size",selected.matureSize]]}/><Facts title="When & how to plant" items={[["Start indoors",selected.indoorStart],["Sow outdoors",selected.directSow],["Transplant",selected.transplant],["Germination",selected.germination],["Sowing to blooms",selected.sowToBloom]]}/><Facts title="Keep it growing" items={[["Pinching",selected.pinching],["Deadheading",selected.deadheading],["Cutting back",selected.cutback],...profileExtraFacts(selected)]}/><button type="button" className="seasonal-outline" onClick={openTechniques}>Understand pinching, deadheading &amp; cutting back</button>{legacyCare(selected).map(c=><Facts key={c.name} title="From the flower care notes" items={[["Care-guide light note",c.light],["Flowering season",c.bloom],["Care reminder",c.care]]}/>)}<h3>Before you grow</h3><ul>{selected.notes.map(note=><li key={note}>{note}</li>)}</ul><footer className="learning-sources"><p>Sources reviewed {selected.reviewed}. Original summaries; follow cultivar instructions where they differ.</p><ul>{selected.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a></li>)}</ul></footer></article>}
    </Dialog>}
  </section>;
}

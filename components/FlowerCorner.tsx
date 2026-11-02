"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Dialog from "@/components/ui/Dialog";
import FlowerGardenPortrait from "@/components/FlowerGardenPortrait";
import VaultBotanicalPortrait from "@/components/VaultBotanicalPortrait";
import { getFlowerGardenArt } from "@/lib/flower-garden-art";
import { flowerCornerProfiles, type FlowerCornerProfile } from "@/lib/flower-corner-library";
import { cornerCutFlowers } from "@/lib/flower-corner-editorial";
import { CornerPlanting, CornerCare, CornerCutFlowers, CornerSeedSaving } from "@/components/FlowerCornerEditorial";
import { useSeason } from "@/components/seasonal/SeasonProvider";

const sections = ["Library", "When & How to Plant", "Flower Care", "Cut Flowers & Bouquets", "Seed Saving & Next Season"] as const;
type Section = typeof sections[number];
function Portrait({profile}:{profile:FlowerCornerProfile}) {
  const name=profile.artName || profile.name;
  return getFlowerGardenArt(name)?<FlowerGardenPortrait name={name}/>:<VaultBotanicalPortrait name={name} variety=""/>;
}
function Facts({title,items}:{title:string;items:[string,string][]}) {
  return <section className="corner-facts"><h3>{title}</h3><dl>{items.map(([label,text])=><div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl></section>;
}
export default function FlowerCorner() {
  const {season}=useSeason();
  const [section,setSection]=useState<Section>("Library");
  const [query,setQuery]=useState("");
  const [kind,setKind]=useState("all");
  const [light,setLight]=useState("all");
  const [selected,setSelected]=useState<FlowerCornerProfile|null>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  function openSection(next:Section){
    setSection(next);
    requestAnimationFrame(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});});
  }
  const search=query.trim().toLowerCase();
  const profiles=flowerCornerProfiles.filter(p=>(kind==="all"||p.kind===kind)&&(light==="all"||(light==="sun"?p.kind==="flower"&&p.light.toLowerCase().includes("sun"):p.light.toLowerCase().includes("shade")))&&`${p.name} ${p.botanical} ${p.summary}`.toLowerCase().includes(search));
  // These are existing editorial inspiration entries, not a user's saved collection.
  const inspiration=kind==="foliage"||light!=="all"?[]:cornerCutFlowers.filter(p=>!flowerCornerProfiles.some(f=>(f.artName||f.name).toLowerCase()===p.name.toLowerCase())&&`${p.name} ${p.tip}`.toLowerCase().includes(search));
  return <section className="interior-page flower-corner">
    <header className="corner-hero"><div><p className="modern-eyebrow">A place for everything that blooms — and the foliage around it</p><h1>Flower Corner</h1><p>Find your next favorite. Learn when to plant, how to care for it, and what to bring into a bouquet.</p><p className="corner-public-note">Open to everyone. No account needed to explore these guides.</p></div><Image src="/flower-botanical-spring.webp" width={650} height={480} alt="Watercolor flowers in a spring garden" sizes="(max-width:700px) 100vw, 40vw" priority/></header>
    <nav className="corner-sections" aria-label="Flower Corner sections">{sections.map(name=><button type="button" key={name} aria-current={section===name?"page":undefined} onClick={()=>openSection(name)}>{name}</button>)}</nav>
    <h2 className="corner-section-title" ref={heading} tabIndex={-1}>{section}</h2>
    <aside className="learning-note"><strong>A guide, not a universal planting date.</strong><p>Outdoor guidance focuses on U.S. home gardens. Use your local frost dates, soil conditions and the exact plant or seed packet. Hardiness zones describe winter cold, not sowing dates. Timing ranges change with cultivar, temperature and growing conditions.</p></aside>
    {section==="Library"&&<>
      <p className="corner-intro">Flowers and ornamental foliage, together. Open a growing guide for planting, care and sources, or browse the illustrated cutting-flower collection for inspiration.</p>
      <div className="learning-toolbar"><label>Search the Library<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Flower, foliage or botanical name…"/></label><label>Plant type<select value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Flowers & foliage</option><option value="flower">Flowers</option><option value="foliage">Ornamental foliage</option></select></label><label>Sunlight<select value={light} onChange={e=>setLight(e.target.value)}><option value="all">All light conditions</option><option value="sun">Full sun options</option><option value="shade">Shade-tolerant options</option></select></label></div>
      <p role="status" className="seasonal-muted">{profiles.length} growing guides · {inspiration.length} additional cutting-flower inspiration entries</p>
      <div className="corner-library-grid">{profiles.map(p=><article className="corner-library-card" key={p.id}><Portrait profile={p}/><div className="corner-card-copy"><p className="modern-eyebrow">{p.kind==="foliage"?"Ornamental foliage":"Flower"} · Growing guide</p><h3>{p.name}</h3><p><em>{p.botanical}</em></p><p>{p.summary}</p><button type="button" className="seasonal-outline" aria-haspopup="dialog" onClick={()=>setSelected(p)}>Read {p.name} growing guide</button></div></article>)}</div>
      {inspiration.length>0&&<section className="corner-inspiration"><h3>More flowers for cutting</h3><p>These illustrated entries offer bloom-season and cutting inspiration. They are not full seed-starting profiles yet.</p><div className="corner-inspiration-grid">{inspiration.map(p=><article key={p.name}><FlowerGardenPortrait name={p.name}/><h4>{p.name}</h4><p><strong>{p.when}</strong></p><p>{p.tip}</p></article>)}</div><button type="button" className="seasonal-outline" onClick={()=>openSection("Cut Flowers & Bouquets")}>Explore cutting and bouquet inspiration →</button></section>}
      {!profiles.length&&!inspiration.length&&<p className="interior-empty">No matching plants yet. Try another name or broaden the plant type and sunlight filters.</p>}
    </>}
    {section==="When & How to Plant"&&<><p className="corner-intro">Start with the season, then open a plant’s Library guide for indoor sowing, direct sowing, transplanting and germination details. A seed-to-bloom range is not a guarantee.</p><button type="button" className="seasonal-outline" onClick={()=>openSection("Library")}>Find a plant’s growing timeline →</button><CornerPlanting season={season}/></>}
    {section==="Flower Care"&&<><CornerCare/><div className="learning-note"><strong>Pinching, deadheading and cutting back are different jobs.</strong><p>Pinching removes a young growing tip to encourage branching. Deadheading removes faded flowers. Cutting back removes more established growth. Not every plant benefits from each treatment: check the species-specific Library guide before cutting.</p><button type="button" className="seasonal-outline" onClick={()=>openSection("Library")}>Check a plant’s care guide →</button></div></>}
    {section==="Cut Flowers & Bouquets"&&<CornerCutFlowers/>}
    {section==="Seed Saving & Next Season"&&<CornerSeedSaving/>}
    {selected&&<Dialog title={selected.name} onClose={()=>setSelected(null)}><article className="corner-profile"><p><em>{selected.botanical}</em> · {selected.kind==="foliage"?"Ornamental foliage":"Flower"}</p><p>{selected.summary}</p><Facts title="The right place" items={[["Light",selected.light],["Water",selected.water],["Spacing",selected.spacing],["Mature size",selected.matureSize]]}/><Facts title="When & how to plant" items={[["Start indoors",selected.indoorStart],["Sow outdoors",selected.directSow],["Transplant",selected.transplant],["Germination",selected.germination],["Sowing to blooms",selected.sowToBloom]]}/><Facts title="Keep it growing" items={[["Pinching",selected.pinching],["Deadheading",selected.deadheading],["Cutting back",selected.cutback]]}/><h3>Before you grow</h3><ul>{selected.notes.map(note=><li key={note}>{note}</li>)}</ul><footer className="learning-sources"><p>Sources reviewed {selected.reviewed}. Original summaries; follow cultivar instructions where they differ.</p><ul>{selected.sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a></li>)}</ul></footer></article></Dialog>}
  </section>;
}

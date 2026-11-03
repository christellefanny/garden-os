"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Dialog from "@/components/ui/Dialog";
import FlowerCornerPortrait from "@/components/FlowerCornerPortrait";
import { flowerCornerProfiles, type FlowerCornerProfile } from "@/lib/flower-corner-library";
import { cornerCareGuides } from "@/lib/flower-corner-editorial";
import { CornerPlanting, CornerCutFlowers, CornerSeedSaving } from "@/components/FlowerCornerEditorial";
import { useSeason } from "@/components/seasonal/SeasonProvider";

const sections = ["Library", "When & How to Plant", "Cut Flowers & Bouquets", "Seed Saving & Next Season"] as const;
type Section = typeof sections[number];
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
  const [returnPath,setReturnPath]=useState("/flower-corner");
  const [techniques,setTechniques]=useState(false);
  const techniqueHeading=useRef<HTMLHeadingElement>(null);

  function openTechniques(){setTechniques(true);requestAnimationFrame(()=>techniqueHeading.current?.focus());}

  useEffect(()=>{
    const restore=()=>{const params=new URLSearchParams(window.location.search);setQuery(params.get("q")||"");setKind(["flower","foliage"].includes(params.get("kind")||"")?params.get("kind")!:"all");setLight(["sun","shade"].includes(params.get("light")||"")?params.get("light")!:"all");setReturnPath(window.location.pathname==="/"?"/":"/flower-corner");};
    const frame=requestAnimationFrame(restore);window.addEventListener("popstate",restore);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener("popstate",restore);};
  },[]);
  function libraryUrl(q=query,k=kind,l=light){
    const params=new URLSearchParams();if(returnPath==="/")params.set("view","flower-corner");if(q)params.set("q",q);if(k!=="all")params.set("kind",k);if(l!=="all")params.set("light",l);
    return returnPath+(params.size?"?"+params.toString():"");
  }
  function updateFilters(q:string,k:string,l:string){setQuery(q);setKind(k);setLight(l);window.history.replaceState(null,"",libraryUrl(q,k,l));}
  function guideUrl(id:string){return `/flower-corner/${id}?returnTo=${encodeURIComponent(libraryUrl())}`;}
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
    {section!=="Cut Flowers & Bouquets"&&<aside className="learning-note"><strong>A guide, not a universal planting date.</strong><p>Outdoor guidance focuses on U.S. home gardens. Use your local frost dates, soil conditions and the exact plant or seed packet. Hardiness zones describe winter cold, not sowing dates. Timing ranges change with cultivar, temperature and growing conditions.</p></aside>}
    {section==="Library"&&<>
      <p className="corner-intro">Flowers and ornamental foliage, together. Every plant has one growing guide, with planting, everyday care, bouquet use and seed-saving guidance together.</p>
      <button type="button" className="seasonal-outline" aria-haspopup="dialog" onClick={openTechniques}>Care techniques: pinching, deadheading &amp; cutting back</button>
      <div className="learning-toolbar"><label>Search the Library<input type="search" value={query} onChange={e=>updateFilters(e.target.value,kind,light)} placeholder="Flower, foliage or botanical name…"/></label><label>Plant type<select value={kind} onChange={e=>updateFilters(query,e.target.value,light)}><option value="all">Flowers & foliage</option><option value="flower">Flowers</option><option value="foliage">Ornamental foliage</option></select></label><label>Sunlight<select value={light} onChange={e=>updateFilters(query,kind,e.target.value)}><option value="all">All light conditions</option><option value="sun">Full sun options</option><option value="shade">Shade-tolerant options</option></select></label></div>
      <p role="status" className="seasonal-muted">{profiles.length} growing guides</p>
      <div className="corner-library-grid">{profiles.map(p=><article className="corner-library-card" key={p.id}><Link href={guideUrl(p.id)} className="corner-picture-link" aria-label={`Open ${p.name} growing guide`}><FlowerCornerPortrait profile={p}/></Link><div className="corner-card-copy"><p className="modern-eyebrow">{p.kind==="foliage"?"Ornamental foliage":"Flower"} · Growing guide</p><h3><Link href={guideUrl(p.id)}>{p.name}</Link></h3><p><em>{p.botanical}</em></p><p>{p.summary}</p><Link className="seasonal-outline corner-guide-link" href={guideUrl(p.id)}>Read {p.name} growing guide</Link></div></article>)}</div>
      {!profiles.length&&<p className="interior-empty">No matching plants yet. Try another name or broaden the plant type and sunlight filters.</p>}
    </>}
    {section==="When & How to Plant"&&<><p className="corner-intro">Start with the season, then open a plant’s Library guide for indoor sowing, direct sowing, transplanting and germination details. A seed-to-bloom range is not a guarantee.</p><button type="button" className="seasonal-outline" onClick={()=>openSection("Library")}>Find a plant’s growing timeline →</button><CornerPlanting season={season}/></>}
    {section==="Cut Flowers & Bouquets"&&<CornerCutFlowers/>}
    {section==="Seed Saving & Next Season"&&<CornerSeedSaving/>}
    {techniques&&<Dialog title="Care techniques" onClose={()=>setTechniques(false)}><article className="corner-profile"><Image src="/flower-guides/care.webp" alt="Botanical illustration of a watering can, flowering plants and secateurs" width={1536} height={1024} sizes="(max-width:700px) 100vw, 600px" className="h-40 w-full rounded-xl bg-[#f5edf0] object-contain"/><h3 ref={techniqueHeading} tabIndex={-1}>Three different cuts, three different jobs</h3><p>Pinching, deadheading and cutting back are not interchangeable. Check the plant’s growing guide and cultivar instructions before cutting.</p><Facts title="Know the difference" items={[["Pinching","Remove a young growing tip to encourage branching. Not every plant benefits from pinching; single-stem and cultivar-specific exceptions matter."],["Deadheading","Remove faded flowers. This can tidy the plant or encourage further bloom in suitable species, but removes seedheads you may want to save or leave for wildlife."],["Cutting back","Remove more established growth at the appropriate stage. Timing depends on the plant and its flowering wood; do not apply one pruning schedule to every species."]]}/><p>Light, watering, feeding, flowering season and species-specific care are now together in each Library profile. Adjust watering, pruning and winter protection to the variety and site.</p><footer className="learning-sources"><a href="https://extension.illinois.edu/flowers/caring-annuals" target="_blank" rel="noopener noreferrer">University of Illinois Extension · Caring for annuals ↗</a></footer></article></Dialog>}
  </section>;
}

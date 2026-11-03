"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Dialog from "@/components/ui/Dialog";
import BeginnerGuideArticle from "@/components/BeginnerGuideArticle";
import LearningSources from "@/components/LearningSources";
import InteriorHeader from "@/components/InteriorHeader";
import BeginnerClimate from "@/components/BeginnerClimate";
import type { Garden } from "@/lib/garden";
import type { BeginnerGoal } from "@/lib/beginner-climate";
import VaultBotanicalPortrait from "@/components/VaultBotanicalPortrait";
import FlowerGardenPortrait from "@/components/FlowerGardenPortrait";
import { beginnerGuides, flowerProfiles, learningChecked } from "@/lib/garden-learning";

export default function GardenLearning({kind,userId,garden,onFlowerGarden,onPlan,onExplorePlants}:{userId:string;garden?:Garden;kind:"flowers"|"beginner";onFlowerGarden:()=>void;onPlan:()=>void;onExplorePlants:()=>void}) {
  const [query,setQuery]=useState(""),[light,setLight]=useState("All"),[activeGuide,setActiveGuide]=useState("");
  const [help,setHelp]=useState(false),[space,setSpace]=useState("containers"),[goal,setGoal]=useState<BeginnerGoal>("flowers"),[started,setStarted]=useState(false);
  const [startRequest,setStartRequest]=useState(0);
  const startSectionRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    if(!startRequest)return;
    const section=startSectionRef.current;
    if(!section)return;
    section.querySelector("select")?.focus({preventScroll:true});
    section.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  },[startRequest]);
  const [activeFlower,setActiveFlower]=useState("");
  useEffect(()=>{if(activeGuide)document.getElementById("learning-guide-heading")?.focus();},[activeGuide]);
  const flowers=kind==="flowers";
  const results=flowerProfiles.filter(p=>(light==="All"||p.light===light)&&`${p.name} ${p.botanical} ${p.summary} ${p.use}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected=beginnerGuides.find(g=>g.id===activeGuide);
  const selectedFlower=flowerProfiles.find(p=>p.id===activeFlower);
  return <section className="interior-page learning-page">
    <InteriorHeader title={flowers?"Flower Library":"Beginner’s Guide"} eyebrow={flowers?"Understand what you grow":"Start small. Learn as you grow."} description={flowers?"Learn what to grow, how to care for it, and why it thrives.":"The essentials for starting a garden, one practical step at a time."}/>
    <div className="learning-hero"><div><p className="modern-eyebrow">{flowers?"A little knowledge, a better garden":"Your first garden starts here"}</p><h2>{flowers?"Find the flower. Understand its needs.":"You don’t need to know everything to begin."}</h2><p>{flowers?"Explore planting, care and common problems. Each profile identifies the plant, explains what changes with climate or variety, and links to its source.":"Choose your space, understand the conditions, gather a few essentials and learn how to care for what you plant."}</p><div className="learning-actions">{flowers?<button type="button" className="seasonal-button" onClick={onFlowerGarden}>Open Blooms →</button>:<button type="button" className="seasonal-button" aria-expanded={help} aria-controls="learning-start" onClick={()=>{setHelp(true);setStartRequest(n=>n+1);}}>Help me start</button>}{flowers&&<button type="button" className="seasonal-outline" onClick={onPlan}>Open Plan &amp; Design</button>}</div></div><Image src={flowers?"/flower-botanical-spring.webp":"/layout-inspiration/courtyard-open-entry.webp"} width={650} height={480} alt={flowers?"Botanical flower illustration":"Illustrated raised beds, containers and a clear garden path"} sizes="(max-width:700px) 100vw, 45vw"/></div>
    <aside className="learning-note"><strong>Use the right guidance for your garden.</strong><p>These guides focus on outdoor home gardens in the United States. Planting dates depend on local frost risk, soil conditions and the plant. Hardiness zone describes winter cold, not a planting date. Follow your variety’s label and local extension guidance.</p><a href="https://planthardiness.ars.usda.gov/pages/how-to-use-the-maps" target="_blank" rel="noopener noreferrer">USDA: understand your hardiness zone ↗</a></aside>
    {flowers?<>
      <div className="learning-toolbar"><label>Find a flower<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, botanical name or use…"/></label><label>Sunlight<select value={light} onChange={e=>setLight(e.target.value)}><option>All</option><option>Full sun</option><option>Sun to part shade</option></select></label></div>
      <p className="seasonal-muted text-sm" role="status">{results.length} flower {results.length===1?"profile":"profiles"} · Full sun generally means at least six hours of direct sun.</p>
      <div className="learning-flower-grid">{results.map(p=><article className="learning-flower" key={p.id}>{["marigolds","sunflowers"].includes(p.id)?<VaultBotanicalPortrait name={p.art} variety=""/>:<FlowerGardenPortrait name={p.art}/>}<div className="learning-flower-copy"><p className="modern-eyebrow">{p.life}</p><h2>{p.name}</h2><p><em>{p.botanical}</em></p><p>{p.summary}</p><dl><dt>Light</dt><dd>{p.light}</dd><dt>Mature size</dt><dd>{p.size}</dd></dl><button type="button" className="seasonal-outline learning-profile-button" aria-haspopup="dialog" aria-label={`Read ${p.name} planting and care guide`} onClick={()=>setActiveFlower(p.id)}>Read planting &amp; care guide →</button></div></article>)}</div>
      {!results.length&&<div className="interior-empty"><h2>No matching flowers yet.</h2><p>Try a different name or sunlight filter.</p><button type="button" className="seasonal-outline" onClick={()=>{setQuery("");setLight("All");}}>Show all flowers</button></div>}
    </>:<>
      <BeginnerClimate key={`${userId}:${garden?.id || "none"}:${garden?.location || ""}`} userId={userId} garden={garden} goal={goal}/>
      {help&&<section ref={startSectionRef} id="learning-start" className="learning-start"><h2>Let’s find your starting point</h2><form onSubmit={e=>{e.preventDefault();setStarted(true);}}><label>Where will you grow?<select value={space} onChange={e=>{setSpace(e.target.value);setStarted(false);}}><option value="containers">Containers, patio or balcony</option><option value="raised">Raised beds</option><option value="ground">In the ground</option></select></label><label>What would you like to grow?<select value={goal} onChange={e=>{setGoal(e.target.value as BeginnerGoal);setStarted(false);}}><option value="flowers">Flowers</option><option value="food">Vegetables and herbs</option><option value="mixed">A little of both</option></select></label><button type="submit" className="seasonal-button">Show my next steps</button></form>{started&&<div className="learning-next" role="status"><h3>Your starting path</h3><p>For your {space==="containers"?"container garden":space==="raised"?"raised bed":"in-ground garden"}, start with the space guide, then {space==="containers"?"container drainage and potting mix":"soil testing and drainage"}. Next, read timing and planting.</p><p>Use your local growing window above to decide what to prioritize. You can follow this reading path without a location.</p><div className="learning-actions"><button type="button" className="seasonal-outline" onClick={()=>setActiveGuide("space")}>Read the space guide</button>{goal!=="food"&&<button type="button" className="seasonal-outline" onClick={onFlowerGarden}>Explore Blooms</button>}</div></div>}</section>}
      <div className="learning-guide-grid">{beginnerGuides.map((g,i)=><Link key={g.id} href={`/beginners-guide/${g.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Step ${i+1}: ${g.title} (opens in a new tab)`} className="learning-guide-card"><span className="modern-eyebrow">Step {i+1}</span><h2>{g.title}</h2><p>{g.intro}</p><span className="seasonal-link">Read guide ↗</span></Link>)}</div>
      <section className="learning-note" aria-labelledby="beginner-start-garden-heading"><h2 id="beginner-start-garden-heading">Start your garden</h2><p>Put the six steps into practice with a simple garden layout.</p><div className="learning-actions"><button type="button" className="seasonal-button" onClick={onPlan}>Start Your Garden</button></div></section>
      {selected&&<Dialog title={selected.title} onClose={()=>setActiveGuide("")}><BeginnerGuideArticle guide={selected} userId={userId} mode="dialog" onPlan={onPlan} onExplorePlants={onExplorePlants} onNext={setActiveGuide}/></Dialog>}
    </>}

    {flowers&&selectedFlower&&<Dialog title={selectedFlower.name} onClose={()=>setActiveFlower("")}><article className="learning-profile-detail learning-modal-profile"><p><em>{selectedFlower.botanical}</em></p><p>{selectedFlower.summary}</p><h3>Getting started</h3><p>{selectedFlower.plant}</p><h3>Care</h3><p>{selectedFlower.care}</p><h3>When something goes wrong</h3><p>{selectedFlower.problem}</p><h3>Where it works</h3><p>{selectedFlower.use}</p><h3>Before you choose</h3><p>{selectedFlower.note}</p><LearningSources sources={[selectedFlower.source]}/></article></Dialog>}
    <p className="learning-reviewed">Sources checked <time dateTime={learningChecked}>November 1, 2026</time>. Original editorial summaries; illustrations are representative, not identification tools.</p>
  </section>;
}

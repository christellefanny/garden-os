"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Dialog from "@/components/ui/Dialog";
import { friendlyDate, plantingDay, plantingSuggestions, validClimate, type PlantingAdvice, type PlantingClimate } from "@/lib/planting-now";

const KEY="garden-atelier-guest-planting-location-v1";
function PlantPicture({ id, name }: {id:string;name:string}) {
  return <Image src={`/planting-now/${id}.webp`} alt={`Botanical illustration of ${name.toLowerCase()}`} width={640} height={640} sizes="(max-width:600px) 100px, 160px" />;
}
export default function GuestPlantingNow() {
  const [climate,setClimate]=useState<PlantingClimate>();
  const [today,setToday]=useState(()=>plantingDay());
  const [locationOpen,setLocationOpen]=useState(false),[browse,setBrowse]=useState(false);
  const [selected,setSelected]=useState<PlantingAdvice>();
  const [zip,setZip]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [filter,setFilter]=useState("All");
  const alive=useRef(true),requestId=useRef(0);
  const resolve=useCallback(async (input:{zip:string}|{latitude:number;longitude:number},silent=false)=>{
    const id=++requestId.current;setBusy(true);setError("");if(!silent)setMessage("");
    try {
      const r=await fetch("/api/planting-location",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input),signal:AbortSignal.timeout(30000)});
      const result=await r.json();if(!r.ok || !validClimate(result))throw new Error(result.error || "We couldn’t verify your growing location. Please try a U.S. ZIP code.");
      if(!alive.current || id!==requestId.current)return;
      setClimate(result);setToday(plantingDay(result));setZip(result.zip);setLocationOpen(false);
      setSelected(undefined);
      try {localStorage.setItem(KEY,JSON.stringify(result));setMessage(`Planting guidance updated for ${result.place}.`);}catch{setMessage("Your location works for this visit, but this browser couldn’t save it.");}
    } catch(e) {if(alive.current && id===requestId.current)setError(e instanceof Error && e.name!=="TimeoutError"?e.message:"Location lookup took too long. Please try again.");}
    finally {if(alive.current && id===requestId.current)setBusy(false);}
  },[]);
  function locate() {
    if(!navigator.geolocation){setError("This browser can’t detect your location. Enter your U.S. ZIP code instead.");return;}
    setBusy(true);setError("");
    navigator.geolocation.getCurrentPosition(position=>{if(alive.current)void resolve({latitude:position.coords.latitude,longitude:position.coords.longitude});},()=>{if(alive.current){setBusy(false);setError("Location permission was declined or your position was unavailable. You can still enter a ZIP code.");}},{enableHighAccuracy:false,timeout:12000,maximumAge:3600000});
  }
  useEffect(()=>{
    alive.current=true;
    let cancelled=false;
    queueMicrotask(()=>{
    if(cancelled)return;
    let saved:PlantingClimate|undefined;
    try {const raw=JSON.parse(localStorage.getItem(KEY)||"null");if(validClimate(raw))saved=raw;}catch{}
    if(saved){setClimate(saved);setZip(saved.zip);setToday(plantingDay(saved));if(Date.now()-Date.parse(saved.resolvedAt)>86400000)void resolve({zip:saved.zip},true);}
    // Only auto-locate after permission was already granted. First-time visitors choose explicitly.
    else if(navigator.permissions && navigator.geolocation)void navigator.permissions.query({name:"geolocation"}).then(p=>{
      if(p.state==="granted" && alive.current)navigator.geolocation.getCurrentPosition(pos=>{if(alive.current)void resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude},true);},()=>{}, {enableHighAccuracy:false,timeout:12000,maximumAge:3600000});
    }).catch(()=>{});
    });
    return ()=>{cancelled=true;alive.current=false;};
  },[resolve]);
  useEffect(()=>{const timer=setInterval(()=>setToday(plantingDay(climate)),60000);return()=>clearInterval(timer);},[climate]);
  const all=plantingSuggestions(climate,today);
  const ready=all.filter(a=>a.status!=="wait");
  const examples=Number(today.slice(5,7))>=9?["garlic","lettuce","pansy"]:Number(today.slice(5,7))>=6?["beans","basil","zinnia"]:["radish","spinach","alyssum"];
  const shown=climate?ready.slice(0,3):examples.map(id=>all.find(a=>a.crop.id===id)!);
  function clearLocation(){try{localStorage.removeItem(KEY);}catch{}setClimate(undefined);setZip("");setSelected(undefined);setError("");setMessage("Saved growing location cleared from this browser.");}
  const detail=selected?all.find(a=>a.crop.id===selected.crop.id):undefined;
  return <section className="modern-card guest-planting-card" aria-label="What to Plant Now">
    <div className="guest-planting-heading"><div><div className="modern-card-title"><h2>What to Plant Now</h2></div>
    <p className="guest-planting-intro">A little inspiration for your next planting.</p>
    </div>{climate?<div className="guest-growing-location"><strong>{climate.place}</strong><span>ZIP {climate.zip} · USDA zone {climate.zone}</span><button className="seasonal-link" type="button" onClick={()=>{setError("");setLocationOpen(true);}}>Change location</button></div>:<div className="guest-location-prompt"><p>Find your growing zone and local planting window. No account needed.</p><button type="button" className="seasonal-button" onClick={()=>{setError("");setLocationOpen(true);}}>Find my growing location</button></div>}</div>
    {busy && <p role="status" className="guest-planting-note">Finding your zone and local climate…</p>}
    {error && !locationOpen && <p role="alert" className="guest-planting-note">{error} <button className="seasonal-link" type="button" onClick={()=>setLocationOpen(true)}>Try a ZIP code</button></p>}
    <div className="guest-plant-suggestions">{shown.map(advice=><button key={advice.crop.id} type="button" className="guest-plant-row" onClick={()=>setSelected(advice)} aria-label={`Explore ${advice.crop.name}`}>
      <span className="guest-plant-thumb"><PlantPicture id={advice.crop.id} name={advice.crop.name}/></span>
      <span><strong>{advice.crop.name}</strong><small>{advice.badge}</small><span className="guest-plant-kind">{advice.crop.kind}</span></span><span aria-hidden="true">›</span>
    </button>)}
    {!shown.length && <p className="guest-planting-note">Outdoor planting is limited here right now. Browse the plant guides to plan your next window.</p>}
    </div>{!climate && <p className="guest-planting-note">Plant ideas to explore—not local recommendations yet.</p>}
    {climate && <p className="guest-planting-note">Based on today’s date and local climate, even when you preview another seasonal theme.</p>}
    <button type="button" className="seasonal-link guest-browse-plants" onClick={()=>setBrowse(true)}>Browse all {all.length} plant guides →</button>
    {message && <p role="status" className="guest-planting-note">{message}</p>}

    {locationOpen && <Dialog title="Find your growing location" onClose={()=>{if(!busy)setLocationOpen(false);}}>
      <p className="seasonal-muted text-sm leading-7">Allow your browser to find your area, or enter a U.S. ZIP code. We use your ZIP area to look up the growing zone and estimate local frost timing.</p>
      <button type="button" className="seasonal-button mt-5 min-h-11 rounded-lg px-4" disabled={busy} onClick={locate}>{busy?"Finding your location…":"Use my current location"}</button>
      <form className="guest-zip-form" onSubmit={e=>{e.preventDefault();void resolve({zip});}}>
        <label htmlFor="guest-growing-zip">U.S. ZIP code<input id="guest-growing-zip" value={zip} onChange={e=>setZip(e.target.value)} inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} required placeholder="e.g. 60544" disabled={busy}/></label>
        <button type="submit" className="seasonal-outline min-h-11 rounded-lg border px-4" disabled={busy}>Show local planting ideas</button>
      </form>
      <p className="guest-planting-note">Your saved ZIP-area profile stays in this browser. Precise device coordinates are used only to find a ZIP area and aren’t saved in your profile. USDA, Esri and Open-Meteo provide lookup data. U.S. locations are supported in this release.</p>
      {climate && <button type="button" className="seasonal-link mt-4 min-h-11 text-sm" disabled={busy} onClick={clearLocation}>Forget my saved growing location</button>}
      {error && <p role="alert" className="interior-notice">{error}</p>}
    </Dialog>}
    {browse && !detail && <Dialog title="What to Plant Now" onClose={()=>setBrowse(false)}>
      <p className="seasonal-muted text-sm leading-7">{climate?`${climate.place} · Zone ${climate.zone} · ${friendlyDate(today)}. Explore a plant to see its timing and growing guidance.`:"Explore vegetables, herbs, and flowers. Set your location to check which windows are open for you."}</p>
      <div className="guest-plant-filters" aria-label="Filter plant guides">{["All","Vegetable","Herb","Flower"].map(kind=><button type="button" key={kind} aria-pressed={filter===kind} className={filter===kind?"seasonal-button":"seasonal-outline"} onClick={()=>setFilter(kind)}>{kind==="All"?"All plants":kind+"s"}</button>)}</div>
      <div className="guest-plant-guide-grid">{all.filter(a=>filter==="All" || a.crop.kind===filter).map(a=><button className="guest-plant-guide" type="button" key={a.crop.id} onClick={()=>setSelected(a)}><PlantPicture id={a.crop.id} name={a.crop.name}/><strong>{a.crop.name}</strong><span className={`guest-plant-badge guest-plant-badge-${a.status}`}>{a.badge}</span><small>{a.status==="unknown"?a.crop.kind:a.method}</small></button>)}</div>
    </Dialog>}
    {detail && <Dialog title={detail.crop.name} onClose={()=>setSelected(undefined)}>
      <div className="guest-plant-detail-heading"><PlantPicture id={detail.crop.id} name={detail.crop.name}/><div><p className="modern-eyebrow">{detail.crop.kind}</p><span className={`guest-plant-badge guest-plant-badge-${detail.status}`}>{detail.badge}</span><p className="mt-3 text-sm font-semibold">{detail.method}</p></div></div>
      <p className="mt-5 text-sm leading-7">{detail.crop.description}</p>
      <section className="guest-plant-detail-section"><h3>Is there still time?</h3><p>{detail.timing}</p><p>{detail.explanation}</p>{detail.daysNeeded!==undefined && <p className="guest-timing-equation">{detail.daysAvailable} estimated days available · {detail.daysNeeded} days budgeted</p>}</section>
      <section className="guest-plant-detail-section"><h3>Why this season matters</h3><p>{detail.crop.why}</p></section>
      <section className="guest-plant-detail-section"><h3>A good start</h3><p>{detail.crop.care}</p></section>
      {climate?<div className="guest-climate-explanation"><strong>{climate.place} · ZIP {climate.zip} · Zone {climate.zone}</strong><p>{climate.lastSpringFrost && climate.firstFallFrost?`Conservative 32°F frost planning dates: ${friendlyDate(today.slice(0,4)+"-"+climate.lastSpringFrost)} (last spring) and ${friendlyDate(today.slice(0,4)+"-"+climate.firstFallFrost)} (first fall).`:"Frost is too irregular in this climate to use a dependable annual frost date; temperature patterns are used instead."}</p><p>Estimated from {climate.years} years of local gridded weather ({climate.startYear}–{climate.endYear}), using later spring and earlier fall frost estimates. Zone describes winter hardiness—not a sowing date. Check your seed packet, soil conditions, and local forecast; microclimates and early frosts can change the window.</p><p>{climate.forecast.some(p=>p.date>=today)?"The available near-term temperature forecast is also checked for frost and extreme heat.":"A current forecast isn’t available here. Check it locally before outdoor planting."}</p></div>:<button type="button" className="seasonal-button mt-5 min-h-11 rounded-lg px-4" onClick={()=>{setSelected(undefined);setBrowse(false);setLocationOpen(true);}}>Check timing for my location</button>}
      <div className="guest-plant-sources"><a href={detail.crop.source} target="_blank" rel="noreferrer">Read the Extension growing guide ↗</a>{climate && <><a href="https://planthardiness.ars.usda.gov/" target="_blank" rel="noreferrer">USDA zone map ↗</a><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Climate data: Open-Meteo / GeoNames ↗</a></>}</div>
    </Dialog>}
  </section>;
}

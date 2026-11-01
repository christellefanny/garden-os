"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import BlankGardenLayout, { loadCustomLayouts } from "@/components/BlankGardenLayout";
import LegacyGardenLayout from "@/components/LegacyGardenLayout";
import InteriorHeader from "@/components/InteriorHeader";
import Dialog from "@/components/ui/Dialog";
import { layoutTemplates } from "@/lib/layout-design";
import {initialLayout, type Bed } from "@/lib/garden-layout";
import type { Space } from "@/lib/garden";
import type { Layout } from "@/lib/layout-design";
import { containerStyles } from "@/lib/container-art";
const PhotoGardenLayout = dynamic(() => import("@/components/PhotoGardenLayout"), { loading: () => <p role="status">Opening photo planner…</p> });

export default function GardenLayout(props:{userId:string;gardenId:string;gardenName:string;initialBedId?:string;initialTemplateId?:string;spaces:Space[];onOpenSpace:(spaceId:string)=>void;onClose:()=>void;onCreateSpaces:(beds:Bed[],excludePeppers?:boolean)=>Promise<number|null>}) {
  const {userId,gardenId,initialBedId}=props;
  const customKey=`garden-os-custom-layouts-v1-${userId}-${gardenId}`;
  const selectionKey=`garden-os-layout-selection-${userId}-${gardenId}`;
  const [layouts,setLayouts]=useState(()=>loadCustomLayouts(customKey));
  const [hasLegacy]=useState(()=>{try{return Boolean(localStorage.getItem(`garden-os-layout-2027-${userId}-${gardenId}`)) || props.spaces.some(s=>{try{return initialLayout.some(b=>b.id===JSON.parse(s.notes??"null")?.sourceLayoutId);}catch{return false;}});}catch{return false;}});
  const [selection,setSelection]=useState(()=>{
    if(layoutTemplates.some(t=>t.id===props.initialTemplateId))return `new:${props.initialTemplateId}`;
    if(initialBedId){
      const linked=layouts.find(l=>l.items.some(i=>i.id===initialBedId));
      if(linked)return linked.id;
      if(hasLegacy&&initialLayout.some(b=>b.id===initialBedId))return "original";
    }
    return "gallery";
  });
  const [renaming,setRenaming]=useState(false),[name,setName]=useState(""),[error,setError]=useState("");
  const current=layouts.find(l=>l.id===selection);
  function createFromPhoto(layout: Layout) {
    // Read the latest storage copy: a concurrent tab must never lose a saved design.
    const raw = localStorage.getItem(customKey);
    if (raw && !Array.isArray(JSON.parse(raw))) throw Error("Your saved layouts could not be read. Your photo draft has been retained.");
    const saved = loadCustomLayouts(customKey);
    if (raw && saved.length !== JSON.parse(raw).length) throw Error("A saved layout needs attention before adding this one. Your photo draft has been retained.");
    const next = [...saved, layout], serialized = JSON.stringify(next);
    if (new TextEncoder().encode(serialized).length > 1400000) throw Error("Your layouts are too large to sync together. Uncheck Keep a small copy of this photo and try again.");
    localStorage.setItem(customKey, serialized);
    window.dispatchEvent(new Event("garden-os-data-change"));
    setLayouts(next); select(layout.id);
  }
  function select(id:string){setSelection(id);if(!id.startsWith("new"))try{localStorage.setItem(selectionKey,id);}catch{/* Selection works during this visit. */}}
  function rename(){if(!name.trim()){setError("Enter a layout name.");return;}const next=layouts.map(l=>l.id===selection?{...l,name:name.trim()}:l);try{localStorage.setItem(customKey,JSON.stringify(next));setLayouts(next);setRenaming(false);}catch{setError("Could not save the name in this browser.");}}
  if(selection==="original"&&hasLegacy)return <LegacyGardenLayout {...props} onNewLayout={()=>{setLayouts(loadCustomLayouts(customKey));select("gallery");}} onClose={()=>{setLayouts(loadCustomLayouts(customKey));select("gallery");}} />;
  return <section className="interior-page layout-page layout-studio">
    <InteriorHeader title="Garden Layout" eyebrow="Make room for your ideas" description="Start with a little inspiration or a completely blank canvas. Move beds, add paths, and picture the garden you want to grow." />
    <nav aria-label="Saved garden layouts" className="layout-studio-nav">
      <button type="button" aria-current={selection==="gallery"?"page":undefined} onClick={()=>select("gallery")}>Inspiration & new layout</button>
      {layouts.map(l=><button type="button" key={l.id} aria-current={selection===l.id?"page":undefined} onClick={()=>select(l.id)}>{l.name}</button>)}
      {hasLegacy&&<button type="button" onClick={()=>select("original")}>Saved nine-bed plan</button>}
    </nav>
    {selection==="photo"?<PhotoGardenLayout userId={userId} onCancel={()=>select("gallery")} onCreate={createFromPhoto}/>:selection==="gallery"?<>
      <div className="layout-gallery-intro"><div><p className="modern-eyebrow">A starting point, never a rule</p><h2>What would you love to grow?</h2><p>Choose an illustrated idea to make your own. Each opens as a separate editable plan.</p></div><button type="button" className="seasonal-button" onClick={()=>select("new")}>Start from scratch →</button></div>
      <article className="photo-layout-entry"><Image src="/layout-inspiration/courtyard-open-entry.webp" width={600} height={400} alt="Illustrated beds and pots surrounding a garden path" sizes="(max-width: 700px) 100vw, 260px"/><div><p className="modern-eyebrow">Your space, your starting point</p><h3>Create a garden from a photo</h3><p>Bring a picture of your garden. Review its beds, pots and paths, then make the plan your own.</p><button type="button" className="seasonal-button rounded-xl px-5 py-3" onClick={()=>select("photo")}>Upload a garden photo →</button></div></article>
      <div className="layout-template-grid">{layoutTemplates.map(template=><article className="layout-template-card" key={template.id}>
        <Image src={template.image} width={600} height={400} alt={`Illustrated inspiration for ${template.name.toLowerCase()}`} sizes="(max-width: 700px) 100vw, 33vw" />
        <div><p className="modern-eyebrow">{template.summary}</p><h3>{template.name}</h3><p>{template.description}</p><button type="button" className="seasonal-button" onClick={()=>select(`new:${template.id}`)}>Customize {template.name.toLowerCase()} →</button></div>
      </article>)}</div>
      <p className="layout-concept-note">Illustrated concepts, not measured planting plans. Customize the shapes and decorative plants for your space. Nothing is added to My Gardens until you choose to create growing spaces.</p>
      <details className="container-inspiration"><summary>Explore planter styles</summary><p>A few pots can become a whole garden. Explore ceramic, timber, metal and woven textures for patios, balconies and vegetable gardens. Choose Add container in the designer to use one.</p><div>{containerStyles.map(style=><figure key={style.id}><Image src={style.src} alt={`Watercolor illustration of ${style.name.toLowerCase()}`} width={280} height={280}/><figcaption><h3>{style.name}</h3><p>{style.detail}</p></figcaption></figure>)}</div></details>
    </>:<BlankGardenLayout key={selection.startsWith("new")?selection:current?.id??selection} userId={userId} gardenId={gardenId} spaces={props.spaces} onOpenSpace={props.onOpenSpace} onBack={()=>select("gallery")} initialItemId={initialBedId} selectedLayoutId={selection} onNewLayout={()=>select("gallery")} initialTemplateId={selection.startsWith("new:")?selection.slice(4):undefined} onSelectLayout={select} onLayoutsChange={setLayouts} onRename={()=>{setName(current?.name??"");setError("");setRenaming(true);}} onCreateSpaces={beds=>props.onCreateSpaces(beds,false)} />}
    {renaming&&<Dialog title="Rename layout" onClose={()=>setRenaming(false)}><form onSubmit={e=>{e.preventDefault();rename();}}><label>Layout name<input maxLength={100} required value={name} onChange={e=>setName(e.target.value)} className="seasonal-input mt-2 w-full rounded-xl border p-3"/></label>{error&&<p role="alert">{error}</p>}<button type="submit" className="seasonal-button mt-4 rounded-xl p-3">Save name</button></form></Dialog>}
  </section>;
}

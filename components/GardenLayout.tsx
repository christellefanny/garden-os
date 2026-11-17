"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import BlankGardenLayout, { loadCustomLayouts } from "@/components/BlankGardenLayout";
import LegacyGardenLayout from "@/components/LegacyGardenLayout";
import InteriorHeader from "@/components/InteriorHeader";
import LayoutCoverPicker from "@/components/LayoutCoverPicker";
import { validLayoutCover } from "@/lib/layout-cover";
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
    return "home";
  });
  const [renaming,setRenaming]=useState(false),[name,setName]=useState(""),[error,setError]=useState("");
  const [coverRevision,setCoverRevision]=useState(0);
  const [coverEditing,setCoverEditing]=useState(false),[coverDraft,setCoverDraft]=useState<string|undefined>(),[coverBusy,setCoverBusy]=useState(false);
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
  function rename(){if(!name.trim()){setError("Enter a layout name.");return;}const next=layouts.map(l=>l.id===selection?{...l,name:name.trim()}:l);try{localStorage.setItem(customKey,JSON.stringify(next));setLayouts(next);setCoverRevision(v=>v+1);setRenaming(false);}catch{setError("Could not save the name in this browser.");}}
  function saveCover(){
    if(!current||coverBusy)return;
    try{
      const saved=loadCustomLayouts(customKey);
      const raw=JSON.parse(localStorage.getItem(customKey)||"[]");
      if(!Array.isArray(raw)||raw.length!==saved.length||!saved.some(l=>l.id===current.id))throw Error("Your saved layouts changed. Reopen this layout before changing its picture.");
      const next=saved.map(l=>l.id===current.id?{...l,coverImage:coverDraft}:l);
      const serialized=JSON.stringify(next);
      if(new TextEncoder().encode(serialized).length>1400000)throw Error("Your layouts are too large to sync together. Choose a smaller cover or remove an unused layout.");
      localStorage.setItem(customKey,serialized);setLayouts(next);setCoverRevision(v=>v+1);setCoverEditing(false);
      window.dispatchEvent(new Event("garden-os-data-change"));
    }catch(err){setError(err instanceof Error?err.message:"Could not save this cover picture.");}
  }
  if(selection==="original"&&hasLegacy)return <LegacyGardenLayout {...props} onNewLayout={()=>{setLayouts(loadCustomLayouts(customKey));select("gallery");}} onClose={()=>{setLayouts(loadCustomLayouts(customKey));select("saved");}} />;
  return <section className="interior-page layout-page layout-studio">
    {["home","gallery","saved","inspiration"].includes(selection)&&<InteriorHeader title="Garden Layout" eyebrow="Plan & Design" description="Create something new or return to a saved design." />}
    <nav aria-label="Garden layout sections" className={`layout-studio-nav${selection==="home"?" layout-entry-choices":""}`}>
      <button type="button" aria-label="New Layout" aria-current={["gallery","inspiration","photo"].includes(selection)||selection.startsWith("new")?"page":undefined} onClick={()=>select("gallery")}><strong>New Layout</strong>{selection==="home"&&<span>Start from scratch or use an inspiration layout.</span>}</button>
      <button type="button" aria-label="My Layouts" aria-current={selection==="saved"||Boolean(current)?"page":undefined} onClick={()=>{setLayouts(loadCustomLayouts(customKey));select("saved");}}><strong>My Layouts</strong>{selection==="home"&&<span>Open and continue your saved designs.</span>}</button>
    </nav>
    {current&&<details className="guided-layout-cover"><summary>Garden picture</summary><div className="layout-cover-actions">{validLayoutCover(current.coverImage)&&<Image src={current.coverImage} alt={`Garden picture for ${current.name}`} width={600} height={400} unoptimized className="layout-cover-preview"/>}<button type="button" className="seasonal-outline min-h-11 rounded-xl border px-4 py-2" onClick={()=>{setCoverDraft(current.coverImage);setError("");setCoverEditing(true);}}>{current.coverImage?"Change garden picture":"Add garden picture"}</button></div></details>}
    {coverEditing&&<Dialog title="Garden picture" onClose={()=>{if(!coverBusy)setCoverEditing(false);}}><LayoutCoverPicker value={coverDraft} onChange={setCoverDraft} onBusyChange={setCoverBusy}/>{error&&<p role="alert">{error}</p>}<button type="button" className="seasonal-button mt-5 min-h-11 rounded-xl px-4 py-3" disabled={coverBusy} onClick={saveCover}>Save picture</button></Dialog>}
    {selection==="home"?null:selection==="saved"?<section className="saved-layouts-with-covers">
      <h2 className="font-serif text-2xl">My Layouts</h2>
      {layouts.length===0&&!hasLegacy?<p className="seasonal-muted mt-4">No saved layouts yet. Choose New Layout to create your first design.</p>:<div className="layout-template-grid mt-4">{layouts.map(l=><article className="layout-template-card" key={l.id}>{validLayoutCover(l.coverImage)?<Image src={l.coverImage} width={600} height={400} alt={`Garden picture for ${l.name}`} unoptimized/>:<div className="layout-cover-empty">Your garden layout</div>}<div><h3>{l.name}</h3><button type="button" className="seasonal-button" aria-label={`Open ${l.name}`} onClick={()=>select(l.id)}>Open layout</button></div></article>)}
      {hasLegacy&&<article className="layout-template-card"><div className="layout-cover-empty">Your original garden plan</div><div><h3>Saved nine-bed plan</h3><button type="button" className="seasonal-button" onClick={()=>select("original")}>Open saved nine-bed plan</button></div></article>}</div>}
    </section>:selection==="photo"?<PhotoGardenLayout userId={userId} onCancel={()=>select("gallery")} onCreate={createFromPhoto}/>:selection==="gallery"?<>
      <div className="layout-gallery-intro"><div><h2>New Layout</h2><p>How would you like to begin?</p></div></div>
      <div className="layout-start-choices">
        <button type="button" aria-label="Start from scratch" onClick={()=>select("new")}><strong>Start from scratch</strong><span>A blank canvas for your own ideas.</span></button>
        <button type="button" aria-label="Use an inspiration layout" onClick={()=>select("inspiration")}><strong>Use an inspiration layout</strong><span>Choose a design, then make it yours.</span></button>
      </div>
      <details className="layout-photo-option"><summary>Or start with a garden photo</summary>
      <article className="photo-layout-entry"><Image src="/layout-inspiration/courtyard-open-entry.webp" width={600} height={400} alt="Illustrated beds and pots surrounding a garden path" sizes="(max-width: 700px) 100vw, 260px"/><div><p className="modern-eyebrow">Your space, your starting point</p><h3>Create a garden from a photo</h3><p>Bring a picture of your garden. Review its beds, pots and paths, then make the plan your own.</p><button type="button" className="seasonal-button rounded-xl px-5 py-3" onClick={()=>select("photo")}>Upload a garden photo →</button></div></article>
      </details>
    </>:selection==="inspiration"?<>
      <div className="layout-gallery-intro"><div><h2>Choose an inspiration layout</h2><p>Each idea becomes your own editable design.</p></div><button type="button" className="seasonal-outline" onClick={()=>select("gallery")}>Back to New Layout</button></div>
      <div className="layout-template-grid">{layoutTemplates.map(template=><article className="layout-template-card" key={template.id}>
        <Image src={template.image} width={600} height={400} alt={`Illustrated inspiration for ${template.name.toLowerCase()}`} sizes="(max-width: 700px) 100vw, 33vw" />
        <div><p className="modern-eyebrow">{template.summary}</p><h3>{template.name}</h3><p>{template.description}</p><button type="button" className="seasonal-button" onClick={()=>select(`new:${template.id}`)}>Customize {template.name.toLowerCase()} →</button></div>
      </article>)}</div>
      <p className="layout-concept-note">Illustrated concepts, not measured planting plans. Customize the shapes and decorative plants for your space. Nothing is added to My Gardens until you choose to create growing spaces.</p>
      <details className="container-inspiration"><summary>Explore planter styles</summary><p>A few pots can become a whole garden. Explore ceramic, timber, metal and woven textures for patios, balconies and vegetable gardens. Choose Add container in the designer to use one.</p><div>{containerStyles.map(style=><figure key={style.id}><Image src={style.src} alt={`Watercolor illustration of ${style.name.toLowerCase()}`} width={280} height={280}/><figcaption><h3>{style.name}</h3><p>{style.detail}</p></figcaption></figure>)}</div></details>
    </>:<BlankGardenLayout key={`${selection.startsWith("new")?selection:current?.id??selection}:${coverRevision}`} userId={userId} gardenId={gardenId} spaces={props.spaces} onOpenSpace={props.onOpenSpace} onBack={()=>select(selection.startsWith("new")?"gallery":"saved")} initialItemId={initialBedId} selectedLayoutId={selection} onNewLayout={()=>select("gallery")} initialTemplateId={selection.startsWith("new:")?selection.slice(4):undefined} onSelectLayout={select} onLayoutsChange={setLayouts} onRename={()=>{setName(current?.name??"");setError("");setRenaming(true);}} onCreateSpaces={beds=>props.onCreateSpaces(beds,false)} />}
    {renaming&&<Dialog title="Rename layout" onClose={()=>setRenaming(false)}><form onSubmit={e=>{e.preventDefault();rename();}}><label>Layout name<input maxLength={100} required value={name} onChange={e=>setName(e.target.value)} className="seasonal-input mt-2 w-full rounded-xl border p-3"/></label>{error&&<p role="alert">{error}</p>}<button type="submit" className="seasonal-button mt-4 rounded-xl p-3">Save name</button></form></Dialog>}
  </section>;
}

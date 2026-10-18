"use client";
import { useState } from "react";
import Image from "next/image";
import {readDetails, type Space, type Plant} from "@/lib/garden";
import BlankGardenLayout, {loadCustomLayouts} from "@/components/BlankGardenLayout";
import InteriorHeader from "@/components/InteriorHeader";
import Dialog from "@/components/ui/Dialog";
import {initialLayout, nineBedLayout, linkedLayoutSpaces, type Bed} from "@/lib/garden-layout";
function GardenBedArt({bed}:{bed:Bed}){
 const flowers=bed.id==="flowers", herbs=bed.id==="herbs", garlic=bed.id==="garlic";
 const count=flowers?38:herbs?30:bed.id==="okra"?18:24;
 const palette=flowers?["#e89db4","#f6c2c9","#dc6e96","#fff1d7"]:["#3b8045","#75ad55","#a2c478","#295d36"];
 return <svg viewBox="0 0 200 160" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
 <defs><pattern id={`soil-${bed.id}`} width="17" height="17" patternUnits="userSpaceOnUse"><rect width="17" height="17" fill="#46382a"/><circle cx="4" cy="5" r="1.5" fill="#67503a"/><circle cx="12" cy="13" r="1" fill="#776044"/></pattern><radialGradient id={`leaf-${bed.id}`}><stop stopColor="#a5ce7e"/><stop offset="1" stopColor="#326d39"/></radialGradient></defs>
 <rect width="200" height="160" fill={`url(#soil-${bed.id})`}/>
 {Array.from({length:count},(_,i)=>{const x=12+(i%7)*29+((i*7)%9),y=12+Math.floor(i/7)*(flowers?27:35)+((i*11)%13),s=flowers?0.72:herbs?0.85:garlic?0.65:1.05;return <g key={i} transform={`translate(${x} ${y}) scale(${s}) rotate(${(i*37)%70-35})`}>
 <path d="M0 14V-13" stroke="#4a7939" strokeWidth="2.8"/><ellipse cx="-9" cy="-6" rx="11" ry="6" fill={`url(#leaf-${bed.id})`} transform="rotate(30 -9 -6)"/><ellipse cx="9" cy="-8" rx="11" ry="6" fill={palette[i%palette.length]} transform="rotate(-30 9 -8)"/><ellipse cx="0" cy="-15" rx="6" ry="12" fill="#699e4d"/>
 {flowers?<g><circle r="7.5" cy="-10" fill={palette[i%4]}/><circle cx="-6" cy="-13" r="5" fill={palette[i%4]}/><circle cx="6" cy="-13" r="5" fill={palette[i%4]}/><circle cx="0" cy="-10" r="3" fill="#e9bc55"/></g>:bed.id.includes("tomatoes")?<circle cx="7" cy="3" r="5" fill="#c74831"/>:bed.id.includes("peppers")?<ellipse cx="7" cy="5" rx="4" ry="7" fill={bed.id==="green-peppers"?"#71a643":"#c95635"}/>:null}
 </g>})}</svg>;
}
export default function LegacyGardenLayout({userId,gardenId,gardenName,initialBedId,spaces,onOpenSpace,onClose,onCreateSpaces,onNewLayout}:{userId:string;gardenId:string;gardenName:string;initialBedId?:string;spaces:Space[];onOpenSpace:(spaceId:string)=>void;onClose:()=>void;onNewLayout?:()=>void;onCreateSpaces:(beds:Bed[],excludePeppers?:boolean)=>Promise<number|null>}){
 const customKey=`garden-os-custom-layouts-v1-${userId}-${gardenId}`;
 const selectionKey=`garden-os-layout-selection-${userId}-${gardenId}`;
 const [customLayouts,setCustomLayouts]=useState(()=>loadCustomLayouts(customKey));
 const [layoutSelection,setLayoutSelection]=useState(()=>{try{const saved=localStorage.getItem(selectionKey);return loadCustomLayouts(customKey).some(layout=>layout.id===saved)?saved!:"original";}catch{return "original";}});
 function selectLayout(id:string){setLayoutSelection(id);if(id!=="new"){try{localStorage.setItem(selectionKey,id);}catch{/* Selection still works for this visit. */}}}
 const customOpen=layoutSelection!=="original";
 const originalNameKey=`garden-os-original-layout-name-${userId}-${gardenId}`;
 const [originalName,setOriginalName]=useState(()=>{try{return localStorage.getItem(originalNameKey)||"Original nine-bed layout";}catch{return "Original nine-bed layout";}});
 const [renaming,setRenaming]=useState(false),[renameName,setRenameName]=useState(""),[renameError,setRenameError]=useState("");
 const layoutName=layoutSelection==="original"?originalName:customLayouts.find(layout=>layout.id===layoutSelection)?.name;
 function renameLayout(){const name=renameName.trim();if(!name){setRenameError("Enter a layout name.");return;}try{if(layoutSelection==="original"){localStorage.setItem(originalNameKey,name);setOriginalName(name);}else{const next=customLayouts.map(layout=>layout.id===layoutSelection?{...layout,name}:layout);localStorage.setItem(customKey,JSON.stringify(next));setCustomLayouts(next);}setRenaming(false);}catch{setRenameError("Could not save the name in this browser. Try again.");}}

 const storageKey=`garden-os-layout-2027-${userId}-${gardenId}`;
 const [beds,setBeds]=useState<Bed[]>(()=>{if(typeof window==="undefined")return initialLayout;try{const saved=JSON.parse(localStorage.getItem(storageKey)||"null");return nineBedLayout(saved);}catch{return initialLayout;}});
 const [photoReady,setPhotoReady]=useState(false); const [selected,setSelected]=useState(initialBedId||"garlic"); const [editing,setEditing]=useState(false); const [notice,setNotice]=useState(""); const [view,setView]=useState<"garden"|"plan">("garden");
 const [importOpen,setImportOpen]=useState(false), [importing,setImporting]=useState(false), [importMessage,setImportMessage]=useState("");
 const importBeds=beds.filter(b=>!/pepper/i.test(`${b.id} ${b.name}`));
 async function createSpaces(){setImporting(true);setImportMessage("");try{const count=await onCreateSpaces(importBeds);setImportMessage(count===null?"Could not save the spaces. Check your connection and try again.":count===0?"These spaces are already in your garden. No duplicates added.":`${count} growing spaces saved to ${gardenName}.`);}catch{setImportMessage("Could not save the spaces. Try again.");}finally{setImporting(false);}}
 const active=beds.find(b=>b.id===selected);
 const links=linkedLayoutSpaces(beds,spaces);
 const linkedSpace=active?links.get(active.id):undefined;
 let linkedPlants:Plant[]=[], recordError="";
 if(linkedSpace){try{linkedPlants=readDetails(linkedSpace.notes).plants;}catch(error){recordError=error instanceof Error?error.message:"Could not read plants.";}}

 function update(next:Bed[]){setBeds(next);try{localStorage.setItem(storageKey,JSON.stringify(next));setNotice("Layout saved. Check cloud synchronization in Settings.");}catch{setNotice("Storage unavailable; layout is only saved for this visit.");}}
 function change(field:keyof Bed,value:string){if(!active)return;update(beds.map(b=>b.id===active.id?{...b,[field]:["x","y","w","h"].includes(field)?Number(value):value}:b));}
 return <><div className="interior-page layout-page"><InteriorHeader title="Garden Layout" eyebrow="See the whole garden" description="Your saved plans, connected beds, and the plants that belong in each space."/>
 {renaming&&<Dialog title="Rename layout" onClose={()=>setRenaming(false)}><form onSubmit={event=>{event.preventDefault();renameLayout();}}><label className="block text-sm font-bold">Layout name<input required maxLength={100} value={renameName} onChange={event=>setRenameName(event.target.value)} className="seasonal-input mt-2 w-full rounded-xl border p-3"/></label>{renameError&&<p role="alert" className="mt-3 text-sm">{renameError}</p>}<button type="submit" className="seasonal-button mt-5 min-h-11 rounded-xl px-4 py-3 font-bold text-white">Save name</button></form></Dialog>}
 <div className="layout-collection">
 <div className="layout-switcher"><nav aria-label="Saved garden layouts" className="layout-tab-list">{[{id:"original",name:originalName},...customLayouts].map(layout=><button type="button" key={layout.id} aria-current={layoutSelection===layout.id?"page":undefined} onClick={()=>selectLayout(layout.id)} className={`layout-tab ${layoutSelection===layout.id?"is-active":""}`}>{layout.name}</button>)}</nav></div>
 <div className="min-w-0">
 {customOpen ? <BlankGardenLayout key={layoutSelection==="new"?"new":`saved-${layoutName}`} userId={userId} gardenId={gardenId} spaces={spaces} onOpenSpace={onOpenSpace} onBack={onClose} initialItemId={initialBedId} selectedLayoutId={layoutSelection} onSelectLayout={selectLayout} onNewLayout={onNewLayout} onLayoutsChange={setCustomLayouts} onRename={()=>{setRenameName(layoutName??"");setRenameError("");setRenaming(true);}} onCreateSpaces={beds=>onCreateSpaces(beds,false)}/> : <section className="layout-plan">
 {importOpen && <Dialog title="Create growing spaces from layout" onClose={()=>{if(!importing)setImportOpen(false);}}>
 <p className="seasonal-muted">Save these beds to {gardenName}. Pepper beds are excluded. Existing matching spaces will be kept.</p>
 <ul className="my-4 list-disc space-y-2 pl-5">{importBeds.map(b=><li key={b.id}>{b.name}{beds.filter(other=>other.name===b.name).length>1 ? ` (${beds.filter(other=>other.name===b.name).indexOf(b)+1})`:""}</li>)}</ul>
 <p className="seasonal-muted text-sm">Dimensions stay blank because the map has no real measurements. Add them in My Garden to estimate capacity. Flower and herb borders start as in-ground beds; other beds start as raised beds. You can edit the type later. Planting notes are carried over; plant counts are not guessed.</p>
 <button type="button" disabled={importing || !importBeds.length} onClick={createSpaces} className="seasonal-button mt-5 rounded-xl px-4 py-3 font-bold text-white disabled:opacity-50">{importing?"Saving…":"Save growing spaces"}</button>
 {importMessage&&<p role="status" className="mt-4 text-sm">{importMessage}</p>}
 </Dialog>}

 <div className="layout-title-bar"><div className="flex items-center gap-4"><div><h2 className="editorial-title seasonal-heading text-4xl">{originalName}</h2><p className="seasonal-muted mt-1">Connected growing spaces for {gardenName}.</p></div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>{setRenameName(originalName);setRenameError("");setRenaming(true);}} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-semibold">Rename layout</button><button type="button" onClick={()=>onNewLayout?onNewLayout():selectLayout("new")} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-semibold">Create a layout</button><button onClick={()=>setView("garden")} aria-pressed={view==="garden"} className={`rounded-xl px-4 py-3 font-semibold ${view==="garden"?"bg-[var(--primary-dark)] text-white":"seasonal-outline border"}`}>Garden View</button><button onClick={()=>setView("plan")} aria-pressed={view==="plan"} className={`rounded-xl px-4 py-3 font-semibold ${view==="plan"?"bg-[var(--primary-dark)] text-white":"seasonal-outline border"}`}>Plan View</button><button onClick={()=>{setImportOpen(true);setImportMessage("");}} disabled={gardenId === "planning"} className="seasonal-button rounded-xl px-4 py-3 font-semibold text-white disabled:opacity-50">Create growing spaces</button><button onClick={()=>setEditing(!editing)} className="seasonal-outline rounded-xl border px-4 py-3 font-semibold">{editing?"Done editing":"✎ Edit Layout"}</button><button onClick={onClose} className="seasonal-outline rounded-xl border px-4 py-3 font-semibold">← Back</button></div></div>
 <div className="layout-map-workspace">
 <nav aria-label="Select a garden bed" className="layout-bed-tabs">{beds.map(b=><button key={b.id} aria-pressed={selected===b.id} onClick={()=>setSelected(b.id)}>{b.name}</button>)}</nav>
 <div className="layout-map-panel">
 <div className="relative aspect-[990/841] w-full overflow-hidden" style={{background:view==="garden"?"repeating-linear-gradient(27deg,#a88c64 0px,#a88c64 3px,#c1a47c 4px,#a98b64 12px)":"linear-gradient(135deg,#d7e5c7,#b6c9a4)"}}>
 {view==="garden"&&<Image fill sizes="(max-width: 1279px) 90vw, 55vw" src="/Garden%20Artwork.webp" alt="Photorealistic overhead view of the 2027 garden, with flower and herb borders, garlic, green peppers, okra, tomatoes and hot peppers" className="absolute inset-0 h-full w-full object-fill" onLoad={()=>setPhotoReady(true)} onError={()=>setPhotoReady(false)}/>}
 {beds.map(b=><button type="button" key={b.id} onClick={()=>setSelected(b.id)} aria-label={`Select ${b.name}`} className={`group absolute overflow-hidden text-center transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-200 ${view==="garden"?"border-2 border-transparent bg-transparent hover:border-amber-200/80": "border-[7px] shadow-[3px_7px_14px_#2d211b80]"} ${selected===b.id?"ring-4 ring-[#f7df9b] ring-offset-2 ring-offset-[#8b7758]":""}`} style={{left:`${b.x}%`,top:`${b.y}%`,width:`${b.w}%`,height:`${b.h}%`,borderColor:view==="garden"?"transparent":"#6b8962",borderRadius:b.id==="flowers"?"55px":b.id==="herbs"?"40px":b.id.includes("bottom")?"32px":"12px",background:view==="garden"?"transparent":"#486f3b",boxShadow:view==="garden"?"none":"inset 0 0 0 3px #c39a66, 3px 7px 14px #2d211b80"}}>
 {view==="garden"?(photoReady?null:<GardenBedArt bed={b}/>):<div className="absolute inset-0" style={{background:`repeating-linear-gradient(45deg,${b.color},${b.color} 14px,#ffffff22 15px,#ffffff22 16px)`}}/>}
 {(view==="plan"||!photoReady)&&<span className="absolute bottom-1 left-1/2 max-w-[95%] -translate-x-1/2 rounded-lg bg-[#fff8e9ef] px-2 py-1 text-[clamp(9px,1.2vw,13px)] font-bold leading-tight text-[#3e3326] shadow">{b.name}</span>}
 </button>)}
 </div><div className="bg-[var(--surface-alt)] px-4 py-3 text-xs text-[var(--muted)]">{view==="garden"?(photoReady?"Photorealistic overhead garden (interactive bed hotspots)":"Illustrated garden preview (interactive bed hotspots)"):"Simplified planning view"} · Approximate placement, not measured to scale</div></div>
 <aside className="layout-bed-panel bed-editorial-panel">
 {active ? <>
 <div className="bed-editorial-kicker"><span className="bed-editorial-dot" style={{background:active.color}}/> GARDEN BED <span className="bed-editorial-index">{String(beds.findIndex(b=>b.id===active.id)+1).padStart(2,"0")} / {String(beds.length).padStart(2,"0")}</span></div>
 <h3 className="bed-editorial-name">{active.name}</h3>
 <p className="bed-editorial-description">{active.notes || "Your garden story for this bed starts here. Add notes or connect a growing space to track its plants."}</p>
 <div className="bed-editorial-summary">
 <div><span>Plants recorded</span><strong>{linkedSpace&&!recordError?linkedPlants.reduce((sum,plant)=>sum+(Number(plant.quantity)||0),0):"—"}</strong></div>
 <div><span>Growing space</span><strong>{linkedSpace?"Connected":"Not linked"}</strong></div>
 </div>
 <div className="bed-editorial-section">
 <div className="bed-editorial-section-heading"><h4>Growing in this bed</h4>{linkedSpace&&<span className="bed-editorial-subtle">Live garden records</span>}</div>
 {recordError?<p role="alert" className="bed-editorial-empty">{recordError}</p>:linkedSpace&&linkedPlants.length>0?
 <div className="bed-editorial-plant-list">{linkedPlants.map(plant=><div key={plant.id} className="bed-editorial-plant"><div className="bed-editorial-plant-mark">✦</div><div className="min-w-0 flex-1"><strong>{plant.name}</strong>{plant.variety&&<span className="bed-editorial-subtle"> · {plant.variety}</span>}<p>{plant.quantity} plants · {plant.status}{plant.planted?` · Planted ${plant.planted}`:""}</p></div></div>)}</div>:
 <p className="bed-editorial-empty">{linkedSpace?"No plants have been added to this growing space yet.":"Connect a growing space to see the plants growing here."}</p>}
 {linkedSpace&&<button type="button" disabled={!!recordError} onClick={()=>onOpenSpace(linkedSpace.id)} className="bed-editorial-primary">Manage plants <span aria-hidden="true">↗</span></button>}
 </div>
 {active.id==="garlic"&&<div className="bed-editorial-next"><span>SUCCESSION PLAN</span><strong>Garlic <span>→</span> Broccoli <span>→</span> Lettuce</strong></div>}
 <details className="bed-editorial-settings" open={editing}>
 <summary>Bed settings <span aria-hidden="true">⌄</span></summary>
 <div className="bed-editorial-settings-body">
 <label className="block text-sm font-semibold">Linked growing space<select aria-label="Linked growing space" value={linkedSpace?.id??""} onChange={event=>update(beds.map(b=>b.id===active.id?{...b,spaceId:event.target.value||undefined}:b))} className="seasonal-input mt-2 w-full rounded-xl border p-3"><option value="">Choose a growing space</option>{spaces.filter(space=>space.id===linkedSpace?.id||![...links.entries()].some(([bedId,spaceMatch])=>bedId!==active.id&&spaceMatch.id===space.id)).map(space=><option key={space.id} value={space.id}>{space.name}</option>)}</select></label>
 {editing&&<div className="mt-4 space-y-3"><label className="block text-sm font-semibold">Bed name<input value={active.name} onChange={e=>change("name",e.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-2"/></label><label className="block text-sm font-semibold">Notes<textarea value={active.notes} onChange={e=>change("notes",e.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-2" rows={3}/></label><label className="flex items-center justify-between gap-3 text-sm font-semibold">Bed color<input type="color" value={active.color} onChange={event=>change("color",event.target.value)} className="h-11 w-14 rounded-lg border p-1"/></label><p className="text-xs seasonal-muted">Map coordinates and size (%)</p>{(["x","y","w","h"] as const).map(field=><label key={field} className="flex items-center justify-between gap-3 text-sm"><span>{field.toUpperCase()}</span><input type="number" min="1" max="99" value={active[field]} onChange={e=>change(field,String(Math.max(1,Math.min(99,Number(e.target.value)))))} className="seasonal-input w-20 rounded-lg border p-2"/></label>)}</div>}
 {!!active.plants?.length&&<details className="mt-4"><summary className="cursor-pointer text-sm">Earlier layout notes</summary>{active.plants.map(plant=><p key={plant.id} className="mt-2 text-xs">{plant.name} {plant.variety} {plant.quantity} {plant.notes}</p>)}</details>}
 </div></details>
 {notice&&<p role="status" className="seasonal-muted mt-3 text-xs">{notice}</p>}
 </> : <div className="bed-editorial-empty">Select a garden bed to see its plants and notes.</div>}
 </aside></div></section>}</div></div></div></>;
}

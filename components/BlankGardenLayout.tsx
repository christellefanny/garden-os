"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import LayoutCoverPicker from "@/components/LayoutCoverPicker";
import { validLayoutCover } from "@/lib/layout-cover";
import { designPlants, groundCovers, surfaceAppearance, gardenFootprint, plantStampStyle, instantiateLayout, layoutTemplates, rotateItem, safeDecorations, type LayoutItem, type Layout, type Decoration } from "@/lib/layout-design";
import type {Bed} from "@/lib/garden-layout";
import { CompanionBedCheck } from "@/components/CompanionPlanting";
import Dialog from "@/components/ui/Dialog";
import { readDetails, type Space } from "@/lib/garden";
import { validAnalysisImage } from "@/lib/photo-layout";
import { containerArt, containerStyles, type ContainerStyleId } from "@/lib/container-art";

import { wallArt, wallStyles, type WallStyleId } from "@/lib/wall-art";

type Item = LayoutItem;
export type { Layout } from "@/lib/layout-design";
const kinds: Item["kind"][] = ["Bed", "Container", "Path", "Border", "Wall"];
const colors = {
  Bed: "#e7d9bc",
  Container: "#e8d7ba",
  Path: "#c2b69f",
  Border: "#667c60",
  Wall: "#b7ad97",
};
function safeColor(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
function colorText(background: string): string {
  const channels=[1,3,5].map(index=>{const value=parseInt(background.slice(index,index+2),16)/255;return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4;});
  const luminance=channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  return luminance>0.179?"#000000":"#ffffff";
}
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function loadCustomLayouts(key: string): Layout[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value)
      ? value.filter(
          (layout) =>
            typeof layout.id === "string" &&
            typeof layout.name === "string" &&
            Array.isArray(layout.items) &&
            layout.items.every(
              (item: Item) =>
                item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                kinds.includes(item.kind) &&
                [item.x, item.y, item.w, item.h].every(Number.isFinite) &&
                item.x >= 0 &&
                item.y >= 0 &&
                item.w >= 4 &&
                item.h >= 4 &&
                item.x + item.w <= 100 &&
                item.y + item.h <= 100,
            ),
        )
      : [];
  } catch {
    return [];
  }
}
export default function BlankGardenLayout({
  userId,
  gardenId,
  spaces,
  onOpenSpace,
  onBack,
  selectedLayoutId,
  onSelectLayout,
  onLayoutsChange,
  onRename,
  onCreateSpaces,
  initialItemId,
  initialTemplateId,
  onNewLayout,
}: {
  userId: string;
  gardenId: string;
  spaces: Space[];
  onOpenSpace: (id: string) => void;
  onBack: () => void;
  selectedLayoutId: string;
  onSelectLayout: (id:string) => void;
  onLayoutsChange: (layouts:Layout[]) => void;
  onRename:()=>void;
  initialItemId?:string;
  initialTemplateId?:string;
  onNewLayout?:()=>void;
  onCreateSpaces:(beds:Bed[])=>Promise<number|null>;
}) {
  const storageKey = `garden-os-custom-layouts-v1-${userId}-${gardenId}`;
  const [layouts, setLayouts] = useState<Layout[]>(() => loadCustomLayouts(storageKey));
  const layoutId = selectedLayoutId;
  const [view,setView]=useState<"garden"|"plan">("garden");
  const [editing,setEditing]=useState(true);
  const [importing,setImporting]=useState(false);
  const [selected, setSelected] = useState(()=>initialItemId||loadCustomLayouts(storageKey).find(l=>l.id===selectedLayoutId)?.items.find(i=>i.kind==="Bed")?.id||"");
  const [creating, setCreating] = useState(() => selectedLayoutId.startsWith("new") || loadCustomLayouts(storageKey).length === 0);
  const template = layoutTemplates.find(t=>t.id===initialTemplateId);
  const [newName, setNewName] = useState(template?.name ?? "My garden layout");
  const [coverImage,setCoverImage] = useState<string|undefined>();
  const [coverBusy,setCoverBusy] = useState(false);
  const [undo, setUndo] = useState<Layout[] | null>(null);
  const [plantGroup,setPlantGroup]=useState("Vegetables");
  const [selectedPlant,setSelectedPlant]=useState("");
  const [containerPicker,setContainerPicker]=useState(false);
  const [wallPicker,setWallPicker]=useState(false);
  const [showItemActions,setShowItemActions]=useState(false);
  useEffect(()=>{
    function dismiss(event:globalThis.PointerEvent){
      if(event.target instanceof Element&&!event.target.closest(".layout-canvas-item, .layout-on-canvas-actions"))setShowItemActions(false);
    }
    document.addEventListener("pointerdown",dismiss);
    return ()=>document.removeEventListener("pointerdown",dismiss);
  },[]);
  const plantGesture=useRef<{bedId:string;id:string;x:number;y:number;width:number;height:number;original:Decoration;latest:Decoration}|null>(null);
  const [message, setMessage] = useState("");
  const [deleting,setDeleting]=useState(false),[deleteError,setDeleteError]=useState("");
  const canvas = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: string;
    kind: "move" | "resize";
    x: number;
    y: number;
    width: number;
    height: number;
    original: Item;
    latest: Item;
  } | null>(null);
  const layout = layouts.find((l) => l.id === layoutId);
  const photoSource = layout?.source?.method === "photo" ? layout.source : undefined;
  const footprint=layout?gardenFootprint(layout.items):null;
  const item = layout?.items.find((i) => i.id === selected);
  const space = item ? spaces.find(s=>{if(item.spaceId)return s.id===item.spaceId;try{return JSON.parse(s.notes??"null")?.sourceLayoutId===item.id;}catch{return false;}}) : undefined;
  let plants: ReturnType<typeof readDetails>["plants"] = [],
    plantError = "";
  if (space) {
    try {
      plants = readDetails(space.notes).plants;
    } catch (error) {
      plantError =
        error instanceof Error ? error.message : "Could not read plants.";
    }
  }
  function persist(next: Layout[], keepUndo = false) {
    if(!keepUndo)setUndo(null);
    setLayouts(next);
    onLayoutsChange(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setMessage("Layout saved. Check cloud synchronization in Settings.");
    } catch {
      setMessage(
        "Could not save in this browser. Keep this page open; your latest changes are only available for this visit.",
      );
    }
  }
  function deleteLayout(){
    if(!layout)return;
    try{
      const saved=JSON.parse(localStorage.getItem(storageKey)??"[]");
      if(!Array.isArray(saved))throw new Error("Invalid saved layouts");
      const remaining=saved.filter(l=>!l||l.id!==layout.id);
      localStorage.setItem(storageKey,JSON.stringify(remaining));
      onLayoutsChange(loadCustomLayouts(storageKey));
      setDeleting(false);
      onBack();
    }catch{setDeleteError("Could not delete this layout in your browser. Please try again.");}
  }
  function replaceItem(next: Item) {
    if (!layout) return;
    persist(
      layouts.map((l) =>
        l.id === layoutId
          ? { ...l, items: l.items.map((i) => (i.id === next.id ? next : i)) }
          : l,
      ),
    );
  }
  function add(kind: Item["kind"], containerStyle?: ContainerStyleId, wallStyle?: WallStyleId) {
    if (!layout) return;
    if (kind === "Container" && !containerStyle) { setContainerPicker(true); return; }
    if (kind === "Wall" && !wallStyle) { setWallPicker(true); return; }
    const wall = wallStyle ? wallArt(wallStyle) : undefined;
    const vessel = containerStyle ? containerArt(containerStyle) : undefined;
    const next: Item = {
      id: crypto.randomUUID(),
      name: `${kind} ${layout.items.filter((i) => i.kind === kind).length + 1}`,
      kind,
      x: 10,
      y: 10,
      w: vessel?.w ?? (kind === "Wall" ? (wallStyle==="curved-block"?60:40) : kind === "Path" ? 55 : 20),
      h: vessel?.h ?? (kind === "Wall" ? (wallStyle==="curved-block"?16:wallStyle==="curved-stone"?20:12) : kind === "Path" ? 8 : 20),
      spaceId: "",
      ...(vessel ? {containerStyle:vessel.id,name:vessel.name} : {}),
      ...(wall ? {wallStyle:wall.id,name:wall.name} : {}),
    };
    persist(
      layouts.map((l) =>
        l.id === layoutId ? { ...l, items: [...l.items, next] } : l,
      ),
    );
    setSelected(next.id);
    setSelectedPlant("");
    setShowItemActions(true);
    setContainerPicker(false);
    setWallPicker(false);
  }
  function create() {
    if(coverBusy)return;
    const name = newName.trim();
    if (!name) {
      setMessage("Enter a layout name.");
      return;
    }
    const next = {...instantiateLayout(template,name), ...(validLayoutCover(coverImage) ? {coverImage} : {})};
    const saved=loadCustomLayouts(storageKey);
    try {
      const raw=JSON.parse(localStorage.getItem(storageKey)||"[]");
      if(!Array.isArray(raw)||raw.length!==saved.length)throw Error("An existing layout could not be read. Your saved designs have not been changed.");
      const serialized=JSON.stringify([...saved,next]);
      if(new TextEncoder().encode(serialized).length>1400000)throw Error("Your layouts are too large to sync together. Remove the cover picture or a layout you no longer need.");
      localStorage.setItem(storageKey,serialized);
    } catch(err){setMessage(err instanceof Error?err.message:"Could not save this layout. Please try again.");return;}
    persist([...saved, next]);
    onSelectLayout(next.id);
    setSelected(next.items.find(i=>i.kind==="Bed")?.id??"");
    setCreating(false);
    setEditing(true);
  }
  function start(
    event: PointerEvent<HTMLButtonElement>,
    target: Item,
    kind: "move" | "resize",
  ) {
    if (!editing || event.button !== 0 || !canvas.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    setSelected(target.id);
    setSelectedPlant("");
    setShowItemActions(true);
    const bounds = canvas.current.getBoundingClientRect();
    gesture.current = {
      id: target.id,
      kind,
      x: event.clientX,
      y: event.clientY,
      width: bounds.width,
      height: bounds.height,
      original: { ...target },
      latest: { ...target },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx = ((event.clientX - g.x) / g.width) * 100,
      dy = ((event.clientY - g.y) / g.height) * 100;
    const next =
      g.kind === "move"
        ? {
            ...g.original,
            x: clamp(g.original.x + dx, 0, 100 - g.original.w),
            y: clamp(g.original.y + dy, 0, 100 - g.original.h),
          }
        : {
            ...g.original,
            w: clamp(g.original.w + dx, 4, 100 - g.original.x),
            h: clamp(g.original.h + dy, 4, 100 - g.original.y),
          };
    g.latest = next;
    setLayouts((current) =>
      current.map((l) =>
        l.id === layoutId
          ? { ...l, items: l.items.map((i) => (i.id === g.id ? next : i)) }
          : l,
      ),
    );
  }
  function finish(cancel = false) {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    replaceItem(cancel ? g.original : g.latest);
  }
  function geometry(field: "x" | "y" | "w" | "h", value: number) {
    if (!item || !Number.isFinite(value)) return;
    const next = { ...item, [field]: value };
    next.w = clamp(next.w, 4, 100);
    next.h = clamp(next.h, 4, 100);
    next.x = clamp(next.x, 0, 100 - next.w);
    next.y = clamp(next.y, 0, 100 - next.h);
    replaceItem(next);
  }
  function removeItem(target:Item) {
    if(!editing)return;
    setUndo(layouts);
    persist(layouts.map(l=>l.id===layoutId?{...l,items:l.items.filter(i=>i.id!==target.id)}:l),true);
    setSelected("");setSelectedPlant("");
    setMessage("Shape removed. Linked growing spaces and garden records are unchanged.");
  }
  function addPlant(plantId:string) {
    if(!editing||!item||item.kind==="Path"||item.kind==="Wall"){setMessage("Select a bed, container, or border before adding an illustration.");return;}
    const decorations=safeDecorations(item.decorations),index=decorations.length;
    replaceItem({...item,decorations:[...decorations,{id:crypto.randomUUID(),plantId,...(item.kind==="Border" && item.w>item.h*2 ? {x:20+(index%4)*20,y:50} : item.kind==="Border" && item.h>item.w*2 ? {x:50,y:20+(index%4)*20} : {x:18+(index%3)*32,y:20+(Math.floor(index/3)%3)*30})}]});
    setSelectedPlant("");
  }
  function removePlant(){if(!item||!selectedPlant)return;setUndo(layouts);persist(layouts.map(l=>l.id===layoutId?{...l,items:l.items.map(i=>i.id===item.id?{...i,decorations:safeDecorations(i.decorations).filter(d=>d.id!==selectedPlant)}:i)}:l),true);setSelectedPlant("");}
  function startPlant(event:PointerEvent<HTMLButtonElement>,bed:Item,plant:Decoration){
    if(!editing||event.button!==0||!canvas.current)return;event.preventDefault();event.stopPropagation();event.currentTarget.focus();setSelected(bed.id);setSelectedPlant(plant.id);setShowItemActions(true);
    const bounds=canvas.current.getBoundingClientRect();plantGesture.current={bedId:bed.id,id:plant.id,x:event.clientX,y:event.clientY,width:bounds.width*bed.w/100,height:bounds.height*bed.h/100,original:plant,latest:plant};event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePlant(event:PointerEvent<HTMLButtonElement>){const g=plantGesture.current;if(!g)return;const next={...g.original,x:clamp(g.original.x+(event.clientX-g.x)/g.width*100,12,88),y:clamp(g.original.y+(event.clientY-g.y)/g.height*100,12,88)};g.latest=next;setLayouts(current=>current.map(l=>l.id===layoutId?{...l,items:l.items.map(i=>i.id===g.bedId?{...i,decorations:safeDecorations(i.decorations).map(d=>d.id===g.id?next:d)}:i)}:l));}
  function finishPlant(cancel=false){const g=plantGesture.current;if(!g)return;plantGesture.current=null;const bed=layout?.items.find(i=>i.id===g.bedId);if(bed)replaceItem({...bed,decorations:safeDecorations(bed.decorations).map(d=>d.id===g.id?(cancel?g.original:g.latest):d)});}
  return (
    <section className="mt-8 layout-editor">
      {wallPicker&&<Dialog title="Choose a garden wall" onClose={()=>setWallPicker(false)}><p className="seasonal-muted mb-4">Frame a garden corner or create a place to pause. Place containers on, around or beside your wall. These are visual planning pieces.</p><div className="container-picker-grid">{wallStyles.map(style=><button type="button" key={style.id} onClick={()=>add("Wall",undefined,style.id)} aria-label={`Add ${style.name}`}><Image src={style.src} alt="" width={320} height={140}/><strong>{style.name}</strong><span>{style.detail}</span></button>)}</div></Dialog>}
      {containerPicker&&<Dialog title="Choose a pot or planter" onClose={()=>setContainerPicker(false)}><p className="seasonal-muted mb-4">A little character for your garden. Choose a vessel, then add vegetables, herbs or flowers.</p><div className="container-picker-grid">{containerStyles.map(style=><button type="button" key={style.id} onClick={()=>add("Container",style.id)} aria-label={`Add ${style.name}`}><Image src={style.src} alt="" width={240} height={240}/><strong>{style.name}</strong><span>{style.detail}</span></button>)}</div></Dialog>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow seasonal-muted">Your garden, your design</p>
          <h2 className="editorial-title seasonal-heading mt-2 text-4xl">
            {layout?.name ?? "New garden layout"}
          </h2>
          <p className="seasonal-muted mt-2">
            Make it yours. Place beds, containers, paths, and decorative plants.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              if(onNewLayout){onNewLayout();return;}
              setNewName("My garden layout");
              setCreating(true);
            }}
            className="seasonal-button min-h-11 rounded-xl px-4 py-3 font-bold text-white"
          >
            Create layout
          </button>
          {layout&&<>
          <button type="button" onClick={onRename} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">Rename layout</button>
          <button type="button" onClick={()=>{setDeleteError("");setDeleting(true);}} className="min-h-11 rounded-xl border border-red-200 px-4 py-3 font-bold text-red-800">Delete layout</button>
          <button type="button" aria-pressed={view==="garden"} onClick={()=>setView("garden")} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">Garden View</button>
          <button type="button" aria-pressed={view==="plan"} onClick={()=>setView("plan")} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">Plan View</button>
          <button type="button" onClick={()=>setEditing(!editing)} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">{editing?"Done editing":"Edit Layout"}</button>
          <button type="button" disabled={importing || gardenId === "planning"} title={gardenId === "planning" ? "Create a garden in My Gardens before linking growing spaces." : undefined} onClick={async()=>{setImporting(true);try{const beds:Bed[]=layout.items.filter(item=>item.kind==="Bed"||item.kind==="Container").map(item=>({...item,emoji:"",color:safeColor(item.color,colors[item.kind]),notes:"",spaceType:item.kind==="Container"?"Container":"Raised Bed"}));const count=await onCreateSpaces(beds);setMessage(count===null?"Could not save growing spaces. Try again.":count===0?"No new growing spaces to add. Existing matches were kept.":`${count} growing spaces created.`);}finally{setImporting(false);}}} className="seasonal-button min-h-11 rounded-xl px-4 py-3 font-bold text-white disabled:opacity-50">{importing?"Saving…":"Create growing spaces"}</button>
          </>}
          <button type="button" onClick={onBack} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">Back</button>
        </div>
      </div>
      {deleting&&layout&&<Dialog title="Delete this layout?" onClose={()=>setDeleting(false)}>
        <p className="leading-relaxed">Delete <strong>{layout.name}</strong>? This removes only the saved design. Your gardens, growing spaces, plants, and journal entries will stay.</p>
        {deleteError&&<p role="alert" className="mt-3 text-red-800">{deleteError}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={()=>setDeleting(false)} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3">Keep layout</button>
          <button type="button" onClick={deleteLayout} className="min-h-11 rounded-xl bg-red-800 px-4 py-3 font-bold text-white">Delete layout</button>
        </div>
      </Dialog>}
      {creating && (
        <Dialog
          title={template ? `Customize ${template.name.toLowerCase()}` : "Create a blank layout"}
          onClose={() => { if(!coverBusy)setCreating(false); }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              create();
            }}
          >
            <label className="block text-sm font-bold">
              Layout name
              <input
                required
                maxLength={100}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="seasonal-input mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <LayoutCoverPicker value={coverImage} onChange={setCoverImage} onBusyChange={setCoverBusy}/>
            {message&&<p role="status" className="mt-3 text-sm">{message}</p>}
            <p className="seasonal-muted mt-3 text-sm">
              {template ? "Create your own editable copy. The inspiration stays unchanged." : "Start with an empty canvas and build your own arrangement."} Your plan stays on this device and syncs when an account is connected.
            </p>
            <button
              type="submit"
              disabled={coverBusy}
              className="seasonal-button mt-5 min-h-11 rounded-xl px-4 py-3 font-bold text-white"
            >
              {template ? "Create my editable copy" : "Create blank canvas"}
            </button>
          </form>
        </Dialog>
      )}
      {layout ? (
        <>
          <div className="seasonal-card mt-6 flex flex-wrap items-center gap-3 rounded-2xl border p-4">
            <label className="flex items-center gap-2 text-sm font-bold">
              Garden color
              <input type="color" value={safeColor(layout.color,"#f4f1e7")} onChange={event=>persist(layouts.map(l=>l.id===layoutId?{...l,color:event.target.value}:l))} className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--border)] p-1" />
            </label>
            {kinds.map((kind) => (
              <button
                type="button"
                key={kind}
                disabled={!editing}
                onClick={() => add(kind)}
                className="seasonal-outline min-h-11 rounded-xl border px-3 py-2 text-sm font-bold"
              >
                Add {kind.toLowerCase()}
              </button>
            ))}
          </div>
          <section className="layout-ground-picker" aria-label="Garden ground cover"><div><h3>Ground between the beds</h3><p>Cover stays inside the garden area defined by your beds and borders. Paths can have their own finish.</p></div><div className="layout-ground-options"><button type="button" aria-pressed={!groundCovers.some(c=>c.id===layout.groundCover)} disabled={!editing} onClick={()=>persist(layouts.map(l=>l.id===layoutId?{...l,groundCover:undefined}:l))}><span className="layout-ground-swatch layout-ground-plain"/>Plain ground</button>{groundCovers.map(cover=><button type="button" key={cover.id} aria-pressed={layout.groundCover===cover.id} disabled={!editing} onClick={()=>persist(layouts.map(l=>l.id===layoutId?{...l,groundCover:cover.id}:l))}><span className="layout-ground-swatch" style={{backgroundImage:`url("${cover.src}")`}}/>{cover.name}</button>)}</div></section>
          {undo&&<div className="layout-undo" role="status">Item removed. <button type="button" onClick={()=>{persist(undo);setSelectedPlant("");}}>Undo removal</button></div>}
          <details className="layout-plant-drawer"><summary>Add vegetables &amp; flowers <span>13 vegetables · 6 flowers</span></summary><section className="layout-plant-library" aria-labelledby="layout-library-title"><div><h3 id="layout-library-title">A little life for your plan</h3><p>Decorative illustrations only — no plant records, quantities, or capacity calculations. Select a bed, container, or border, then add a plant.</p></div><div className="layout-library-tabs">{["Vegetables","Flowers"].map(group=><button type="button" key={group} aria-pressed={plantGroup===group} onClick={()=>setPlantGroup(group)}>{group} · {designPlants.filter(p=>p.group===group).length}</button>)}</div><div className="layout-plant-options">{designPlants.filter(p=>p.group===plantGroup).map(p=><button type="button" key={p.id} disabled={!editing||!item||item.kind==="Path"||item.kind==="Wall"} aria-label={`Add decorative ${p.name}`} onClick={()=>addPlant(p.id)}><Image src={p.src} alt="" width={66} height={66}/><span>{p.name}</span></button>)}</div></section></details>
          <p className="seasonal-muted mt-3 text-sm">
            Drag an item to move it. Drag its corner to resize. You can also use
            the position and size fields or arrow keys. This is a planning map,
            not measured to scale. Select a shape to rotate or delete it on the canvas. Drag plant illustrations within their bed. Illustrations may extend beyond thin borders to stay visible.
          </p>
          {photoSource&&<details className="photo-saved-reference"><summary>Photo &amp; garden notes · approximate map</summary><p>Reviewed from a photo. Check real measurements and walking space before building or planting.</p>{photoSource.image&&validAnalysisImage(photoSource.image)&&<Image src={photoSource.image} width={600} height={400} unoptimized alt="Original photo reference for this garden layout"/>}{photoSource.widthFeet&&<p>Width reference: {photoSource.widthFeet} ft</p>}{photoSource.depthFeet&&<p>Depth reference: {photoSource.depthFeet} ft</p>}{photoSource.notes&&<p className="whitespace-pre-wrap">{photoSource.notes}</p>}</details>}
          <label className="layout-selection-picker">Selected shape<select aria-label="Select garden shape" value={selected} onChange={e=>{setSelected(e.target.value);setSelectedPlant("");setShowItemActions(Boolean(e.target.value));}}><option value="">Choose a shape</option>{layout.items.map(i=><option key={i.id} value={i.id}>{i.name} · {i.kind}</option>)}</select><span>Use this to reach overlapping shapes.</span></label>
          <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div
              ref={canvas}
              onPointerDown={event=>{if(event.target===event.currentTarget){setSelected("");setSelectedPlant("");setShowItemActions(false);}}}
              onKeyDown={event=>{if(event.key==="Escape"){setSelected("");setSelectedPlant("");setShowItemActions(false);}}}
              aria-label="Garden layout canvas"
              className="layout-design-canvas relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[#f4f1e7]"
              style={{
                ...(photoSource?.aspectRatio&&Number.isFinite(photoSource.aspectRatio)&&photoSource.aspectRatio>=.25&&photoSource.aspectRatio<=4?{aspectRatio:photoSource.aspectRatio}:{}),
                backgroundColor: safeColor(layout.color,"#f4f1e7"),
                ...(view === "plan" ? {backgroundImage:"linear-gradient(#d7d0bb60 1px,transparent 1px),linear-gradient(90deg,#d7d0bb60 1px,transparent 1px)",backgroundSize:"5% 5%"}:{}),
              }}
            >
              {view==="garden"&&footprint&&groundCovers.some(c=>c.id===layout.groundCover)&&<div className="layout-ground-area" data-ground-cover={layout.groundCover} aria-hidden="true" style={{...footprint,...surfaceAppearance(layout.groundCover)}}/>}
              {!layout.items.length && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center">
                  <p className="layout-empty-hint max-w-xs">
                    Your blank canvas is ready. Add a bed or container to start
                    planning.
                  </p>
                </div>
              )}
              {layout.items.map((target) => (
                <div
                  key={target.id}
                  className={`layout-canvas-item absolute ${selected === target.id ? "z-10" : ""}`}
                  data-selected={selected === target.id && showItemActions}
                  style={{
                    zIndex: selected===target.id ? 10 : target.kind==="Path" ? 0 : target.kind==="Wall" ? 1 : 2,
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    width: `${target.w}%`,
                    height: `${target.h}%`,
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Select ${target.name}`}
                    onClick={() => {setSelected(target.id);setSelectedPlant("");setShowItemActions(true);}}
                    onPointerDown={(event) => start(event, target, "move")}
                    onPointerMove={move}
                    onPointerUp={() => finish()}
                    onPointerCancel={() => finish(true)}
                    onKeyDown={(event) => {
                      if(!editing)return;
                      if(event.key==="Delete"||event.key==="Backspace"){event.preventDefault();removeItem(target);return;}
                      const delta = event.shiftKey ? 5 : 1;
                      const changes: Record<string, [number, number]> = {
                        ArrowLeft: [-delta, 0],
                        ArrowRight: [delta, 0],
                        ArrowUp: [0, -delta],
                        ArrowDown: [0, delta],
                      };
                      const direction = changes[event.key];
                      if (direction) {
                        event.preventDefault();
                        setSelected(target.id);
                        replaceItem({
                          ...target,
                          x: clamp(target.x + direction[0], 0, 100 - target.w),
                          y: clamp(target.y + direction[1], 0, 100 - target.h),
                        });
                      }
                    }}
                    data-illustrated={(target.kind==="Container"||target.kind==="Wall")&&view==="garden"?"true":undefined}
                    className={`layout-object-shape layout-object-${target.kind.toLowerCase()} h-full w-full touch-none overflow-hidden border-2 p-1 text-center text-xs font-bold shadow-sm focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${selected === target.id ? "border-[var(--atelier-deep)] ring-2 ring-[var(--atelier-deep)]" : "border-white/70"}`}
                    style={{
                      backgroundColor: safeColor(target.color,colors[target.kind]),
                      ...surfaceAppearance(view === "garden" && target.kind === "Path" ? target.groundCover : undefined),
                      color: colorText(safeColor(target.color,colors[target.kind])),
                      borderRadius:
                        target.kind === "Container" ? "50%" : "10px",
                      ...((target.kind==="Container"||target.kind==="Wall")&&view==="garden"?{background:"transparent",borderRadius:0,borderColor:"transparent",boxShadow:"none",overflow:"visible"}:{}),
                    }}
                  >
                    {target.kind==="Wall"&&view==="garden"&&<span className="layout-wall-art" style={{position:"absolute",left:"50%",top:"50%",width:(target.wallRotation??0)%180!==0?`${target.h/target.w*100}%`:"100%",height:(target.wallRotation??0)%180!==0?`${target.w/target.h*100}%`:"100%",transform:`translate(-50%,-50%) rotate(${[0,90,180,270].includes(target.wallRotation??0)?target.wallRotation??0:0}deg)`,pointerEvents:"none"}}><Image src={wallArt(target.wallStyle).src} alt="" fill sizes="400px" style={{objectFit:"fill"}} draggable={false}/></span>}
                    {target.kind==="Container"&&view==="garden"&&<Image className="layout-container-illustration" src={containerArt(target.containerStyle).src} alt="" fill sizes="(max-width:700px) 130px, 240px" draggable={false}/>}
                  </button>
                  <span aria-hidden="true" className="layout-object-label" style={{top:target.y<8?"100%":0,transform:target.y<8?"translateY(5px)":"translateY(calc(-100% - 5px))",left:target.x>65?"auto":0,right:target.x>65?0:"auto"}}>{target.name}</span>
                  {view==="garden"&&safeDecorations(target.decorations).map(plant=>{const art=designPlants.find(p=>p.id===plant.plantId)!;return <button type="button" key={plant.id} aria-label={`Move ${art.name} illustration in ${target.name}`} aria-pressed={selectedPlant===plant.id} onClick={()=>{setSelected(target.id);setSelectedPlant(plant.id);setShowItemActions(true);}} onPointerDown={e=>startPlant(e,target,plant)} onPointerMove={movePlant} onPointerUp={()=>finishPlant()} onPointerCancel={()=>finishPlant(true)} onKeyDown={event=>{if(!editing)return;const d={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[event.key];if(d){event.preventDefault();replaceItem({...target,decorations:safeDecorations(target.decorations).map(p=>p.id===plant.id?{...p,x:clamp(p.x+d[0],12,88),y:clamp(p.y+d[1],12,88)}:p)});}if(event.key==="Delete"||event.key==="Backspace"){event.preventDefault();setSelected(target.id);setUndo(layouts);persist(layouts.map(l=>l.id===layoutId?{...l,items:l.items.map(i=>i.id===target.id?{...i,decorations:safeDecorations(i.decorations).filter(p=>p.id!==plant.id)}:i)}:l),true);setSelectedPlant("");}}} className={`layout-plant-stamp${art.group==="Flowers"?" layout-plant-flower":""}`} style={{...plantStampStyle(target,plant),...(target.kind==="Container"?{left:`${25+plant.x*.5}%`,top:`${20+(plant.y-50)*.1}%`}:{})}}><Image src={art.src} alt="" fill sizes="110px" draggable={false}/></button>;})}
                  {editing && selected === target.id && (
                    <button
                      type="button"
                      aria-label={`Resize ${target.name}`}
                      onPointerDown={(event) => start(event, target, "resize")}
                      onPointerMove={move}
                      onPointerUp={() => finish()}
                      onPointerCancel={() => finish(true)}
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 touch-none cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-[#665335] text-white shadow"
                    >
                      ↘
                    </button>
                  )}
                </div>
              ))}
              {editing&&item&&showItemActions&&<div className="layout-on-canvas-actions" role="group" aria-label={`Actions for ${item.name}`} style={{left:`${clamp(item.x,1,40)}%`,top:`${clamp(item.y<18?item.y+item.h:item.y,18,80)}%`,transform:item.y<18?"translateY(4px)":"translateY(calc(-100% - 4px))"}}>
                {selectedPlant?<button type="button" onClick={removePlant}>Delete plant</button>:<><button type="button" aria-label={`Rotate ${item.name} 90 degrees`} onClick={()=>replaceItem(rotateItem(item))}>↻ Rotate 90°</button><button type="button" aria-label={`Delete ${item.name}`} onClick={()=>removeItem(item)}>Delete</button></>}
              </div>}
            </div>
            <aside className="seasonal-card min-w-0 rounded-2xl border p-5">
              <h3 className="seasonal-heading text-xl font-bold">
                Item details
              </h3>
              {item ? (
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-bold">
                    Item name
                    <input
                      maxLength={100}
                      value={item.name}
                      onChange={(event) =>
                        replaceItem({ ...item, name: event.target.value })
                      }
                      className="seasonal-input mt-1 w-full rounded-xl border p-2"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-sm font-bold">
                    {item.kind} color
                    <input type="color" value={safeColor(item.color,colors[item.kind])} onChange={event=>replaceItem({...item,color:event.target.value})} className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--border)] p-1" />
                  </label>
                  {item.kind==="Path"&&<fieldset className="layout-path-cover"><legend>Path ground cover</legend><div className="layout-ground-options"><button type="button" disabled={!editing} aria-pressed={!groundCovers.some(c=>c.id===item.groundCover)} onClick={()=>replaceItem({...item,groundCover:undefined})}>Plain path</button>{groundCovers.map(cover=><button type="button" key={cover.id} disabled={!editing} aria-pressed={item.groundCover===cover.id} onClick={()=>replaceItem({...item,groundCover:cover.id})}><span className="layout-ground-swatch" style={{backgroundImage:`url("${cover.src}")`}}/>{cover.name}</button>)}</div></fieldset>}
                  <p className="seasonal-muted text-sm">{item.kind}</p>
                  {item.kind==="Wall"&&<fieldset className="container-style-options"><legend>Wall finish</legend><p>Arrange containers on or near the wall. Add separate segments for corners and leave an opening for access.</p><div>{wallStyles.map(style=><button type="button" key={style.id} disabled={!editing} aria-label={`Use ${style.name}`} aria-pressed={wallArt(item.wallStyle).id===style.id} onClick={()=>replaceItem({...item,wallStyle:style.id})}><Image src={style.src} alt="" width={160} height={70}/><span>{style.name}</span></button>)}</div></fieldset>}
                  {item.kind==="Container"&&<fieldset className="container-style-options"><legend>Planter style</legend><p>Choose the vessel, then add vegetable or flower illustrations.</p><div>{containerStyles.map(style=><button type="button" key={style.id} disabled={!editing} aria-label={`Use ${style.name}`} aria-pressed={containerArt(item.containerStyle).id===style.id} onClick={()=>replaceItem({...item,containerStyle:style.id})}><Image src={style.src} alt="" width={100} height={100}/><span>{style.name}</span></button>)}</div></fieldset>}
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["x", "Left (%)"],
                        ["y", "Top (%)"],
                        ["w", "Width (%)"],
                        ["h", "Height (%)"],
                      ] as const
                    ).map(([field, label]) => (
                      <label key={field} className="block text-sm font-bold">
                        {label}
                        <input
                          disabled={!editing}
                          type="number"
                          min={field === "w" || field === "h" ? 4 : 0}
                          max={100}
                          step="1"
                          value={Math.round(item[field] * 10) / 10}
                          onChange={(event) =>
                            geometry(field, event.currentTarget.valueAsNumber)
                          }
                          className="seasonal-input mt-1 w-full rounded-xl border p-2"
                        />
                      </label>
                    ))}
                  </div>
                  {(item.kind === "Bed" || item.kind === "Container") && (
                    <>
                      <label className="block text-sm font-bold">
                        Linked growing space
                        <select
                          aria-label="Linked growing space"
                          value={item.spaceId || space?.id || ""}
                          onChange={(event) =>
                            replaceItem({
                              ...item,
                              spaceId: event.target.value,
                            })
                          }
                          className="seasonal-input mt-1 w-full rounded-xl border p-2"
                        >
                          <option value="">Choose a growing space</option>
                          {spaces.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {space ? (
                        <>
                          <p className="seasonal-muted text-sm">
                            Plants from {space.name}
                          </p>
                          {!plantError && <CompanionBedCheck plants={plants} />}
                          {plantError ? (
                            <p role="alert">{plantError}</p>
                          ) : plants.length ? (
                            <ul className="space-y-2">
                              {plants.map((p) => (
                                <li
                                  key={p.id}
                                  className="rounded-xl border border-[var(--border)] p-3 text-sm"
                                >
                                  <strong>{p.name}</strong>
                                  {p.variety && <span> · {p.variety}</span>}
                                  <p className="seasonal-muted mt-1">
                                    {p.quantity} plants · {p.status}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="seasonal-muted text-sm">
                              No plants recorded yet.
                            </p>
                          )}
                          <button
                            type="button"
                            disabled={!!plantError}
                            onClick={() => onOpenSpace(space.id)}
                            className="seasonal-outline min-h-11 rounded-xl border px-3 py-2 font-bold"
                          >
                            Manage plants
                          </button>
                        </>
                      ) : (
                        <p className="seasonal-muted text-sm">
                          Link a space to show its plant details here.
                        </p>
                      )}
                    </>
                  )}
                  <button type="button" disabled={!editing} onClick={()=>removeItem(item)} className="min-h-11 text-sm font-bold text-red-700 underline">Remove item</button>
                </div>
              ) : (
                <p className="seasonal-muted mt-4 text-sm">
                  Select an item to name, resize, or link it.
                </p>
              )}
            </aside>
          </div>
        </>
      ) : (
        <p className="seasonal-muted mt-6">
          Create a layout to start with an empty canvas.
        </p>
      )}
      {message && (
        <p role="status" className="seasonal-muted mt-4 text-sm">
          {message}
        </p>
      )}
    </section>
  );
}

"use client";
import { useEffect, useState } from "react";
import InteriorHeader from "@/components/InteriorHeader";

type PhotoEntry = { id:string; date:string; category:string; caption:string; plant:string; bed:string; photos:Blob[] };
const categories = ["My Garden","Seedlings","Harvests","Flowers","Plant Progress"];
const database = "garden-os-photo-journal-v1";
function openDatabase():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(database,1);
    request.onupgradeneeded=()=>{ if(!request.result.objectStoreNames.contains("entries")) request.result.createObjectStore("entries",{keyPath:"id"}); };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
async function transact<T>(mode:IDBTransactionMode, action:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T> {
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction("entries",mode);
    const req=action(tx.objectStore("entries"));
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
    tx.oncomplete=()=>db.close();
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
export default function PhotoJournal({userId, embedded = false, showComposer = true}:{userId:string; embedded?:boolean; showComposer?:boolean}) {
  const [entries,setEntries]=useState<PhotoEntry[]>([]);
  const [category,setCategory]=useState("My Garden");
  const [filter,setFilter]=useState("All");
  const [year,setYear]=useState("All");
  const [caption,setCaption]=useState("");
  const [plant,setPlant]=useState("");
  const [bed,setBed]=useState("");
  const [date,setDate]=useState(()=>new Date().toLocaleDateString("en-CA"));
  const [photos,setPhotos]=useState<File[]>([]);
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let active=true;
    transact<PhotoEntry[]>("readonly",store=>store.getAll()).then(all=>{
      if(active)setEntries(all.filter(e=>e.id.startsWith(userId+":")).sort((a,b)=>b.date.localeCompare(a.date)));
    }).catch(()=>{if(active)setError("Photo storage is unavailable in this browser.");});
    return ()=>{active=false;};
  },[userId,refresh]);
  const [previewUrls,setPreviewUrls]=useState<Record<string,string[]>>({});
  useEffect(()=>{
    const urls:Record<string,string[]>={};
    for(const entry of entries) urls[entry.id]=entry.photos.map(blob=>URL.createObjectURL(blob));
    let active = true;
    Promise.resolve().then(() => { if (active) setPreviewUrls(urls); });
    return ()=>{ active = false; Object.values(urls).flat().forEach(url=>URL.revokeObjectURL(url)); };
  },[entries]);
  async function save(){
    if(!photos.length)return setError("Choose at least one photo.");
    setSaving(true);setError("");
    try {
      const entry:PhotoEntry={id:userId+":"+crypto.randomUUID(),date,category,caption,plant,bed,photos:[...photos]};
      await transact("readwrite",store=>store.put(entry));
      setPhotos([]);setCaption("");setPlant("");setBed("");setRefresh(n=>n+1);
      const input=document.getElementById("garden-photo-files") as HTMLInputElement|null;
      if(input)input.value="";
    } catch {setError("Could not save photos. Check your browser storage space.");}
    finally {setSaving(false);}
  }
  async function remove(id:string){
    if(!window.confirm("Delete this photo journal entry?"))return;
    try {await transact("readwrite",store=>store.delete(id));setRefresh(n=>n+1);}
    catch {setError("Could not delete this entry.");}
  }
  const visible=entries.filter(e=>(filter==="All"||e.category===filter)&&(year==="All"||e.date.startsWith(year)));
  const years=[...new Set(entries.map(e=>e.date.slice(0,4)))].sort().reverse();
  return <section className="interior-page photo-journal-page">
    {embedded ? <div className="mb-4"><h2 className="font-serif text-2xl">Pictures</h2><p className="seasonal-muted mt-2 text-sm">Seedlings, blooms, harvests, and moments worth remembering.</p></div> : <InteriorHeader eyebrow="Your garden in pictures" title="Photo Journal" description="Keep the little moments: seedlings, blooms, harvests, and every stage in between." />}
    <p className="mb-5 rounded-xl bg-[#f1eee3] p-4 text-sm text-[#415341]">Photos are saved on this device for now, not synced to your account. Export or back up important photos separately.</p>
    {showComposer && <div className="modern-card mb-7">
      <h2 className="mb-4 font-serif text-2xl">Add a garden memory</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">Photos (select multiple)<input id="garden-photo-files" type="file" accept="image/*" multiple onChange={e=>setPhotos(Array.from(e.target.files||[]))} /></label>
        <label className="grid gap-2 text-sm">Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} /></label>
        <label className="grid gap-2 text-sm">Plant name (optional)<input value={plant} onChange={e=>setPlant(e.target.value)} placeholder="e.g. Limelight hydrangea" /></label>
        <label className="grid gap-2 text-sm">Garden bed (optional)<input value={bed} onChange={e=>setBed(e.target.value)} placeholder="e.g. Raised bed 2" /></label>
        <label className="grid gap-2 text-sm sm:col-span-2">Caption<textarea rows={2} value={caption} onChange={e=>setCaption(e.target.value)} placeholder="What happened in your garden today?" /></label>
      </div>
      <div className="mt-4 flex items-center gap-4"><button className="seasonal-button rounded-xl px-5 py-3" disabled={saving} onClick={()=>void save()}>{saving?"Saving…":`Save ${photos.length||""} photo${photos.length===1?"":"s"}`}</button>{photos.length>0&&<span className="text-sm">{photos.length} selected</span>}</div>
      {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>}
    <div className="mb-5 flex flex-wrap gap-3">
      <label className="text-sm">Category <select className="ml-2" value={filter} onChange={e=>setFilter(e.target.value)}>{["All",...categories].map(c=><option key={c}>{c}</option>)}</select></label>
      <label className="text-sm">Year <select className="ml-2" value={year} onChange={e=>setYear(e.target.value)}>{["All",...years].map(y=><option key={y}>{y}</option>)}</select></label>
    </div>
    {visible.length===0?<p className="modern-card">No pictures yet. Use Add pictures to start your garden gallery.</p>:<div className="grid gap-5 md:grid-cols-2">{visible.map(e=><article key={e.id} className="modern-card">
      <div className="mb-3 flex items-center justify-between"><strong>{e.category}</strong><span className="text-sm">{e.date}</span></div>
      <div className="grid grid-cols-2 gap-2">{(previewUrls[e.id]||[]).map((url,i)=><a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={e.caption||e.plant||"Garden journal photo"} className="h-44 w-full rounded-lg object-cover" /></a>)}</div>
      {e.caption&&<p className="mt-3">{e.caption}</p>}
      {(e.plant||e.bed)&&<p className="mt-2 text-sm text-[#53634d]">{[e.plant,e.bed].filter(Boolean).join(" · ")}</p>}
      <button className="mt-3 text-sm underline" onClick={()=>void remove(e.id)}>Delete entry</button>
    </article>)}</div>}
  </section>;
}

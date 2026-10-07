"use client";

import { useMemo, useState, type FormEvent } from "react";

export type VaultPlant = {
  id: string; name: string; variety: string; category: string;
  statuses: string[]; source: string; year: string; notes: string;
};

const statuses = ["Growing Now","Have Seeds","Have Plant","Wishlist","Previously Grown","Not Growing Again"];
const categories = ["Vegetable","Herb","Flower","Fruit & Berry","Houseplant / Indoor","Other"];
const keyFor = (userId:string) => `garden-os-plant-vault-${userId}`;

export default function PlantVault({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [plants,setPlants]=useState<VaultPlant[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(keyFor(userId)) || "[]"); } catch { return []; }
  });
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("All");
  const [adding,setAdding]=useState(false);
  const [editing,setEditing]=useState<VaultPlant|null>(null);
  function save(next:VaultPlant[]) { setPlants(next); try { localStorage.setItem(keyFor(userId),JSON.stringify(next)); } catch {} }
  function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f=new FormData(e.currentTarget);
    const name=String(f.get("name")||"").trim(); if(!name)return;
    const plant:VaultPlant={id:editing?.id||crypto.randomUUID(),name,variety:String(f.get("variety")||"").trim(),category:String(f.get("category")||"Other"),statuses:f.getAll("status").map(String),source:String(f.get("source")||"").trim(),year:String(f.get("year")||"").trim(),notes:String(f.get("notes")||"").trim()};
    save(editing?plants.map(p=>p.id===plant.id?plant:p):[plant,...plants]); setAdding(false); setEditing(null);
  }
  const shown=useMemo(()=>plants.filter(p=>{
    const matches=!query || `${p.name} ${p.variety} ${p.category} ${p.statuses.join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const status=filter==="All" || (filter==="Seeds"?p.statuses.includes("Have Seeds"):filter==="Wishlist"?p.statuses.includes("Wishlist"):filter==="Growing"?p.statuses.includes("Growing Now"):filter==="Past"?p.statuses.includes("Previously Grown"):p.category===filter);
    return matches&&status;
  }),[plants,query,filter]);
  return <section className="mt-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow seasonal-muted">Your growing collection</p><h2 className="editorial-title seasonal-heading mt-2 text-4xl">Plant Vault 🌿</h2><p className="seasonal-muted mt-2 max-w-2xl">One organized home for every plant you grow, own, remember, or want someday.</p></div>
      <div className="flex gap-2"><button onClick={()=>setAdding(true)} className="seasonal-button rounded-xl px-5 py-3 font-bold text-white">+ Add plant</button><button onClick={onClose} className="seasonal-outline rounded-xl border px-4 py-3 font-bold">Back to garden</button></div>
    </div>
    <div className="seasonal-card mt-6 rounded-3xl border p-4">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search plants, varieties, flowers, seeds…" className="seasonal-input w-full rounded-xl border p-3"/>
      <div className="mt-3 flex flex-wrap gap-2">{["All","Growing","Seeds","Wishlist","Past",...categories].map(x=><button key={x} onClick={()=>setFilter(x)} className={`rounded-full border px-3 py-2 text-xs font-bold ${filter===x?"seasonal-button text-white":"seasonal-outline"}`}>{x}</button>)}</div>
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {!shown.length && <div className="seasonal-card rounded-3xl border p-8 sm:col-span-2 lg:col-span-3"><p className="seasonal-heading text-xl font-bold">{plants.length?"Nothing matches this view yet.":"Your vault is ready for its first plant."}</p><p className="seasonal-muted mt-2">Add something you grow now, seeds you already own, an old favorite, or something on your wishlist.</p></div>}
      {shown.map(p=><article key={p.id} className="seasonal-card rounded-3xl border p-5">
        <div className="flex justify-between gap-3"><div><p className="eyebrow seasonal-muted">{p.category}</p><h3 className="seasonal-heading mt-1 text-xl font-bold">{p.name}</h3>{p.variety&&<p className="seasonal-muted text-sm">{p.variety}</p>}</div><button onClick={()=>setEditing(p)} className="seasonal-link text-sm font-bold">Edit</button></div>
        <div className="mt-4 flex flex-wrap gap-2">{p.statuses.map(s=><span key={s} className="seasonal-icon rounded-full px-3 py-1 text-xs font-semibold">{s}</span>)}</div>
        {(p.source||p.year)&&<p className="seasonal-muted mt-4 text-xs">{p.source}{p.source&&p.year?" · ":""}{p.year}</p>}
        {p.notes&&<p className="mt-3 text-sm leading-6">{p.notes}</p>}
      </article>)}
    </div>
    {(adding||editing)&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]" onMouseDown={e=>{if(e.target===e.currentTarget){setAdding(false);setEditing(null)}}}>
      <form onSubmit={submit} className="seasonal-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-6 sm:p-8">
        <div className="flex justify-between"><div><p className="eyebrow seasonal-muted">Plant Vault</p><h3 className="seasonal-heading mt-1 text-2xl font-bold">{editing?"Edit plant":"Add to your collection"}</h3></div><button type="button" onClick={()=>{setAdding(false);setEditing(null)}} className="text-2xl">×</button></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Plant name<input name="name" required defaultValue={editing?.name} placeholder="Garlic" className="seasonal-input mt-1 w-full rounded-xl border p-3"/></label>
          <label className="text-sm font-bold">Variety<input name="variety" defaultValue={editing?.variety} placeholder="Music" className="seasonal-input mt-1 w-full rounded-xl border p-3"/></label>
          <label className="text-sm font-bold">Category<select name="category" defaultValue={editing?.category||"Vegetable"} className="seasonal-input mt-1 w-full rounded-xl border p-3">{categories.map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="text-sm font-bold">Source / seller<input name="source" defaultValue={editing?.source} placeholder="Saved, nursery, seed company…" className="seasonal-input mt-1 w-full rounded-xl border p-3"/></label>
          <label className="text-sm font-bold">Year acquired<input name="year" type="number" min="1900" max="2200" defaultValue={editing?.year} className="seasonal-input mt-1 w-full rounded-xl border p-3"/></label>
        </div>
        <fieldset className="mt-5"><legend className="text-sm font-bold">What describes this plant?</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{statuses.map(s=><label key={s} className="seasonal-icon flex cursor-pointer items-center gap-2 rounded-xl p-3 text-sm"><input type="checkbox" name="status" value={s} defaultChecked={editing?.statuses.includes(s)}/>{s}</label>)}</div></fieldset>
        <label className="mt-5 block text-sm font-bold">Notes<textarea name="notes" defaultValue={editing?.notes} rows={3} placeholder="Why you like it, where it grew well, what to remember…" className="seasonal-input mt-1 w-full rounded-xl border p-3"/></label>
        <button className="seasonal-button mt-5 w-full rounded-xl py-3 font-bold text-white">Save to Plant Vault</button>
      </form>
    </div>}
  </section>;
}

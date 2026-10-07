"use client";
import { useState } from "react";
type Bed = { id:string; name:string; emoji:string; x:number;y:number;w:number;h:number; color:string; notes:string };
const initial:Bed[]=[
{id:"flowers",name:"Flowers",emoji:"🌸",x:18,y:2,w:79,h:11,color:"#b74b79",notes:"Flower border along the back."},
{id:"herbs",name:"Herbs",emoji:"🌿",x:2,y:16,w:13,h:78,color:"#397c44",notes:"Long herb border on the left."},
{id:"garlic",name:"Garlic",emoji:"🧄",x:25,y:20,w:18,h:26,color:"#639c53",notes:"After harvesting garlic: broccoli seedlings, then lettuce."},
{id:"green-peppers",name:"Green Peppers",emoji:"🫑",x:48,y:20,w:18,h:26,color:"#348c3e",notes:"Green bell peppers."},
{id:"okra",name:"Okra",emoji:"🌱",x:75,y:20,w:21,h:26,color:"#4b8640",notes:"Warm-season okra."},
{id:"tomatoes-left",name:"Tomatoes",emoji:"🍅",x:22,y:55,w:22,h:24,color:"#477f39",notes:"First tomato bed."},
{id:"tomatoes-middle",name:"Tomatoes",emoji:"🍅",x:48,y:55,w:18,h:37,color:"#477f39",notes:"Second tomato bed."},
{id:"hot-peppers-right",name:"Hot Peppers",emoji:"🌶️",x:76,y:53,w:20,h:20,color:"#447e3b",notes:"Hot peppers."},
{id:"hot-peppers-bottom",name:"Hot Peppers",emoji:"🌶️",x:70,y:79,w:28,h:16,color:"#447e3b",notes:"Second hot pepper bed."},
];
function plants(b:Bed){return Array.from({length:b.id==="flowers"?18:b.id==="herbs"?12:9},(_,i)=>({left:10+(i%5)*19,top:14+Math.floor(i/5)*29,rotation:(i*53)%45-22}));}
export default function GardenLayout({userId,gardenId,onClose}:{userId:string;gardenId:string;onClose:()=>void}){
 const storageKey=`garden-os-layout-2027-${userId}-${gardenId}`;
 const [beds,setBeds]=useState<Bed[]>(()=>{if(typeof window==="undefined")return initial;try{const saved=JSON.parse(localStorage.getItem(storageKey)||"null");return Array.isArray(saved)&&saved.length?saved:initial;}catch{return initial;}});
 const [selected,setSelected]=useState("garlic"); const [editing,setEditing]=useState(false); const [notice,setNotice]=useState("");
 const active=beds.find(b=>b.id===selected);
 function update(next:Bed[]){setBeds(next);try{localStorage.setItem(storageKey,JSON.stringify(next));setNotice("Layout saved on this browser.");}catch{setNotice("Storage unavailable; layout is only saved for this visit.");}}
 function change(field:keyof Bed,value:string){if(!active)return;update(beds.map(b=>b.id===active.id?{...b,[field]:["x","y","w","h"].includes(field)?Number(value):value}:b));}
 return <section className="mt-8">
 <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow seasonal-muted">My Garden / Layout</p><h2 className="editorial-title seasonal-heading mt-2 text-4xl">Garden Layout</h2><p className="seasonal-muted mt-2">Your 2027 garden bed arrangement, brought to life. Select a bed to explore or adjust it.</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>setEditing(!editing)} className="seasonal-outline rounded-xl border px-4 py-3 font-bold">{editing?"Done editing":"Edit layout"}</button><button onClick={onClose} className="seasonal-button rounded-xl px-4 py-3 font-bold text-white">Back to garden</button></div></div>
 <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
 <div className="overflow-hidden rounded-3xl border border-[#a58e70] bg-[#765d3b] shadow-lg">
 <div className="relative aspect-[1.08] w-full overflow-hidden" style={{background:"repeating-linear-gradient(38deg,#9b784e 0px,#9b784e 7px,#b28b5c 8px,#a78052 15px)"}}>
 {beds.map(b=><button type="button" key={b.id} onClick={()=>setSelected(b.id)} aria-label={`Select ${b.name}`} className={`absolute overflow-hidden border-[5px] text-center shadow-[2px_5px_10px_#24180f70] transition-all hover:brightness-110 ${selected===b.id?"ring-4 ring-[#f9e3a7] ring-offset-2 ring-offset-[#876944]":""}`} style={{left:`${b.x}%`,top:`${b.y}%`,width:`${b.w}%`,height:`${b.h}%`,borderColor:"#725337",borderRadius:b.id==="flowers"?"70px":b.id==="herbs"?"55px":b.id.includes("bottom")?"45px":"18px",background:`radial-gradient(circle at 45% 35%, ${b.color}, #24472c 95%)`}}>
 {plants(b).map((p,i)=><span key={i} aria-hidden="true" className="absolute select-none drop-shadow-md" style={{left:`${p.left}%`,top:`${p.top}%`,transform:`translate(-50%,-50%) rotate(${p.rotation}deg)`,fontSize:b.id==="flowers"?"clamp(12px,2vw,27px)":"clamp(14px,2.3vw,32px)"}}>{b.emoji}</span>)}
 <span className="absolute bottom-1 left-1/2 max-w-[95%] -translate-x-1/2 rounded-full bg-[#fff6e4e8] px-2 py-1 text-[clamp(9px,1.3vw,14px)] font-bold leading-tight text-[#3e3326] shadow">{b.name}</span>
 </button>)}
 </div><div className="bg-[#f4e9d6] px-4 py-3 text-xs text-[#67523a]">Illustrated overhead garden concept · Bed positions are approximate, not measured to scale</div></div>
 <aside className="seasonal-card h-fit rounded-3xl border p-5"><p className="eyebrow seasonal-muted">Bed details</p>{active?<><div className="mt-3 text-4xl">{active.emoji}</div><h3 className="seasonal-heading mt-2 text-2xl font-bold">{active.name}</h3><p className="seasonal-muted mt-3 text-sm leading-6">{active.notes}</p><p className="seasonal-muted mt-5 text-xs">2027 planting concept</p>{editing?<div className="mt-4 space-y-3"><label className="block text-sm font-semibold">Name<input value={active.name} onChange={e=>change("name",e.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-2"/></label><label className="block text-sm font-semibold">Notes<textarea value={active.notes} onChange={e=>change("notes",e.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-2" rows={3}/></label><p className="text-xs seasonal-muted">Position and size (% of map)</p>{(["x","y","w","h"] as const).map(field=><label key={field} className="flex items-center justify-between gap-3 text-sm"><span>{field.toUpperCase()}</span><input type="number" min="1" max="99" value={active[field]} onChange={e=>change(field,String(Math.max(1,Math.min(99,Number(e.target.value)))))} className="seasonal-input w-20 rounded-lg border p-2"/></label>)}</div>:<p className="mt-4 text-sm">Use <strong>Edit layout</strong> to rename a bed, change its notes, or adjust its position and size.</p>}</>:<p>Select a bed.</p>}{notice&&<p role="status" className="seasonal-muted mt-4 text-xs">{notice}</p>}<p className="seasonal-muted mt-6 border-t border-[var(--border)] pt-4 text-xs leading-5">This first version stores your layout on this device. It does not yet change your Supabase growing-space records or sync between devices.</p></aside></div></section>;
}

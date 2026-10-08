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
 <div className="overflow-hidden rounded-3xl border border-[#b49b76] bg-[#9b8465] shadow-xl">
 <div className="relative aspect-[1.08] w-full overflow-hidden" style={{background:"repeating-linear-gradient(27deg,#b69b73 0px,#b69b73 4px,#c7ac83 5px,#a78c66 11px)"}}>
 {beds.map(b=><button type="button" key={b.id} onClick={()=>setSelected(b.id)} aria-label={`Select ${b.name}`} className={`group absolute overflow-hidden border-[7px] text-center shadow-[3px_7px_14px_#2d211b80] transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-200 ${selected===b.id?"ring-4 ring-[#f7df9b] ring-offset-2 ring-offset-[#8b7758]":""}`} style={{left:`${b.x}%`,top:`${b.y}%`,width:`${b.w}%`,height:`${b.h}%`,borderColor:"#997047",borderRadius:b.id==="flowers"?"55px":b.id==="herbs"?"40px":b.id.includes("bottom")?"32px":"12px",boxShadow:"inset 0 0 0 3px #c39a66, 3px 7px 14px #2d211b80"}}>
 <GardenBedArt bed={b}/>
 <span className="absolute bottom-1 left-1/2 max-w-[95%] -translate-x-1/2 rounded-lg bg-[#fff8e9ef] px-2 py-1 text-[clamp(9px,1.2vw,13px)] font-bold leading-tight text-[#3e3326] shadow">{b.name}</span>
 </button>)}
 </div><div className="bg-[#f4e9d6] px-4 py-3 text-xs text-[#67523a]">Overhead raised-bed plan · Plant illustrations and bed sizes are approximate</div></div>
 <aside className="seasonal-card h-fit rounded-3xl border p-5"><p className="eyebrow seasonal-muted">Bed details</p>{active?<><div className="mt-3 text-4xl">{active.emoji}</div><h3 className="seasonal-heading mt-2 text-2xl font-bold">{active.name}</h3><p className="seasonal-muted mt-3 text-sm leading-6">{active.notes}</p><p className="seasonal-muted mt-5 text-xs">2027 planting concept</p>{editing?<div className="mt-4 space-y-3"><label className="block text-sm font-semibold">Name<input value={active.name} onChange={e=>change("name",e.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-2"/></label><label className="block text-sm font-semibold">Notes<textarea value={active.notes} onChange={e=>change("notes",e.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-2" rows={3}/></label><p className="text-xs seasonal-muted">Position and size (% of map)</p>{(["x","y","w","h"] as const).map(field=><label key={field} className="flex items-center justify-between gap-3 text-sm"><span>{field.toUpperCase()}</span><input type="number" min="1" max="99" value={active[field]} onChange={e=>change(field,String(Math.max(1,Math.min(99,Number(e.target.value)))))} className="seasonal-input w-20 rounded-lg border p-2"/></label>)}</div>:<p className="mt-4 text-sm">Use <strong>Edit layout</strong> to rename a bed, change its notes, or adjust its position and size.</p>}</>:<p>Select a bed.</p>}{notice&&<p role="status" className="seasonal-muted mt-4 text-xs">{notice}</p>}<p className="seasonal-muted mt-6 border-t border-[var(--border)] pt-4 text-xs leading-5">This first version stores your layout on this device. It does not yet change your Supabase growing-space records or sync between devices.</p></aside></div></section>;
}

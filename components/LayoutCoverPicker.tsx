"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { prepareLayoutPhoto } from "@/lib/photo-layout-image";
import { validLayoutCover } from "@/lib/layout-cover";

export default function LayoutCoverPicker({value,onChange,onBusyChange}:{value?:string;onChange:(image:string|undefined)=>void;onBusyChange?:(busy:boolean)=>void}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  const input=useRef<HTMLInputElement>(null);
  const request=useRef(0);
  async function choose(file?:File) {
    if(!file)return;
    const version=++request.current;
    setBusy(true);onBusyChange?.(true);setError("");
    try { const prepared=await prepareLayoutPhoto(file); if(version===request.current)onChange(prepared.reference); }
    catch(err){if(version===request.current)setError(err instanceof Error?err.message:"Could not prepare this picture.");}
    finally {if(version===request.current){setBusy(false);onBusyChange?.(false);}if(input.current)input.current.value="";}
  }
  return <div className="layout-cover-picker">
    <h3 className="font-serif text-xl">Garden picture</h3>
    <p className="seasonal-muted mt-2 text-sm">Optional · Use a photo of your garden as this layout’s cover.</p>
    {validLayoutCover(value)&&<Image src={value} alt="Your garden cover" width={600} height={400} unoptimized className="layout-cover-preview"/>}
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="Garden cover photo" onChange={e=>void choose(e.target.files?.[0])}/>
    <div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={()=>input.current?.click()} className="seasonal-outline min-h-11 rounded-xl border px-4 py-2">{busy?"Preparing picture…":value?"Change garden picture":"Upload garden picture"}</button>{value&&<button type="button" disabled={busy} className="seasonal-link min-h-11 px-3 underline" onClick={()=>onChange(undefined)}>Remove picture</button>}</div>
    <p className="seasonal-muted mt-2 text-xs">Shown on your saved layout card. This picture is not analyzed or used to create a plan.</p>
    {error&&<p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
  </div>;
}

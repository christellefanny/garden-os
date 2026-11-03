"use client";
import {useState} from "react";
import Image from "next/image";
import PhotoJournal from "@/components/PhotoJournal";

export default function GardenVisionBoard({userId}:{userId:string}) {
  const [adding,setAdding]=useState(false);
  return <section className="interior-page vision-board-page">
    <header className="vision-hero">
      <div className="vision-hero-copy"><p className="modern-eyebrow">Gather the things that inspire you</p><h1>Your garden, still dreaming.</h1><p>A color you love. A little patio corner. A garden you can’t stop thinking about. Keep it all here, and watch your vision take shape.</p><button type="button" className="seasonal-button rounded-xl px-5 py-3" onClick={()=>setAdding(true)}>+ Add inspiration</button></div>
      <div className="vision-hero-art" aria-hidden="true"><Image src="/layout-inspiration/courtyard-open-entry.webp" fill sizes="(max-width:700px) 100vw, 480px" alt="" priority/><span>A little room for possibility</span></div>
    </header>
    <div className="vision-intro"><div><p className="modern-eyebrow">Your garden vision board</p><h2>Ideas worth keeping</h2></div><p>Save pictures and screenshots, gather them into collections, and leave a note about what you’d love to try.</p></div>
    <PhotoJournal key={userId} userId={userId} embedded collection="inspiration" showComposer={adding} onCloseComposer={()=>setAdding(false)}/>
  </section>;
}

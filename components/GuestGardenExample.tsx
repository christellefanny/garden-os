"use client";

import Image from "next/image";
import { useState } from "react";
import {layoutTemplates} from "@/lib/layout-design";

const beds = [
  { name: "Climbing tomatoes", label: "Tomatoes", x: 34, y: 30, description: "A dedicated bed gives taller plants a place of their own. Add supports in your plan and leave room to reach the harvest." },
  { name: "A tapestry of greens", label: "Leafy greens", x: 72, y: 30, description: "Group leafy crops in an easy-to-reach bed. Your own plan can record varieties and leave space for later plantings." },
  { name: "Roots & little harvests", label: "Root crops", x: 34, y: 65, description: "A separate bed makes it easy to picture rows of carrots and radishes, keep planting notes, and follow each growing space through the season." },
  { name: "A summer picking bed", label: "Peppers & beans", x: 72, y: 65, description: "Give peppers and bush beans their own growing space. Choose the plants and spacing that suit your location, light, and available room." },
];

export default function GuestGardenExample({ onCreate,onEdit }: { onCreate: () => void;onEdit:(templateId:string)=>void }) {
  const [selected, setSelected] = useState(0);
  const [inspiration,setInspiration]=useState(0);
  const template=layoutTemplates[inspiration];
  const exampleBeds=inspiration===0?beds:template.items.filter(i=>i.kind==="Bed").map((item,index)=>({name:item.name,label:item.name,x:inspiration===1?(index===0?32:70):(index%2===0?28:72),y:inspiration===1?47:(index<2?30:65),description:`${item.name} is one starting point in this plan. Move or resize this bed and choose your own decorative plants in the editor. ${template.description}`}));
  const bed = exampleBeds[selected]??exampleBeds[0];
  return (
    <section className="modern-card guest-garden-example" aria-labelledby="guest-example-title">
      <div className="guest-example-heading">
        <div><p className="guest-example-eyebrow">My Garden Layout · Example plan</p><h2 id="guest-example-title">Imagine your dream garden</h2></div>
        <span className="guest-example-badge">{exampleBeds.length} raised beds</span>
      </div>
      <p className="guest-example-intro">A place for fresh vegetables, fragrant herbs, and a few flowers. Explore the beds, then make room for your own ideas.</p>
      <div className="layout-inspiration-tabs" aria-label="Garden inspiration layouts">{layoutTemplates.map((idea,index)=><button type="button" key={idea.id} aria-pressed={inspiration===index} onClick={()=>{setInspiration(index);setSelected(0);}}>{idea.name}</button>)}</div>
      <div className="guest-example-art">
        <button type="button" className="guest-example-edit-art" aria-label={`Edit example ${template.name.toLowerCase()}`} onClick={()=>onEdit(template.id)}><Image src={template.image} alt={`Watercolor concept of ${template.name.toLowerCase()}, with beds and walking paths.`} width={1200} height={800} sizes="(max-width: 800px) 100vw, 60vw" /></button>
        {exampleBeds.map((item, index) => <button type="button" key={item.name} style={{ left: `${item.x}%`, top: `${item.y}%` }} aria-label={`Explore example bed ${index + 1}: ${item.label}`} aria-pressed={selected === index} aria-controls="guest-example-detail" onClick={() => setSelected(index)}>{index + 1}</button>)}
      </div>
      <div className="guest-example-bed-list" aria-label="Explore the example beds">
        {exampleBeds.map((item, index) => <button type="button" key={item.name} aria-pressed={selected === index} aria-controls="guest-example-detail" onClick={() => setSelected(index)}><span>{index + 1}</span>{item.label}</button>)}
      </div>
      <div className="guest-example-detail" id="guest-example-detail" aria-live="polite" aria-atomic="true"><h3>{bed.name}</h3><p>{bed.description}</p></div>
      <div className="guest-example-design-notes"><span>Room to move between beds</span><span>{inspiration===2?"Flowers for cutting":"Herbs in terracotta pots"}</span><span>Flowers for a finishing touch</span></div>
      <div className="guest-example-footer"><p>Choose one of three editable starting points or begin with a blank canvas. These illustrations are inspiration, not measured planting plans.</p><div className="guest-example-actions"><button type="button" className="seasonal-button" onClick={()=>onEdit(template.id)}>Edit this layout →</button><button type="button" className="seasonal-button" onClick={onCreate}>Open Plan &amp; Design <span aria-hidden="true">→</span></button></div></div>
    </section>
  );
}

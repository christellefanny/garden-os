"use client";

import Image from "next/image";
import { useState } from "react";

const beds = [
  { name: "Climbing tomatoes", label: "Tomatoes", x: 34, y: 30, description: "A dedicated bed gives taller plants a place of their own. Add supports in your plan and leave room to reach the harvest." },
  { name: "A tapestry of greens", label: "Leafy greens", x: 72, y: 30, description: "Group leafy crops in an easy-to-reach bed. Your own plan can record varieties and leave space for later plantings." },
  { name: "Roots & little harvests", label: "Root crops", x: 34, y: 65, description: "A separate bed makes it easy to picture rows of carrots and radishes, keep planting notes, and follow each growing space through the season." },
  { name: "A summer picking bed", label: "Peppers & beans", x: 72, y: 65, description: "Give peppers and bush beans their own growing space. Choose the plants and spacing that suit your location, light, and available room." },
];

export default function GuestGardenExample({ onCreate }: { onCreate: () => void }) {
  const [selected, setSelected] = useState(0);
  const bed = beds[selected];
  return (
    <section className="modern-card guest-garden-example" aria-labelledby="guest-example-title">
      <div className="guest-example-heading">
        <div><p className="guest-example-eyebrow">A little inspiration · Example plan</p><h2 id="guest-example-title">Imagine your dream garden</h2></div>
        <span className="guest-example-badge">4 raised beds</span>
      </div>
      <p className="guest-example-intro">A place for fresh vegetables, fragrant herbs, and a few flowers. Explore the beds, then make room for your own ideas.</p>
      <div className="guest-example-art">
        <Image src="/conservatory/vegetable-garden-example.webp" alt="Watercolor overhead concept of four vegetable beds around gravel paths, with flowers and terracotta herb pots." width={1200} height={800} sizes="(max-width: 800px) 100vw, 60vw" />
        {beds.map((item, index) => <button type="button" key={item.name} style={{ left: `${item.x}%`, top: `${item.y}%` }} aria-label={`Explore example bed ${index + 1}: ${item.label}`} aria-pressed={selected === index} aria-controls="guest-example-detail" onClick={() => setSelected(index)}>{index + 1}</button>)}
      </div>
      <div className="guest-example-bed-list" aria-label="Explore the example beds">
        {beds.map((item, index) => <button type="button" key={item.name} aria-pressed={selected === index} aria-controls="guest-example-detail" onClick={() => setSelected(index)}><span>{index + 1}</span>{item.label}</button>)}
      </div>
      <div className="guest-example-detail" id="guest-example-detail" aria-live="polite" aria-atomic="true"><h3>{bed.name}</h3><p>{bed.description}</p></div>
      <div className="guest-example-design-notes"><span>Room to move between beds</span><span>Herbs in terracotta pots</span><span>Flowers for a finishing touch</span></div>
      <div className="guest-example-footer"><p>Illustrated inspiration, not a saved garden or a measured planting plan. Adapt crops and spacing to your site.</p><button type="button" className="seasonal-button" onClick={onCreate}>Design your own garden <span aria-hidden="true">→</span></button></div>
    </section>
  );
}

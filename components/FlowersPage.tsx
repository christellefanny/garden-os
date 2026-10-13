"use client";

import { useMemo } from "react";
import InteriorHeader from "@/components/InteriorHeader";
import PlantPortrait from "@/components/PlantPortrait";
import { useSeason } from "@/components/seasonal/SeasonProvider";
import type { VaultPlant } from "@/components/PlantVault";

const guides = [
  { name:"Dianthus", light:"Full sun", care:"Water at soil level and remove faded flowers. Keep crowns above wet soil; trim lightly after the main flush.", bloom:"Spring into summer" },
  { name:"Hydrangea", light:"Morning sun / afternoon shade", care:"Water deeply during dry spells. Pruning depends on the variety: Limelight blooms on new wood; many bigleaf types bloom on old wood.", bloom:"Summer to fall" },
  { name:"Zinnia", light:"Full sun", care:"Sow after frost, space for airflow, and cut flowers regularly. Avoid overhead watering to limit powdery mildew.", bloom:"Summer to frost" },
  { name:"Cosmos", light:"Full sun", care:"Sow after frost. Avoid rich fertilizer; deadhead for more blooms and leave a few seedheads to collect.", bloom:"Summer to frost" },
  { name:"Marigold", light:"Full sun", care:"Plant after frost and deadhead regularly. Water the roots rather than the foliage.", bloom:"Summer to frost" },
  { name:"Calendula", light:"Sun to part shade", care:"Enjoy in cool weather; remove spent blooms. Heat may slow flowering, but plants can rebound in fall.", bloom:"Spring and fall" },
  { name:"Ranunculus", light:"Full sun in cool weather", care:"Grow for cool spring flowers. Protect corms from prolonged freezing and wet winter soil in cold climates.", bloom:"Spring" },
  { name:"Japanese Anemone", light:"Part shade", care:"Keep evenly moist while establishing and mulch lightly. Allow space: established plants can spread.", bloom:"Late summer to fall" },
  { name:"Astilbe", light:"Part shade", care:"Keep soil consistently moist; dry conditions scorch foliage and reduce flowers.", bloom:"Summer" },
  { name:"Catmint", light:"Full sun", care:"Shear back after the first flowering for tidy foliage and a possible second flush.", bloom:"Late spring to summer" },
  { name:"Tulip", light:"Full sun in spring", care:"Plant bulbs in fall in well-drained soil. Leave leaves until they yellow naturally.", bloom:"Spring" },
  { name:"Allium", light:"Full sun", care:"Plant bulbs in fall with good drainage. Leave flowerheads standing for structure or cut once dry.", bloom:"Late spring to early summer" },
];
const seasonal: Record<string,{title:string;tasks:string[]}> = {
  spring:{title:"Wake up the flower garden",tasks:["Remove winter debris gradually, checking for emerging perennials.","Plant cool-season flowers and prepare beds for annuals after frost danger passes.","Divide suitable established perennials before hot weather."]},
  summer:{title:"Keep the color coming",tasks:["Deadhead zinnias, cosmos, dianthus, and marigolds for more blooms.","Water deeply in the morning and keep leaves dry where possible.","Leave some flowers for bees and butterflies; avoid spraying open blooms."]},
  fall:{title:"Prepare for next spring",tasks:["Plant tulip and ornamental allium bulbs after soil cools.","Collect dry zinnia and cosmos seeds and label them.","Leave some sturdy stems and seedheads for winter habitat; mulch tender plants after soil cools."]},
  winter:{title:"Let the garden rest",tasks:["Avoid cutting back all perennial stems; some shelter overwintering insects.","Check stored bulbs and corms for rot or drying.","Plan spring color, order seeds, and protect pots from freeze–thaw damage."]},
};
export default function FlowersPage({plants}:{plants:VaultPlant[]}) {
  const {season}=useSeason();
  const current=seasonal[season] || seasonal.fall;
  const flowers=useMemo(()=>plants.filter(p=>p.category==="Flower").sort((a,b)=>a.name.localeCompare(b.name)),[plants]);
  return <section className="interior-page">
    <InteriorHeader title="Flower Garden" eyebrow="Bloom & flourish" description="Seasonal flower care, beautiful borders, and practical growing advice for your garden." />
    <div className="seasonal-card rounded-2xl border p-6 sm:p-8">
      <p className="eyebrow seasonal-muted">This season · {season}</p>
      <h2 className="seasonal-heading mt-2 text-2xl font-bold">{current.title}</h2>
      <ul className="mt-4 grid gap-3">{current.tasks.map(t=><li key={t} className="text-sm leading-6">✿ {t}</li>)}</ul>
    </div>
    <h2 className="seasonal-heading mt-8 text-2xl font-bold">Your flowers</h2>
    <p className="seasonal-muted mt-2 text-sm">Flower entries from your Plant Vault. Manage them in Plant Vault; this page does not create duplicate records.</p>
    {flowers.length ? <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{flowers.map(p=><article key={p.id} className="seasonal-card rounded-2xl border p-4"><PlantPortrait name={p.name} variety={p.variety} photoUrl={p.photoUrl}/><h3 className="seasonal-heading mt-3 text-lg font-bold">{p.name}</h3>{p.variety&&<p className="seasonal-muted text-sm">{p.variety}</p>}{p.notes&&<p className="mt-2 text-sm leading-6">{p.notes}</p>}</article>)}</div> : <p className="seasonal-muted mt-4 text-sm">No flowers in your vault yet. Add them under Plant Vault with category Flower.</p>}
    <h2 className="seasonal-heading mt-9 text-2xl font-bold">Flower care library</h2>
    <p className="seasonal-muted mt-2 text-sm">General guidance; adjust watering and winter protection to your site and variety.</p>
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{guides.map(g=><article key={g.name} className="seasonal-card rounded-2xl border p-5"><h3 className="seasonal-heading text-xl font-bold">{g.name}</h3><p className="seasonal-muted mt-2 text-xs font-semibold">{g.light} · {g.bloom}</p><p className="mt-3 text-sm leading-6">{g.care}</p></article>)}</div>
  </section>;
}

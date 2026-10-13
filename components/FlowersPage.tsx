"use client";

import { useMemo, useState } from "react";
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
const planting = [
  {season:"Spring",title:"Cool-season color",flowers:"Pansies, violas, calendula, snapdragons, sweet alyssum",timing:"Plant hardy transplants in early spring when soil is workable. Start warm-season annuals indoors according to seed packet timing; wait until frost risk passes before planting them outside."},
  {season:"Summer",title:"Heat-loving blooms",flowers:"Zinnias, cosmos, marigolds, sunflowers",timing:"Sow or transplant after the last spring frost when soil is warm. Succession-sow fast-growing annuals through early summer for continued flowers."},
  {season:"Fall",title:"Plant next spring's bulbs",flowers:"Tulips, ornamental alliums, daffodils; cool-weather pansies",timing:"Plant spring-flowering bulbs once soil cools, before it freezes. In cold climates, fall-planted annuals may not overwinter."},
  {season:"Winter",title:"Plan and start indoors",flowers:"Lisianthus and other long-season flowers; hardy annuals for later transplant",timing:"Order seeds, check germination requirements and start only varieties that need a long lead time. Most outdoor planting waits until spring."},
];
const seedGuides = [
  {name:"Zinnia",when:"Late summer to fall, once flower heads are fully brown and dry",how:"Leave several blooms on the plant until dry. Break apart the seed head, separate mature seeds, and dry thoroughly before storing."},
  {name:"Cosmos",when:"Summer to fall, when the narrow seeds turn brown or black",how:"Collect dry, elongated seeds from spent flower heads before they scatter. Dry and label by variety."},
  {name:"Marigold",when:"Late summer to fall, when flower heads are papery and dry",how:"Pull apart the dry head to find slender, dark-and-pale seeds. Air-dry before storing."},
  {name:"Calendula",when:"Late spring through fall, when curved seeds turn tan or brown",how:"Pick mature, dry seed heads and separate the curved seeds. Save in a labeled paper envelope."},
  {name:"Nasturtium",when:"Summer to fall, when fallen seeds have matured and dried",how:"Collect the large, wrinkled seeds as they drop or loosen. Dry completely in a ventilated place before storing."},
  {name:"Dianthus",when:"After flowering, when seed capsules are dry and opening",how:"Shake ripe capsules into a paper bag. Named hybrids may not grow true to type from seed."},
];
type FlowerSection = "Overview" | "My flowers" | "Seasonal planting" | "Seed saving" | "Flower care";
export default function FlowersPage({plants}:{plants:VaultPlant[]}) {
  const [section,setSection]=useState<FlowerSection>("Overview");
  const {season}=useSeason();
  const current=seasonal[season] || seasonal.fall;
  const flowers=useMemo(()=>plants.filter(p=>p.category==="Flower").sort((a,b)=>a.name.localeCompare(b.name)),[plants]);
  return <section className="interior-page">
    <InteriorHeader title="Flower Garden" eyebrow="Bloom & flourish" description={section==="Overview"?"A home for your flowers, planting plans, and seasonal inspiration.":section} />
    {section!=="Overview"&&<button type="button" onClick={()=>setSection("Overview")} className="seasonal-outline mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold">← Back to Flower Garden</button>}
    {section==="Overview"&&<>
      <div
        className="relative mt-7 min-h-[340px] overflow-hidden rounded-2xl border bg-[#f8f5ee] sm:min-h-[365px]"
        style={{
          backgroundImage: `url(/flower-garden-${season === "spring" || season === "summer" || season === "fall" || season === "winter" ? season : "fall"}.webp)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 max-w-[48%] p-7 sm:p-10 max-sm:max-w-[62%]">
          <p className="eyebrow text-[#18332b]">Welcome to your flower garden</p>
          <h2 className="seasonal-heading mt-3 text-3xl font-bold text-[#18332b]">Grow something beautiful.</h2>
          <p className="mt-3 text-sm leading-7 text-[#32483c]">Explore your collection, discover what to plant throughout the year, save seeds for next season, and learn how to care for every bloom. Choose a section below to open it.</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {([{label:"My flowers",detail:`${flowers.length} flowers in your collection`,action:"Explore your flower varieties"}, {label:"Seasonal planting",detail:"What to plant in each season",action:"Explore seasonal planting"}, {label:"Seed saving",detail:"What to collect, when, and how",action:"Explore seed saving"}, {label:"Flower care",detail:"Practical tips for healthier blooms",action:"Explore care guides"}] as {label:FlowerSection;detail:string;action:string}[]).map(card=><button key={card.label} type="button" onClick={()=>setSection(card.label)} className="seasonal-card rounded-2xl border p-6 text-left transition-transform hover:-translate-y-0.5"><h3 className="seasonal-heading text-xl font-bold">{card.label}</h3><p className="seasonal-muted mt-2 text-sm">{card.detail}</p><span className="mt-4 inline-block text-sm font-semibold">{card.action} →</span></button>)}
      </div>
    </>}
    {section==="My flowers"&&<>
      <h2 className="seasonal-heading mt-8 text-2xl font-bold">My flowers <span className="seasonal-muted text-base">({flowers.length})</span></h2>
      <p className="seasonal-muted mt-2 text-sm">Your flowers from Plant Vault, in alphabetical order. Add, edit, or remove flowers in Plant Vault; this view stays in sync.</p>
      {flowers.length?<div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{flowers.map(p=><article key={p.id} className="seasonal-card rounded-2xl border p-4"><PlantPortrait name={p.name} variety={p.variety} photoUrl={p.photoUrl}/><h3 className="seasonal-heading mt-3 text-lg font-bold">{p.name}</h3>{p.variety&&<p className="seasonal-muted text-sm">{p.variety}</p>}{p.notes&&<p className="mt-2 text-sm leading-6">{p.notes}</p>}</article>)}</div>:<p className="seasonal-muted mt-5 text-sm">No flowers yet. Add your first flower in Plant Vault and select the Flower category.</p>}
    </>}
    {section==="Seasonal planting"&&<>
      <div className="seasonal-card mt-7 rounded-2xl border p-6">
        <p className="eyebrow seasonal-muted">Right now · {season}</p>
        <h2 className="seasonal-heading mt-2 text-2xl font-bold">{current.title}</h2>
        <ul className="mt-4 grid gap-3">{current.tasks.map(t=><li key={t} className="text-sm leading-6">✿ {t}</li>)}</ul>
      </div>
      <h2 className="seasonal-heading mt-8 text-2xl font-bold">What to plant each season</h2>
      <p className="seasonal-muted mt-2 text-sm">General guidance for cold-winter gardens around northern Illinois. Always check your local frost dates and each variety’s requirements.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{planting.map(p=><article key={p.season} className="seasonal-card rounded-2xl border p-5"><p className="eyebrow seasonal-muted">{p.season}</p><h3 className="seasonal-heading mt-2 text-xl font-bold">{p.title}</h3><p className="mt-3 text-sm font-semibold">{p.flowers}</p><p className="mt-3 text-sm leading-6">{p.timing}</p></article>)}</div>
    </>}
    {section==="Seed saving"&&<>
      <h2 className="seasonal-heading mt-8 text-2xl font-bold">What seeds to save, and when</h2>
      <p className="seasonal-muted mt-2 text-sm">Collect seed from healthy, fully mature, dry flower heads on a dry day. Store completely dry seeds in labeled envelopes in a cool, dark, dry place. Hybrids may not grow true to the parent.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{seedGuides.map(g=><article key={g.name} className="seasonal-card rounded-2xl border p-5"><h3 className="seasonal-heading text-xl font-bold">{g.name}</h3><p className="seasonal-muted mt-3 text-xs font-semibold">WHEN TO COLLECT</p><p className="mt-1 text-sm leading-6">{g.when}</p><p className="seasonal-muted mt-3 text-xs font-semibold">HOW TO SAVE</p><p className="mt-1 text-sm leading-6">{g.how}</p></article>)}</div>
    </>}
    {section==="Flower care"&&<>
      <h2 className="seasonal-heading mt-8 text-2xl font-bold">Flower care library</h2>
      <p className="seasonal-muted mt-2 text-sm">Growing tips for flowers in your garden. Adjust watering, pruning, and winter protection to your specific variety and site.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{guides.map(g=><article key={g.name} className="seasonal-card rounded-2xl border p-5"><h3 className="seasonal-heading text-xl font-bold">{g.name}</h3><p className="seasonal-muted mt-2 text-xs font-semibold">{g.light} · {g.bloom}</p><p className="mt-3 text-sm leading-6">{g.care}</p></article>)}</div>
    </>}
  </section>;
}

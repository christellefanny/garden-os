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
type FlowerSection = "Overview" | "My flowers" | "Seasonal planting" | "Seed saving" | "Flower care" | "Cut Flowers";
export default function FlowersPage({plants}:{plants:VaultPlant[]}) {
  const [section,setSection]=useState<FlowerSection>("Overview");
  const {season}=useSeason();
  const current=seasonal[season] || seasonal.fall;
  const flowers=useMemo(()=>plants.filter(p=>p.category==="Flower").sort((a,b)=>a.name.localeCompare(b.name)),[plants]);
  return <section className="interior-page">
    {section!=="Overview"&&<InteriorHeader title="Flower Garden" eyebrow="Bloom & flourish" description={section} />}
    {section!=="Overview"&&<button type="button" onClick={()=>setSection("Overview")} className="seasonal-outline mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold">← Back to Flower Garden</button>}
    {section==="Overview"&&<>
      <div className="relative isolate min-h-[310px] overflow-hidden rounded-2xl border border-[#8c988a] bg-[#17291f] sm:min-h-[360px] lg:min-h-[400px]">
        {/* The seasonal artwork is retained; the original embedded banner lettering is
            covered by the left-side green panel to make room for the page heading. */}
        <img
          src={`/flower-botanical-${season}.webp`}
          alt={`${season} botanical flower garden illustration`}
          onError={(event) => {
            const image = event.currentTarget;
            const fallback = season === "spring"
              ? "/wide_landscape_photorealistic_spring_garden_bann.png"
              : `/approved-flower-${season}.webp`;
            if (!image.src.endsWith(fallback)) image.src = fallback;
          }}
          className="absolute inset-0 h-full w-full object-cover object-[65%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#17291f] via-[#17291f] via-[38%] to-[#17291f]/0 sm:via-[#17291f]/95 sm:via-[34%] sm:to-transparent" />
        <div className="relative z-10 flex min-h-[310px] flex-col justify-center px-6 py-10 text-[#faf8ef] sm:min-h-[360px] sm:px-10 lg:min-h-[400px] lg:px-14">
          <div className="max-w-[520px]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#faf8ef]">Bloom &amp; Flourish</p>
            <h1 className="mt-4 font-serif text-[clamp(2.7rem,5vw,5.5rem)] leading-[1.04] tracking-[-0.03em] text-[#faf8ef]">Flower Garden</h1>
            <p className="mt-5 max-w-[390px] text-base leading-7 text-[#faf8ef]/95 sm:text-lg">A home for your flowers, planting plans, and seasonal inspiration.</p>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {([{label:"My flowers",detail:`${flowers.length} flowers in your collection`,action:"Explore your flower varieties"}, {label:"Seasonal planting",detail:"What to plant in each season",action:"Explore seasonal planting"}, {label:"Seed saving",detail:"What to collect, when, and how",action:"Explore seed saving"}, {label:"Flower care",detail:"Practical tips for healthier blooms",action:"Explore care guides"}, {label:"Cut Flowers",detail:"Discover bouquet flowers, including varieties beyond your Plant Vault",action:"Explore cut flowers"}] as {label:FlowerSection;detail:string;action:string}[]).map(card=><button key={card.label} type="button" onClick={()=>setSection(card.label)} className="seasonal-card rounded-2xl border p-6 text-left transition-transform hover:-translate-y-0.5"><h3 className="seasonal-heading text-xl font-bold">{card.label}</h3><p className="seasonal-muted mt-2 text-sm">{card.detail}</p><span className="mt-4 inline-block text-sm font-semibold">{card.action} →</span></button>)}
      </div>
    </>}
    {section==="Cut Flowers"&&<>
      <div className="seasonal-card mt-7 rounded-2xl border p-6 sm:p-8">
        <p className="eyebrow seasonal-muted">From garden to vase</p>
        <h2 className="seasonal-heading mt-2 text-3xl font-bold">Grow your own bouquets</h2>
        <p className="seasonal-muted mt-3 max-w-2xl text-sm leading-7">Discover excellent cutting flowers whether or not you already grow them. Plan a cutting garden, harvest at the right stage, and arrange long-lasting bouquets with stems from your own beds and pots.</p>
      </div>
      <h2 className="seasonal-heading mt-8 text-2xl font-bold">Best flowers for cutting — even if they are not in your Plant Vault</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          {name:"Zinnias",when:"Summer to frost",tip:"Cut when stems are firm and do not wobble just below the bloom. Great colorful focal flowers."},
          {name:"Cosmos",when:"Summer to frost",tip:"Harvest when buds are just opening. Their airy stems make bouquets feel light and natural."},
          {name:"Dahlias",when:"Midsummer to frost",tip:"Cut blooms fully or nearly open; buds generally will not open much after cutting. Tubers need winter protection in northern Illinois."},
          {name:"Snapdragons",when:"Late spring and fall",tip:"Cut when the lower third of florets are open. Excellent vertical accent; grow tall cutting varieties."},
          {name:"Sunflowers",when:"Summer to early fall",tip:"Cut as petals begin lifting off the face. Choose pollenless varieties for cleaner indoor arrangements."},
          {name:"Hydrangeas",when:"Summer to fall",tip:"Cut mature, firm blooms and hydrate promptly. Limelight panicles also dry beautifully."},
          {name:"Ranunculus",when:"Cool spring",tip:"Cut when buds feel soft and show color, before fully opening. Protect corms from hard freezes."},
          {name:"Celosia",when:"Summer to frost",tip:"Harvest fully formed plumes or crests. Also excellent for drying."},
          {name:"Lisianthus",when:"Summer",tip:"Long-lasting, rose-like blooms. Start very early indoors or buy plugs; harvest when one or more flowers are open."},
          {name:"Sweet peas",when:"Late spring to early summer",tip:"Fragrant climbing flowers for cool weather. Cut frequently and provide a trellis."},
          {name:"Statice",when:"Summer",tip:"Papery clusters add texture to fresh bouquets and dry beautifully. Start indoors before the last frost."},
          {name:"Gomphrena",when:"Summer to frost",tip:"Heat-loving, colorful globe blooms. Cut when heads are fully colored; also great dried."},
          {name:"Basil (flowering stems)",when:"Summer",tip:"Aromatic bouquet greenery. Harvest firm stems and remove leaves below the waterline."}
        ].map(g=><article key={g.name} className="seasonal-card rounded-2xl border p-5"><h3 className="seasonal-heading text-xl font-bold">{g.name}</h3><p className="seasonal-muted mt-2 text-xs font-semibold">{g.when}</p><p className="mt-3 text-sm leading-6">{g.tip}</p></article>)}
      </div>
      <h2 className="seasonal-heading mt-9 text-2xl font-bold">Harvesting and vase care</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          {title:"1 · Harvest at the right time",body:"Cut during the cool morning or evening. Use clean, sharp snips and choose the correct opening stage for each flower."},
          {title:"2 · Hydrate right away",body:"Place stems promptly in a clean bucket of water in a cool, shaded spot. Remove foliage that would sit below the waterline."},
          {title:"3 · Arrange with balance",body:"Combine focal blooms (zinnia or dahlia), airy fillers (cosmos), and greenery. Vary heights and keep the vase proportional."},
          {title:"4 · Keep bouquets fresh",body:"Use a clean vase and flower food according to directions. Refresh water, recut stems as needed, and keep arrangements out of direct sun and away from ripening fruit."}
        ].map(g=><article key={g.title} className="seasonal-card rounded-2xl border p-5"><h3 className="seasonal-heading text-lg font-bold">{g.title}</h3><p className="mt-3 text-sm leading-6">{g.body}</p></article>)}
      </div>
      <div className="seasonal-card mt-7 rounded-2xl border p-6">
        <h2 className="seasonal-heading text-xl font-bold">A simple bouquet recipe</h2>
        <p className="mt-3 text-sm leading-7">Try 3–5 zinnias as focal flowers, 3–5 cosmos stems for movement, and 3 stems of greenery or ornamental foliage. Arrange loosely and turn the vase as you work.</p>
        <p className="seasonal-muted mt-3 text-sm">For northern Illinois: sow warm-season annuals after frost risk passes, and make small successive sowings to keep fresh stems coming through summer.</p>
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

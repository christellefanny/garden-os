"use client";

import Image from "next/image";
import FlowerGardenPortrait from "@/components/FlowerGardenPortrait";
import { SeasonalFlowerPlanning, FlowerSeedSaving, FlowerCareLibrary } from "@/components/FlowerGuideSections";
import { cornerCareGuides, cornerSeasons, cornerPlanting, cornerSeedGuides, cornerCutFlowers } from "@/lib/flower-corner-editorial";

// Deliberately account-independent: do not add personal photos, vault records or upload controls.
function EditorialNote() {
  return <aside className="learning-note"><strong>Garden Atelier’s illustrated field notes</strong><p>Adapted from the existing Blooms guides. These are general editorial summaries, not a personalized planting calendar. Match the species and cultivar, local frost risk, soil conditions and supplier’s instructions. Use the Library’s sourced profiles for more detailed growing guidance.</p></aside>;
}

function GuidanceSource({ href, title }: { href: string; title: string }) {
  return <footer className="learning-sources mt-6"><p>Further reading · General technique guidance checked November 2, 2026. Individual inspiration entries are not full researched growing profiles.</p><a href={href} target="_blank" rel="noopener noreferrer">{title} ↗</a></footer>;
}

export function CornerPlanting({ season = "spring" }: { season?: string }) {
  const selected = Object.hasOwn(cornerSeasons, season) ? season : "spring";
  return <><SeasonalFlowerPlanning season={selected} current={cornerSeasons[selected]} planting={cornerPlanting}/><GuidanceSource href="https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/starting-seeds-indoors" title="University of Minnesota Extension · Starting seeds indoors"/></>;
}

export function CornerCare() {
  return <><EditorialNote/><FlowerCareLibrary guides={cornerCareGuides}/><GuidanceSource href="https://extension.illinois.edu/flowers/caring-annuals" title="University of Illinois Extension · Caring for annuals"/></>;
}

export function CornerSeedSaving() {
  return <><FlowerSeedSaving guides={cornerSeedGuides}/><aside className="learning-note"><strong>Plan next season, not an exact copy.</strong><p>Saved seed from hybrids and cross-pollinated plants may differ from the parent. Record the plant name and collection year; keep seed dry and check each species’ storage and germination needs before sowing. Named cultivars may need division or other vegetative propagation to stay true to type.</p></aside><GuidanceSource href="https://yardandgarden.extension.iastate.edu/how-to/how-harvest-and-store-seeds" title="Iowa State University Extension · How to harvest and store seeds"/><p className="learning-sources"><a href="https://extension.illinois.edu/blogs/flowers-fruits-and-frass/2023-09-01-cherish-favorite-flowers-and-challenge-your-green-thumb" target="_blank" rel="noopener noreferrer">University of Illinois Extension · Saving favorite flower seeds ↗</a></p></>;
}

type BouquetStyle = "pastel" | "bright" | "romantic" | "garden";
function BotanicalFlower({size=52,kind="dahlia"}:{size?:number;kind?:string}) {
  return <Image src={`/bouquets/recipe-${kind}.webp`} alt="" width={size} height={size} sizes={`${size}px`} className="h-full w-full object-contain" />;
}
function BouquetArtwork({style="garden",label}:{style?:BouquetStyle;label:string}) {
  return <Image src={`/bouquets/bouquet-${style}.webp`} alt={label} width={1200} height={900} sizes="(max-width: 639px) 100vw, (max-width: 1023px) 80vw, 600px" className="h-full w-full object-contain bg-[#fbf6ec]" />;
}

export function CornerCutFlowers() {
  return <>
      <div className="seasonal-card grid overflow-hidden rounded-2xl border bg-[#faf8f1] lg:grid-cols-[42%_58%]">
        <div className="flex flex-col justify-center px-6 py-9 sm:px-10 lg:px-12 lg:py-14">
          <p className="eyebrow text-[#435640]">From garden to vase</p>
          <h2 className="mt-3 font-serif text-3xl font-bold leading-tight text-[#253d2d] sm:text-4xl">Grow your own bouquets</h2>
          <p className="mt-4 max-w-[410px] text-sm leading-7 text-[#465448] sm:text-base">Discover beautiful cutting flowers, plan a cut flower garden, harvest at the right stage, and create stunning bouquets with stems from your own beds and pots.</p>
        </div>
        <div className="min-h-[245px] bg-[#f6f0e5] sm:min-h-[320px] lg:min-h-[370px]">
          <Image
            src="/Bouquets.png" width={1200} height={900} sizes="(max-width: 1023px) 100vw, 600px"
            alt="Small garden bouquet in a glass jar and a large colorful bouquet in a white pitcher"
            className="block h-full min-h-[245px] w-full object-cover object-center sm:min-h-[320px] lg:min-h-[370px]"
          />
        </div>
      </div>
      <h2 className="seasonal-heading mt-8 text-2xl font-bold">Flower Collection <span className="seasonal-muted text-base">(30 flowers)</span></h2>
      <p className="seasonal-muted mt-2 text-sm">Browse beautiful cutting flowers and explore what might grow in your garden. These are public inspiration entries, not anyone’s personal collection. Flowering seasons are broad cold-winter examples; location and variety change the timing. Each entry includes a representative hand-painted botanical illustration; flower colors and varieties may differ.</p>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" aria-label="Flower Collection">
        {cornerCutFlowers.map(g=><article key={g.name} className="overflow-hidden rounded-2xl border border-[#e8dfd4] bg-white p-3 shadow-[0_4px_16px_#50463308]">
          <FlowerGardenPortrait name={g.name} />
          <div className="mt-3 flex flex-wrap items-center gap-2"><h3 className="seasonal-heading text-base font-bold">{g.name}</h3><span className="rounded-full border border-[#a5b6a0] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Browse</span></div>
          <p className="seasonal-muted mt-2 text-xs font-semibold">{g.when}</p>
          <p className="mt-2 text-xs leading-5">{g.tip}</p>
        </article>)}
      </div>
      <section className="mt-10 overflow-hidden rounded-3xl border border-[#e7c9bf] bg-[#fcf1ed]">
        <div className="border-b border-[#eddad2] px-6 py-7 sm:px-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a85e60]">From the cutting garden</p>
          <h2 className="mt-2 font-serif text-3xl text-[#304332] sm:text-4xl">✂ Harvesting &amp; Vase Care</h2>
          <p className="mt-2 text-sm leading-6 text-[#59645a]">A few thoughtful steps help your flowers last longer after cutting.</p>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
          {[
            {number:"01",title:"Harvest at the right stage",body:"Cut in the cool morning when stems are hydrated. Dahlias should be nearly fully open; other flowers vary."},
            {number:"02",title:"Cut cleanly",body:"Use sanitized, sharp snips. Cut long stems at an angle and avoid damaging the plant's growing points."},
            {number:"03",title:"Condition your stems",body:"Remove leaves below the waterline and place stems immediately in a clean bucket of cool water."},
            {number:"04",title:"Refresh the vase",body:"Use a clean vase and flower food as directed. Change water, recut stems as needed, and keep away from sun, heat and ripening fruit."}
          ].map(step=><article key={step.number} className="rounded-2xl border border-[#eadbd2] bg-[#fffdf9] p-5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ce8183] font-serif text-lg text-white">{step.number}</span>
            <h3 className="mt-4 font-serif text-xl text-[#304332]">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[#59645a]">{step.body}</p>
          </article>)}
        </div>
      </section>
      <section className="mt-8 overflow-hidden rounded-3xl border border-[#eadbcf] bg-[#fcf1ed] p-5 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a85e60]">Arrange something beautiful</p>
        <h2 className="mt-2 font-serif text-3xl text-[#304332] sm:text-4xl">Bouquet Inspiration</h2>
        <p className="mt-2 text-sm leading-6 text-[#59645a]">Start with a simple recipe, then play with colors, heights, and textures from your own garden.</p>
        <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <figure className="relative min-h-[285px] overflow-hidden rounded-2xl border border-[#e6d7cb] bg-white">
            <BouquetArtwork style="garden" label="Illustrated garden bouquet with dahlias, cosmos and zinnias arranged in a white vase" />
            <figcaption className="absolute bottom-3 left-1/2 -translate-x-1/2 max-w-[90%] text-center rounded-full bg-white/95 px-4 py-2 font-serif text-sm text-[#304332] shadow-sm">A fresh, garden-style bouquet</figcaption>
          </figure>
          <article className="rounded-2xl border border-[#e6d7cb] bg-white px-5 py-4 sm:px-6">
            <h3 className="font-serif text-2xl text-[#304332]">The Simple Bouquet Recipe</h3>
            <p className="mt-1 text-sm text-[#59645a]">A loose, colorful arrangement for a medium vase.</p>
            <div className="mt-3 divide-y divide-[#eee3d9]">
              {[
                {count:"3",flower:"Dahlias",note:"One large and two medium focal blooms",color:"#cb7d96",kind:"dahlia"},
                {count:"2",flower:"Zinnias",note:"A bright pop of color",color:"#de996a",kind:"zinnia"},
                {count:"2",flower:"Cosmos",note:"Airy movement and texture",color:"#e4a3bd",kind:"cosmos"},
                {count:"2",flower:"Snapdragons",note:"Or other tall stems for height",color:"#c29cc2",kind:"snapdragon"},
                {count:"3–5",flower:"Foliage stems",note:"Yarrow, ammi, or suitable garden greenery",color:"#8caa83",kind:"foliage"}
              ].map(item=><div key={item.flower} className="flex items-center gap-3 py-2">
                <span className="w-10 shrink-0 font-serif text-xl text-[#a85e60]">{item.count}</span>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#faf4ed]"><BotanicalFlower kind={item.kind} size={48}/></span>
                <div><p className="text-sm font-semibold text-[#304332]">{item.flower}</p><p className="text-xs leading-5 text-[#59645a]">{item.note}</p></div>
              </div>)}
            </div>
          </article>
        </div>
        <div className="mt-5 rounded-2xl border border-[#e6d7cb] bg-white p-5">
          <div className="item-pictures-heading"><div><h3 className="font-serif text-2xl text-[#304332]">More Bouquet Ideas</h3><p className="mt-1 text-sm text-[#59645a]">Three illustrated combinations to inspire your next arrangement.</p></div></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {([
              {title:"Soft Pastel",detail:"Blush dahlias, cosmos, snapdragons and airy fillers",style:"pastel"},
              {title:"Bold & Bright",detail:"Warm zinnias, rudbeckia, dahlias and greenery",style:"bright"},
              {title:"Romantic Garden",detail:"Mauve dahlias, lisianthus, cosmos and statice",style:"romantic"}
            ] as {title:string;detail:string;style:BouquetStyle}[]).map(idea=><article key={idea.title} className="overflow-hidden rounded-2xl border border-[#e6d7cb] bg-white">
              <div className="aspect-[4/3] w-full bg-[#f8f2e9]"><BouquetArtwork style={idea.style} label={`Illustrated ${idea.title.toLowerCase()} flower bouquet in a vase`}/></div>
              <div className="p-4"><h4 className="font-serif text-lg text-[#304332]">{idea.title}</h4><p className="mt-1 text-xs leading-5 text-[#59645a]">{idea.detail}</p></div>
            </article>)}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-[#e2dcd2] bg-white p-4 sm:flex-row sm:items-center sm:gap-6">
          <h3 className="shrink-0 font-serif text-xl text-[#304332]">Design Tips</h3>
          <p className="text-sm leading-6 text-[#435640]">Choose a focal flower like a dahlia, add contrasting color and texture, use airy fillers, and vary stem heights for a relaxed garden-style bouquet.</p>
        </div>
      </section>

  <GuidanceSource href="https://yardandgarden.extension.iastate.edu/how-to/how-harvest-condition-and-care-cut-flowers" title="Iowa State University Extension · Harvest, condition and care for cut flowers"/>
  </>;
}

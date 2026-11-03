import Image from 'next/image';
import { careArtwork } from '@/lib/flower-care-art';
import type { FlowerCornerProfile } from '@/lib/flower-corner-library';
import { careVisualMode, careVisualCaption, type CareTechnique, type CareVisualMode } from '@/lib/flower-care-visuals';

const titles: Record<CareTechnique,string> = {pinching:'Pinching',deadheading:'Deadheading',cutback:'Cutting back'};
/** Botanical watercolor examples illustrate the technique, not an identification of every plant. */
export function CareDiagram({mode,label}:{mode:CareVisualMode;label:string}) {
  const art = careArtwork[mode];
  return <figure className="corner-care-art">
    <Image src={art.src} width={art.width} height={art.height} sizes="(max-width:480px) 280px, (max-width:850px) 170px, 340px" quality={90} alt={`${label} ${art.alt}`} className="corner-care-watercolor" />
    <figcaption>Illustrated example: {art.example}</figcaption>
  </figure>;
}
export function PlantCareIllustrations({profile}:{profile:FlowerCornerProfile}) {
  return <div className="corner-care-grid">{(['pinching','deadheading','cutback'] as const).map(technique=>{
    const mode=careVisualMode(profile.id,technique);
    return <section className="corner-care-card" key={technique}>
      <h3>{titles[technique]}</h3><CareDiagram mode={mode} label={`${profile.name}: ${titles[technique].toLowerCase()} technique. ${careVisualCaption(mode)}`}/>
      <p className="corner-care-caption">{careVisualCaption(mode)}</p><p className="corner-care-specific"><strong>For {profile.name}:</strong> {profile[technique]}</p>
    </section>;
  })}<p className="corner-care-legend">Watercolor examples explain each technique; they are not portraits of every plant. Follow the instructions for your plant above: timing and cultivar matter.</p></div>;
}
export default function IllustratedCareTechniques() {
  return <article className="corner-profile"><h3>Three different cuts, three different jobs</h3><p>These are examples, not a cutting schedule for every plant. Open a plant’s guide for its own instructions.</p><div className="corner-care-grid">
    <section className="corner-care-card"><h3>Pinching</h3><CareDiagram mode="pinch" label="Pinching a young branching stem above a leaf pair, with side shoots growing below the cut"/><p>Remove a young growing tip above a leaf pair to encourage branching, for suitable plants such as dahlias. Do not pinch bulbs, foliage crowns or single-stem sunflowers.</p></section>
    <section className="corner-care-card"><h3>Deadheading</h3><CareDiagram mode="deadhead" label="Removing a faded flower while retaining healthy leaves and buds below it"/><p>Remove spent flowers. For zinnias, cut above healthy leaves or a node; other plants need different cut positions. Leave selected heads if you want seed or winter habitat.</p></section>
    <section className="corner-care-card"><h3>Cutting back</h3><CareDiagram mode="trim" label="A light trim of finished upper stems, leaving living lower growth"/><p>Remove more established growth at the right stage. Catmint can be sheared after its first flowering; bulbs need their green leaves, and woody shrubs depend on their flowering wood. A hard cut is not a universal recipe.</p></section>
  </div><p className="corner-care-legend">Watercolor examples show particular plants, not a universal cutting rule. Read the species-specific text before using the picture.</p><footer className="learning-sources"><a href="https://extension.illinois.edu/flowers/caring-annuals" target="_blank" rel="noopener noreferrer">Illinois Extension · Caring for annuals ↗</a><br/><a href="https://yardandgarden.extension.iastate.edu/how-to/how-maintain-perennial-beds-and-borders" target="_blank" rel="noopener noreferrer">Iowa State Extension · Perennial care ↗</a></footer></article>;
}

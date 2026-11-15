import type { FlowerCornerProfile } from '@/lib/flower-corner-library';
import { type CareTechnique } from '@/lib/flower-care-visuals';

const titles: Record<CareTechnique,string> = {pinching:'Pinching',deadheading:'Deadheading',cutback:'Cutting back'};
/** Plant-specific text is used until verified species-matched care images are available. */
export function PlantCareIllustrations({profile}:{profile:FlowerCornerProfile}) {
  return <div className="corner-care-grid corner-care-text-grid">{(['pinching','deadheading','cutback'] as const).map(technique=>
    <section className="corner-care-card" key={technique}>
      <h3>{titles[technique]}</h3>
      <p className="corner-care-specific"><strong>For {profile.name}:</strong> {profile[technique]}</p>
    </section>
  )}<p className="corner-care-legend">Follow these instructions for {profile.name}; timing and cultivar matter. Care guidance is shown in text rather than using an illustration of a different plant.</p></div>;
}
export default function IllustratedCareTechniques() {
  return <article className="corner-profile"><h3>Three different cuts, three different jobs</h3><p>These are examples, not a cutting schedule for every plant. Open a plant’s guide for its own instructions.</p><div className="corner-care-grid corner-care-text-grid">
    <section className="corner-care-card"><h3>Pinching</h3><p>Remove a young growing tip above a leaf pair to encourage branching, for suitable plants such as dahlias. Do not pinch bulbs, foliage crowns or single-stem sunflowers.</p></section>
    <section className="corner-care-card"><h3>Deadheading</h3><p>Remove spent flowers. For zinnias, cut above healthy leaves or a node; other plants need different cut positions. Leave selected heads if you want seed or winter habitat.</p></section>
    <section className="corner-care-card"><h3>Cutting back</h3><p>Remove more established growth at the right stage. Catmint can be sheared after its first flowering; bulbs need their green leaves, and woody shrubs depend on their flowering wood. A hard cut is not a universal recipe.</p></section>
  </div><p className="corner-care-legend">Read the species-specific text before making a cut; timing and cultivar matter.</p><footer className="learning-sources"><a href="https://extension.illinois.edu/flowers/caring-annuals" target="_blank" rel="noopener noreferrer">Illinois Extension · Caring for annuals ↗</a><br/><a href="https://yardandgarden.extension.iastate.edu/how-to/how-maintain-perennial-beds-and-borders" target="_blank" rel="noopener noreferrer">Iowa State Extension · Perennial care ↗</a></footer></article>;
}

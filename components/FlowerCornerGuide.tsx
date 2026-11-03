'use client';

import { useState } from 'react';
import Link from 'next/link';
import Dialog from '@/components/ui/Dialog';
import { PlantCareIllustrations } from '@/components/IllustratedCareTechniques';
import FlowerCornerPortrait from '@/components/FlowerCornerPortrait';
import { cornerCareGuides } from '@/lib/flower-corner-editorial';
import type { FlowerCornerProfile } from '@/lib/flower-corner-library';
import { safeFlowerCornerReturn } from '@/lib/flower-corner-navigation';
import { getPlantClassification } from '@/lib/flower-corner-classification';

function Facts({ title, items }: { title: string; items: [string, string][] }) {
  return <section className="corner-facts"><h2 className="seasonal-heading mt-6 mb-3 text-2xl">{title}</h2><dl>{items.map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl></section>;
}
function relatedCare(profile: FlowerCornerProfile) {
  const normalize = (name: string) => name.toLowerCase().replace(/s$/, '').trim();
  const aliases = [profile.name, profile.artName || '', profile.id].map(normalize);
  return cornerCareGuides.filter(note => aliases.includes(normalize(note.name)));
}

export default function FlowerCornerGuide({ profile, returnTo = '/flower-corner' }: { profile: FlowerCornerProfile; returnTo?: string }) {
  const [extra, setExtra] = useState<'notes' | null>(null);
  const care = relatedCare(profile);
  const classification = getPlantClassification(profile);
  const sources = [...profile.sources, ...(classification?.sourceUrls || []).filter(url=>!profile.sources.some(source=>source.url===url)).map(url=>({title:"Life-cycle reference",url}))];
  return <article className="interior-page flower-corner corner-guide-page">
    <nav aria-label="Plant guide navigation"><Link className="seasonal-outline" href={safeFlowerCornerReturn(returnTo)}>← Back to Library</Link></nav>
    <header className="corner-guide-header">
      <div className="corner-guide-portrait"><FlowerCornerPortrait profile={profile} variant="guide" /></div>
      <div className="corner-guide-copy"><p className="modern-eyebrow">Flower Corner</p><h1>{profile.name}</h1><p className="corner-guide-botanical"><em>{profile.botanical}</em></p><p className="corner-guide-summary">{profile.summary}</p>{classification&&<p className="corner-lifecycle"><strong>{classification.label}</strong><span>{classification.note}</span></p>}</div>
    </header>
    <div className="corner-profile">
      <Facts title="The right place" items={[["Light", profile.light], ["Water", profile.water], ["Spacing", profile.spacing], ["Mature size", profile.matureSize]]} />
      <Facts title="When & how to plant" items={[["Start indoors", profile.indoorStart], ["Sow outdoors", profile.directSow], ["Transplant", profile.transplant], ["Germination", profile.germination], ["Sowing to blooms", profile.sowToBloom]]} />
      <section aria-labelledby="plant-care-heading"><h2 id="plant-care-heading" className="seasonal-heading mt-6 mb-3 text-2xl">Keep it growing</h2><PlantCareIllustrations profile={profile}/><Facts title="Everyday care" items={[["Feeding",profile.feeding],["Common problems",profile.problems]]}/></section>
      <Facts title="Flowers to enjoy and save" items={[["Bouquet use", profile.bouquet], ["Seed saving", profile.seedSaving]]} />
      {care.map(note => <Facts key={note.name} title="From the flower care notes" items={[["Care-guide light note", note.light], ["Flowering season", note.bloom], ["Care reminder", note.care]]} />)}
      <section><h2 className="seasonal-heading mt-6 mb-3 text-2xl">Before you grow</h2><ul>{profile.notes.map(note => <li key={note}>{note}</li>)}</ul></section>
      <button type="button" className="seasonal-outline" aria-haspopup="dialog" onClick={() => setExtra('notes')}>About this guide &amp; its sources</button>
      <footer className="learning-sources"><p>Sources reviewed {profile.reviewed}. Original summaries; follow cultivar instructions where they differ.</p><ul>{sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></footer>
    </div>
    <Link className="seasonal-outline" href={safeFlowerCornerReturn(returnTo)}>← Back to Library</Link>
    {extra && <Dialog title="About this growing guide" onClose={() => setExtra(null)}>
      <article className="corner-profile"><p>This public guide summarizes horticultural sources for home gardeners.</p><p>Seed germination, transplant readiness and first flowering describe different stages. Bulbs, divisions and named cultivars may need a different growing route from seed.</p><p>Illustrations are representative artwork, not identification tools. The care illustrations show botanical examples; follow the instructions for your species and cultivar before making a cut.</p><p>Sources were reviewed {profile.reviewed}. Follow the source links on the page for more detail and regional context.</p></article>
    </Dialog>}
  </article>;
}

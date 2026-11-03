'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Dialog from '@/components/ui/Dialog';
import FlowerCornerPortrait from '@/components/FlowerCornerPortrait';
import { cornerCareGuides } from '@/lib/flower-corner-editorial';
import type { FlowerCornerProfile } from '@/lib/flower-corner-library';
import { safeFlowerCornerReturn } from '@/lib/flower-corner-navigation';

function Facts({ title, items }: { title: string; items: [string, string][] }) {
  return <section className="corner-facts"><h2 className="seasonal-heading mt-6 mb-3 text-2xl">{title}</h2><dl>{items.map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl></section>;
}
function relatedCare(profile: FlowerCornerProfile) {
  const normalize = (name: string) => name.toLowerCase().replace(/s$/, '').trim();
  const aliases = [profile.name, profile.artName || '', profile.id].map(normalize);
  return cornerCareGuides.filter(note => aliases.includes(normalize(note.name)));
}

export default function FlowerCornerGuide({ profile, returnTo = '/flower-corner' }: { profile: FlowerCornerProfile; returnTo?: string }) {
  const [extra, setExtra] = useState<'techniques' | 'notes' | null>(null);
  const care = relatedCare(profile);
  return <article className="interior-page flower-corner corner-guide-page">
    <nav aria-label="Plant guide navigation"><Link className="seasonal-outline" href={safeFlowerCornerReturn(returnTo)}>← Back to Library</Link></nav>
    <header className="corner-guide-header grid gap-6 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(180px,280px)]">
      <div><p className="modern-eyebrow">Flower Corner · {profile.kind === 'foliage' ? 'Ornamental foliage' : 'Flower'}</p><h1>{profile.name}</h1><p><em>{profile.botanical}</em></p><p>{profile.summary}</p></div>
      <div className="mx-auto w-full max-w-[280px]"><FlowerCornerPortrait profile={profile} /></div>
    </header>
    <aside className="learning-note"><strong>A guide, not a universal planting date.</strong><p>Use local frost dates, soil conditions and the exact cultivar or seed packet. Hardiness zones describe winter cold, not sowing dates. Timing changes with temperature and growing conditions.</p></aside>
    <div className="corner-profile">
      <Facts title="The right place" items={[["Light", profile.light], ["Water", profile.water], ["Spacing", profile.spacing], ["Mature size", profile.matureSize]]} />
      <Facts title="When & how to plant" items={[["Start indoors", profile.indoorStart], ["Sow outdoors", profile.directSow], ["Transplant", profile.transplant], ["Germination", profile.germination], ["Sowing to blooms", profile.sowToBloom]]} />
      <Facts title="Keep it growing" items={[["Pinching", profile.pinching], ["Deadheading", profile.deadheading], ["Cutting back", profile.cutback], ["Feeding", profile.feeding], ["Common problems", profile.problems]]} />
      <button type="button" className="seasonal-outline" aria-haspopup="dialog" onClick={() => setExtra('techniques')}>Flower care: pinching, deadheading &amp; cutting back</button>
      <Facts title="Flowers to enjoy and save" items={[["Bouquet use", profile.bouquet], ["Seed saving", profile.seedSaving]]} />
      {care.map(note => <Facts key={note.name} title="From the flower care notes" items={[["Care-guide light note", note.light], ["Flowering season", note.bloom], ["Care reminder", note.care]]} />)}
      <section><h2 className="seasonal-heading mt-6 mb-3 text-2xl">Before you grow</h2><ul>{profile.notes.map(note => <li key={note}>{note}</li>)}</ul></section>
      <button type="button" className="seasonal-outline" aria-haspopup="dialog" onClick={() => setExtra('notes')}>About this guide &amp; its sources</button>
      <footer className="learning-sources"><p>Sources reviewed {profile.reviewed}. Original summaries; follow cultivar instructions where they differ.</p><ul>{profile.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></footer>
    </div>
    <Link className="seasonal-outline" href={safeFlowerCornerReturn(returnTo)}>← Back to Library</Link>
    {extra && <Dialog title={extra === 'techniques' ? 'Flower care techniques' : 'About this growing guide'} onClose={() => setExtra(null)}>
      {extra === 'techniques' ? <article className="corner-profile">
        <Image src="/flower-guides/care.webp" alt="Botanical illustration of a watering can, flowering plants and secateurs" width={1536} height={1024} sizes="(max-width:700px) 100vw, 600px" className="h-40 w-full rounded-xl bg-[#f5edf0] object-contain" />
        <h3>Three different cuts, three different jobs</h3><p>Check the plant’s growing guide and cultivar instructions before cutting.</p>
        <dl><dt>Pinching</dt><dd>Remove a young growing tip to encourage branching. Some plants, including single-stem cutting varieties, should not be pinched.</dd><dt>Deadheading</dt><dd>Remove faded flowers for tidiness or further bloom in suitable species. Leave selected heads when saving seed or providing winter habitat.</dd><dt>Cutting back</dt><dd>Remove more established growth at the appropriate stage. Timing depends on the plant and its flowering wood; do not use one pruning schedule for every species.</dd></dl>
        <p><a href="https://extension.illinois.edu/flowers/caring-annuals" target="_blank" rel="noopener noreferrer">Illinois Extension · Caring for annuals ↗</a></p>
      </article> : <article className="corner-profile"><p>This public guide summarizes horticultural sources for home gardeners. It is not a personalized local planting calendar or a promise of bloom dates.</p><p>Seed germination, transplant readiness and first flowering describe different stages. Bulbs, divisions and named cultivars may need a different growing route from seed.</p><p>Illustrations are visual references, not identification tools. Check the botanical name and cultivar label before applying the advice.</p><p>Sources were reviewed {profile.reviewed}. Follow the source links on the page for more detail and regional context.</p></article>}
    </Dialog>}
  </article>;
}

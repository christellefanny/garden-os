import Image from 'next/image';
import { BEGINNER_PLANTS, BEGINNER_COMPANION_NOTE, BEGINNER_COMPANION_SOURCES, BEGINNER_PLANTING_NOTE, type BeginnerPlant } from '@/lib/beginner-plants';
import styles from './BeginnerPlantPicks.module.css';

const illustrations: Record<string, { src: string; column?: number; row?: number }> = {
  'sweet-bell-pepper': { src: '/planting-now/pepper.webp' },
  'sweet-basil': { src: '/planting-now/basil.webp' },
  'leaf-lettuce': { src: '/planting-now/lettuce.webp' },
  'spring-radish': { src: '/planting-now/radish.webp' },
  'bush-snap-bean': { src: '/planting-now/beans.webp' },
  'slicing-tomato': { src: '/planting-now/tomato.webp' },
  'french-marigold': { src: '/plant-vault/illustrated-collection-5.webp', column: 0, row: 0 },
  'bush-nasturtium': { src: '/plant-vault/illustrated-collection-5.webp', column: 2, row: 1 },
  'sweet-alyssum': { src: '/planting-now/alyssum.webp' },
  'compact-zinnia': { src: '/planting-now/zinnia.webp' },
};

function Portrait({ plant }: { plant: BeginnerPlant }) {
  const art = illustrations[plant.id];
  // Decorative alongside the plant name: representative plant forms, not cultivar identification.
  return <span className={styles.portrait} aria-hidden="true">
    <Image src={art.src} alt="" width={art.column === undefined ? 640 : 1254} height={art.column === undefined ? 640 : 1254} sizes="88px" quality={90}
      unoptimized={art.column !== undefined}
      style={art.column === undefined ? undefined : { position: 'absolute', width: '400%', height: '400%', maxWidth: 'none', left: `${-art.column * 100}%`, top: `${-art.row! * 100}%` }} />
  </span>;
}

const fields = [
  ['start', 'How to start'], ['timing', 'When to plant'], ['spacing', 'Spacing & support'],
  ['container', 'Growing in a pot'], ['care', 'Water & everyday care'],
  ['timeToReward', 'Harvest or flowers'], ['companions', 'Good garden neighbors'], ['caution', 'Watch for'],
] as const;

/** Public reading only. Native disclosures work inside the existing popup without another dialog. */
export default function BeginnerPlantPicks({ mode }: { mode: 'page' | 'dialog' }) {
  const Heading = mode === 'page' ? 'h2' : 'h3';
  const GroupHeading = mode === 'page' ? 'h3' : 'h4';
  return <section className={styles.section} data-mode={mode} aria-labelledby="beginner-plants-heading">
    <p className={styles.eyebrow}>A small beginning</p>
    <Heading id="beginner-plants-heading" className={styles.heading}>A few good plants to start with</Heading>
    <p className={styles.intro}>Choose two or three that suit your light, season and space. These are options to consider, not a shopping list. Open a plant for the practical details.</p>
    <p className={styles.seasonNote}>{BEGINNER_PLANTING_NOTE} Illustrations show representative plant forms.</p>
    {(['vegetable', 'flower'] as const).map(kind => <div key={kind} className={styles.group}>
      <GroupHeading className={styles.groupHeading}>{kind === 'vegetable' ? 'Vegetables & herbs for your first harvest' : 'Flowers for color and garden life'}</GroupHeading>
      <div className={styles.grid}>
        {BEGINNER_PLANTS.filter(plant => kind === 'flower' ? plant.kind === 'flower' : plant.kind !== 'flower').map(plant => <details className={styles.card} key={plant.id} data-plant={plant.id}>
          <summary className={styles.summary}>
            <Portrait plant={plant} />
            <span className={styles.summaryCopy}><strong className={styles.name}>{plant.name}</strong><span className={styles.season}>{plant.season}</span><span className={styles.light}>{plant.light}</span><span className={styles.toggle}><span className={styles.closedLabel}>Growing details</span><span className={styles.openLabel}>Close details</span><span className={styles.chevron} aria-hidden="true">⌄</span></span></span>
          </summary>
          <div className={styles.body}>
            <p className={styles.why}>{plant.why}</p>
            <dl className={styles.facts}>{fields.map(([field, label]) => <div key={field}><dt>{label}</dt><dd>{plant[field]}</dd></div>)}</dl>
            {plant.guideSlug && <a className={styles.guideLink} href={`/flower-corner/${plant.guideSlug}`} target="_blank" rel="noopener noreferrer">Read the full flower guide <span>(opens in a new tab)</span></a>}
            <div className={styles.sources}><p>Sources &amp; further reading</p><ul>{plant.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<span className={styles.srOnly}> (opens in a new tab)</span></a></li>)}</ul></div>
          </div>
        </details>)}
      </div>
    </div>)}
    <aside className={styles.companions} aria-label="Companion planting, without the myths">
      <GroupHeading>Companion planting, without the myths</GroupHeading>
      <p>{BEGINNER_COMPANION_NOTE}</p>
      <ul>{BEGINNER_COMPANION_SOURCES.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<span className={styles.srOnly}> (opens in a new tab)</span></a></li>)}</ul>
    </aside>
  </section>;
}

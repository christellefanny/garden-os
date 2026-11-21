import Image from "next/image";
import type { Garden } from "@/lib/garden";

type GardenOverview = { garden: Garden; spaces: number; plants: number };

function artwork(name: string) {
  return /flower|cut|bloom/i.test(name) ? "flower" : /herb/i.test(name) ? "herb" : /front|yard|landscape/i.test(name) ? "front" : "vegetable";
}

export default function GardenCollection({ gardens, detail, disabled, onOpen, onNew, onBlooms, onInspiration }: {
  gardens: GardenOverview[];
  detail: boolean;
  disabled: boolean;
  onOpen: (id: string) => void;
  onNew: () => void;
  onBlooms: () => void;
  onInspiration: () => void;
}) {
  const current = detail ? gardens[0]?.garden : undefined;
  const spaces = gardens.reduce((sum, item) => sum + item.spaces, 0);
  const plants = gardens.reduce((sum, item) => sum + item.plants, 0);
  return <>
    <header className="garden-collection-header">
      <div className="garden-collection-intro">
        <p className="modern-eyebrow">{current ? "Your garden journal" : "Your own patch of possibility"}</p>
        <h1>{current?.name ?? "My Gardens"}</h1>
        <p>{current ? [String(current.year), current.location, current.hardiness_zone ? `Zone ${current.hardiness_zone}` : null].filter(Boolean).join(" · ") : "Every garden begins with a little possibility. Make room for yours."}</p>
        {!detail && <button type="button" disabled={disabled} onClick={onNew} className="seasonal-button garden-create-button">+ New Garden</button>}
        <dl className="garden-collection-summary" aria-label={detail ? "Garden summary" : "Garden collection summary"}>
          {!detail && <div><dt>Gardens</dt><dd>{gardens.length}</dd></div>}
          <div><dt>Growing spaces</dt><dd>{spaces}</dd></div>
          <div><dt>Plants</dt><dd>{plants}</dd></div>
        </dl>
      </div>
      <div className="garden-collection-header-art" aria-hidden="true">
        <Image src={`/conservatory/garden-${current ? artwork(current.name) : "herb"}.webp`} alt="" width={720} height={480} sizes="(max-width: 600px) 100vw, 400px" />
      </div>
    </header>
    {!detail && <article className="flower-garden-entry" aria-labelledby="blooms-entry-title"><div><p className="modern-eyebrow">Your flowers, together</p><h2 id="blooms-entry-title">Blooms</h2><p>Your flowers, Flower Collection, seasonal planting, flower care, seed saving and bouquet ideas.</p></div><button type="button" className="seasonal-button" onClick={onBlooms}>Open Blooms →</button></article>}
    {!detail && <section aria-label="Your gardens" className="garden-collection-section">
      <div className="garden-collection-section-title"><h2>Your growing world</h2><p>Choose a garden to explore</p></div>
      <div className="garden-collection-grid">
        {gardens.map(({ garden, spaces, plants }) => <button key={garden.id} type="button" onClick={() => onOpen(garden.id)} className="garden-collection-card">
          <span className="garden-collection-card-art"><Image src={`/conservatory/garden-${artwork(garden.name)}.webp`} alt="" width={720} height={480} sizes="(max-width: 600px) 100vw, (max-width: 1200px) 45vw, 30vw" /><span className="garden-year">{garden.year}</span></span>
          <span className="garden-collection-card-copy">
            <span className="garden-card-name">{garden.name}</span>
            {(garden.location || garden.hardiness_zone) && <span className="garden-card-location">{[garden.location, garden.hardiness_zone ? `Zone ${garden.hardiness_zone}` : null].filter(Boolean).join(" · ")}</span>}
            <span className="garden-card-counts">{spaces} growing {spaces === 1 ? "space" : "spaces"}<span aria-hidden="true"> · </span>{plants} {plants === 1 ? "plant" : "plants"}</span>
            <span className="garden-card-open">Explore garden <span aria-hidden="true">↗</span></span>
          </span>
        </button>)}
        <button type="button" disabled={disabled} onClick={onNew} className="garden-collection-new">
          <span className="garden-new-plus" aria-hidden="true">+</span>
          <span className="garden-card-name">{gardens.length ? "A little more room to grow" : "Your first garden starts here"}</span>
          <span>Gather your beds, containers, and garden plans in one place.</span>
          <span className="garden-card-open">New Garden <span aria-hidden="true">→</span></span>
        </button>
      </div>
    </section>}
    {!detail && <section className="modern-card mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between" aria-labelledby="garden-inspiration-entry-title">
      <div>
        <h2 id="garden-inspiration-entry-title" className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M3 3h8v10H3ZM15 3h6v6h-6ZM3 17h8v4H3ZM15 13h6v8h-6Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Garden Inspiration
        </h2>
        <p className="seasonal-muted mt-2 text-sm">Collect pictures and ideas for the garden you want to grow.</p>
      </div>
      <button type="button" className="seasonal-outline min-h-11 shrink-0 rounded-xl border px-4 py-2" onClick={onInspiration}>Open Garden Inspiration →</button>
    </section>}
  </>;
}

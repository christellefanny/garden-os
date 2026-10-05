"use client";

import { useEffect, useMemo, useState } from "react";

type Space = { id: string; name: string; type: string; size: string; plants: number; capacity: number; icon: string };
const STORAGE_KEY = "garden-os-growing-spaces";
const starter: Space[] = [
  { id: "tomato", name: "Tomato Bed", type: "Raised Bed", size: "6 × 3 × 1 ft", plants: 7, capacity: 78, icon: "🍅" },
  { id: "pepper", name: "Pepper Bed", type: "Raised Bed", size: "5 × 2.5 × 1 ft", plants: 0, capacity: 0, icon: "🌶️" },
  { id: "blueberry", name: "Blueberry Pot", type: "Container", size: "20-inch pot", plants: 1, capacity: 65, icon: "🫐" },
  { id: "strawberry", name: "Strawberry Planter", type: "Container", size: "20-inch planter", plants: 5, capacity: 82, icon: "🍓" },
];

export default function GardenWorkspace() {
  const [spaces, setSpaces] = useState<Space[]>(starter);
  const [ready, setReady] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [planner, setPlanner] = useState(false);

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setSpaces(JSON.parse(saved)); } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(spaces)); }, [spaces, ready]);

  const totals = useMemo(() => ({ plants: spaces.reduce((n, s) => n + s.plants, 0), warnings: spaces.filter((s) => s.capacity >= 80).length }), [spaces]);

  function addSpace(form: FormData) {
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    const type = String(form.get("type") || "Raised Bed");
    const size = String(form.get("size") || "Not set").trim() || "Not set";
    const plants = Math.max(0, Number(form.get("plants")) || 0);
    const capacity = Math.min(100, Math.max(0, Number(form.get("capacity")) || 0));
    const icon = String(form.get("icon") || "🌱").trim() || "🌱";
    setSpaces((current) => [...current, { id: crypto.randomUUID(), name, type, size, plants, capacity, icon }]);
    setShowAdd(false);
  }

  return <>
    <section className="mt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold uppercase tracking-widest text-[var(--muted)]">My garden</p><h2 className="seasonal-heading mt-1 text-3xl font-black">Growing Spaces</h2><p className="seasonal-muted mt-2 text-sm">{spaces.length} spaces · {totals.plants} plants · {totals.warnings} capacity warning{totals.warnings === 1 ? "" : "s"}</p></div>
        <button type="button" onClick={() => setShowAdd(true)} className="seasonal-button rounded-xl px-5 py-3 font-bold text-white shadow-sm">+ Add Growing Space</button>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">{spaces.map((space) => <SpaceCard key={space.id} space={space} onOpen={() => setOpenId(space.id)} />)}</div>
      {!spaces.length && <div className="seasonal-card mt-6 rounded-3xl border p-8 text-center seasonal-muted">No growing spaces yet. Add your first bed or container.</div>}
    </section>

    <section className="seasonal-card mt-10 rounded-3xl border p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">Planning tool</p><h2 className="seasonal-heading mt-1 text-2xl font-black">Not sure how many plants will fit?</h2><p className="seasonal-muted mt-2">Estimate plant capacity from bed dimensions and spacing.</p></div><button type="button" onClick={() => setPlanner(true)} className="seasonal-outline shrink-0 rounded-xl border-2 px-5 py-3 font-bold">Open Plant Planner</button></div>
    </section>

    {showAdd && <Modal title="Add Growing Space" onClose={() => setShowAdd(false)}><form action={addSpace} className="space-y-4"><Field name="name" label="Name" placeholder="Garlic Bed" required /><label className="block text-sm font-bold">Type<select name="type" className="seasonal-input mt-1 w-full rounded-xl border p-3"><option>Raised Bed</option><option>In-ground Bed</option><option>Container</option><option>Hydroponic</option></select></label><Field name="size" label="Size" placeholder="6 × 3 × 1 ft" /><div className="grid grid-cols-2 gap-3"><Field name="plants" label="Plants" type="number" placeholder="0" /><Field name="capacity" label="Capacity %" type="number" placeholder="0" /></div><Field name="icon" label="Icon" placeholder="🌱" /><button className="seasonal-button w-full rounded-xl py-3 font-bold text-white">Save Growing Space</button></form></Modal>}
    {openId && (() => { const s = spaces.find((x) => x.id === openId); return s ? <Modal title={`${s.icon} ${s.name}`} onClose={() => setOpenId(null)}><div className="space-y-3"><p><b>Type:</b> {s.type}</p><p><b>Size:</b> {s.size}</p><p><b>Plants:</b> {s.plants}</p><p><b>Capacity:</b> {s.capacity}%</p><button type="button" onClick={() => { setSpaces((x) => x.filter((v) => v.id !== s.id)); setOpenId(null); }} className="mt-4 rounded-xl border border-red-300 px-4 py-2 font-bold text-red-700">Delete Space</button></div></Modal> : null; })()}
    {planner && <PlantPlanner onClose={() => setPlanner(false)} />}
  </>;
}

function SpaceCard({ space, onOpen }: { space: Space; onOpen: () => void }) {
  const warning = space.capacity >= 80;
  return <article className="seasonal-card rounded-3xl border p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><span className="seasonal-icon flex h-14 w-14 items-center justify-center rounded-2xl text-3xl">{space.icon}</span><div><p className="seasonal-muted text-sm font-semibold">{space.type}</p><h3 className="seasonal-heading text-xl font-black">{space.name}</h3></div></div>{warning && <span className="rounded-full bg-[var(--highlight)] px-3 py-1 text-xs font-bold">Check capacity</span>}</div><div className="mt-6 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-black/5 p-4"><p className="seasonal-muted text-sm">Size</p><p className="mt-1 font-bold">{space.size}</p></div><div className="rounded-2xl bg-black/5 p-4"><p className="seasonal-muted text-sm">Plants</p><p className="mt-1 font-bold">{space.plants || "Empty"}</p></div></div><div className="mt-6"><div className="flex justify-between text-sm font-bold"><span>Capacity</span><span>{space.capacity}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-black/10"><div className={warning ? "h-full rounded-full bg-[var(--highlight)]" : "seasonal-progress h-full rounded-full"} style={{ width: `${space.capacity}%` }} /></div></div><button type="button" onClick={onOpen} className="seasonal-link mt-6 font-bold hover:underline">Open Space →</button></article>;
}

function PlantPlanner({ onClose }: { onClose: () => void }) {
  const [length, setLength] = useState(6), [width, setWidth] = useState(3), [spacing, setSpacing] = useState(18);
  const capacity = Math.max(0, Math.floor((length * 12 / Math.max(spacing, 1)) * (width * 12 / Math.max(spacing, 1))));
  return <Modal title="Plant Planner" onClose={onClose}><p className="seasonal-muted mb-4">A simple square-grid estimate. Always check the seed packet for your crop&apos;s actual spacing.</p><div className="grid grid-cols-3 gap-3"><NumberField label="Length ft" value={length} set={setLength} /><NumberField label="Width ft" value={width} set={setWidth} /><NumberField label="Spacing in" value={spacing} set={setSpacing} /></div><div className="seasonal-icon mt-5 rounded-2xl p-5 text-center"><p className="seasonal-muted text-sm">Estimated capacity</p><p className="seasonal-heading mt-1 text-4xl font-black">{capacity}</p><p className="seasonal-muted text-sm">plants</p></div></Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="seasonal-card max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl border p-6 shadow-xl"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="seasonal-heading text-2xl font-black">{title}</h2><button type="button" onClick={onClose} className="rounded-full px-3 py-2 font-bold" aria-label="Close">✕</button></div>{children}</div></div>; }
function Field({ name, label, type = "text", placeholder, required }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }) { return <label className="block text-sm font-bold">{label}<input name={name} type={type} placeholder={placeholder} required={required} min={type === "number" ? 0 : undefined} className="seasonal-input mt-1 w-full rounded-xl border p-3" /></label>; }
function NumberField({ label, value, set }: { label: string; value: number; set: (n: number) => void }) { return <label className="text-sm font-bold">{label}<input type="number" min="1" value={value} onChange={(e) => set(Math.max(1, Number(e.target.value) || 1))} className="seasonal-input mt-1 w-full rounded-xl border p-3" /></label>; }

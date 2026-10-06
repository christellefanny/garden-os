"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

type Space = { id: string; name: string; type: string; size: string; plants: number; capacity: number; icon: string; crop?: string };
type Crop = { name: string; spacing: number; icon: string };
const STORAGE_KEY = "garden-os-growing-spaces";
const CROPS: Crop[] = [
  { name: "Garlic", spacing: 5, icon: "🧄" }, { name: "Onion", spacing: 4, icon: "🧅" },
  { name: "Lettuce", spacing: 8, icon: "🥬" }, { name: "Broccoli", spacing: 18, icon: "🥦" },
  { name: "Tomato", spacing: 24, icon: "🍅" }, { name: "Bell Pepper", spacing: 18, icon: "🫑" },
  { name: "Hot Pepper", spacing: 18, icon: "🌶️" }, { name: "Okra", spacing: 12, icon: "🌱" },
  { name: "Strawberry", spacing: 10, icon: "🍓" }, { name: "Sweet Potato", spacing: 12, icon: "🍠" },
  { name: "Herbs", spacing: 10, icon: "🌿" }, { name: "Other", spacing: 12, icon: "🌱" },
];
const starter: Space[] = [
  { id: "tomato", name: "Tomato Bed", type: "Raised Bed", size: "6 × 3 × 1 ft", plants: 7, capacity: 78, icon: "🍅", crop: "Tomato" },
  { id: "pepper", name: "Pepper Bed", type: "Raised Bed", size: "5 × 2.5 × 1 ft", plants: 0, capacity: 0, icon: "🌶️", crop: "Hot Pepper" },
  { id: "blueberry", name: "Blueberry Pot", type: "Container", size: "20-inch pot", plants: 1, capacity: 65, icon: "🫐" },
  { id: "strawberry", name: "Strawberry Planter", type: "Container", size: "20-inch planter", plants: 5, capacity: 82, icon: "🍓", crop: "Strawberry" },
];

function capacityColor(capacity: number) {
  if (capacity >= 100) return "bg-red-500";
  if (capacity >= 75) return "bg-orange-500";
  return "seasonal-progress";
}

export default function GardenWorkspace() {
  const [spaces, setSpaces] = useState<Space[]>(starter);
  const [ready, setReady] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [planner, setPlanner] = useState(false);

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setSpaces(parsed); } } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(spaces)); } catch {} } }, [spaces, ready]);

  const totals = useMemo(() => ({ plants: spaces.reduce((n, s) => n + s.plants, 0), warnings: spaces.filter((s) => s.capacity >= 75).length }), [spaces]);

  function addSpace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    const type = String(form.get("type") || "Raised Bed");
    const size = String(form.get("size") || "").trim() || "Not set";
    const plants = Math.max(0, Number(form.get("plants")) || 0);
    const capacity = Math.min(150, Math.max(0, Number(form.get("capacity")) || 0));
    const crop = String(form.get("crop") || "Other");
    const selectedCrop = CROPS.find((c) => c.name === crop);
    const icon = String(form.get("icon") || "").trim() || selectedCrop?.icon || "🌱";
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setSpaces((current) => [...current, { id, name, type, size, plants, capacity, icon, crop }]);
    setShowAdd(false);
  }

  return <>
    <section className="mt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold uppercase tracking-widest text-[var(--muted)]">My garden</p><h2 className="seasonal-heading mt-1 text-3xl font-black">Growing Spaces</h2><p className="seasonal-muted mt-2 text-sm">{spaces.length} spaces · {totals.plants} plants · {totals.warnings} capacity warning{totals.warnings === 1 ? "" : "s"}</p></div>
        <button type="button" onClick={() => setShowAdd(true)} className="seasonal-button rounded-xl px-5 py-3 font-bold text-white shadow-sm">+ Add Growing Space</button>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-2">{spaces.map((space) => <SpaceCard key={space.id} space={space} onOpen={() => setOpenId(space.id)} />)}</div>
    </section>

    <section className="seasonal-card mt-10 rounded-3xl border p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">Planning tool</p><h2 className="seasonal-heading mt-1 text-2xl font-black">Not sure how many plants will fit?</h2><p className="seasonal-muted mt-2">Choose the growing space and crop for a smarter capacity estimate.</p></div><button type="button" onClick={() => setPlanner(true)} className="seasonal-outline shrink-0 rounded-xl border-2 px-5 py-3 font-bold">Open Plant Planner</button></div></section>

    {showAdd && <Modal title="Add Growing Space" onClose={() => setShowAdd(false)}><form onSubmit={addSpace} className="space-y-4">
      <Field name="name" label="Name" placeholder="Garlic Grow Bag" required />
      <Select name="type" label="Growing space" options={["Raised Bed","In-ground Bed","Growing Bag","Container","Hydroponic"]} />
      <Select name="crop" label="What are you growing?" options={CROPS.map(c => c.name)} />
      <Field name="size" label="Size" placeholder="25 gal, 20-inch pot, or 6 × 3 ft" />
      <div className="grid grid-cols-2 gap-3"><Field name="plants" label="Plants / bulbs" type="number" placeholder="0" /><Field name="capacity" label="Suggested capacity %" type="number" placeholder="Use planner" /></div>
      <p className="seasonal-muted text-xs">For the best capacity suggestion, use Plant Planner first. Capacity depends on both the crop and the usable surface area—not gallons alone.</p>
      <Field name="icon" label="Icon (optional)" placeholder="🧄" />
      <button type="submit" className="seasonal-button w-full rounded-xl py-3 font-bold text-white">Save Growing Space</button>
    </form></Modal>}

    {openId && (() => { const s = spaces.find((x) => x.id === openId); return s ? <Modal title={`${s.icon} ${s.name}`} onClose={() => setOpenId(null)}><div className="space-y-3"><p><b>Type:</b> {s.type}</p>{s.crop && <p><b>Crop:</b> {s.crop}</p>}<p><b>Size:</b> {s.size}</p><p><b>Plants:</b> {s.plants}</p><p><b>Capacity:</b> {s.capacity}%</p><button type="button" onClick={() => { setSpaces((x) => x.filter((v) => v.id !== s.id)); setOpenId(null); }} className="mt-4 rounded-xl border border-red-300 px-4 py-2 font-bold text-red-700">Delete Space</button></div></Modal> : null; })()}
    {planner && <PlantPlanner onClose={() => setPlanner(false)} />}
  </>;
}

function SpaceCard({ space, onOpen }: { space: Space; onOpen: () => void }) {
  const warning = space.capacity >= 75;
  return <article className="seasonal-card rounded-3xl border p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><span className="seasonal-icon flex h-14 w-14 items-center justify-center rounded-2xl text-3xl">{space.icon}</span><div><p className="seasonal-muted text-sm font-semibold">{space.type}{space.crop ? ` · ${space.crop}` : ""}</p><h3 className="seasonal-heading text-xl font-black">{space.name}</h3></div></div>{warning && <span className="rounded-full bg-[var(--highlight)] px-3 py-1 text-xs font-bold">{space.capacity >= 100 ? "At capacity" : "Getting full"}</span>}</div><div className="mt-6 grid grid-cols-2 gap-4"><div className="rounded-2xl bg-black/5 p-4"><p className="seasonal-muted text-sm">Size</p><p className="mt-1 font-bold">{space.size}</p></div><div className="rounded-2xl bg-black/5 p-4"><p className="seasonal-muted text-sm">Plants</p><p className="mt-1 font-bold">{space.plants || "Empty"}</p></div></div><div className="mt-6"><div className="flex justify-between text-sm font-bold"><span>Capacity</span><span>{space.capacity}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-black/10"><div className={`h-full rounded-full ${capacityColor(space.capacity)}`} style={{ width: `${Math.min(space.capacity,100)}%` }} /></div></div><button type="button" onClick={onOpen} className="seasonal-link mt-6 font-bold hover:underline">Open Space →</button></article>;
}

function PlantPlanner({ onClose }: { onClose: () => void }) {
  const [spaceType, setSpaceType] = useState("Growing Bag");
  const [cropName, setCropName] = useState("Garlic");
  const [length, setLength] = useState("6");
  const [width, setWidth] = useState("3");
  const [diameter, setDiameter] = useState("22");
  const [gallons, setGallons] = useState("25");
  const [currentPlants, setCurrentPlants] = useState("15");
  const crop = CROPS.find(c => c.name === cropName) || CROPS[CROPS.length - 1];
  const spacing = crop.spacing;
  const round = spaceType === "Growing Bag" || spaceType === "Container";
  const l = Math.max(0, Number(length) || 0) * 12;
  const w = Math.max(0, Number(width) || 0) * 12;
  const d = Math.max(0, Number(diameter) || 0);
  const area = round ? Math.PI * Math.pow(d / 2, 2) : l * w;
  const recommended = Math.max(1, Math.floor(area / (spacing * spacing)));
  const count = Math.max(0, Number(currentPlants) || 0);
  const percent = Math.round((count / recommended) * 100);

  return <Modal title="Plant Planner" onClose={onClose}>
    <p className="seasonal-muted mb-5">Garden OS now adjusts the estimate for the growing space and the crop instead of treating everything like a rectangular bed.</p>
    <div className="space-y-4">
      <SelectControlled label="1. Growing space" value={spaceType} set={setSpaceType} options={["Raised Bed","In-ground Bed","Growing Bag","Container"]} />
      <SelectControlled label="2. Plant" value={cropName} set={setCropName} options={CROPS.map(c => c.name)} />
      {round ? <div className="grid gap-3 sm:grid-cols-2"><PlannerField label="Top diameter (inches)" value={diameter} set={setDiameter} /><PlannerField label="Volume (gallons)" value={gallons} set={setGallons} /></div> : <div className="grid gap-3 sm:grid-cols-2"><PlannerField label="Length (ft)" value={length} set={setLength} /><PlannerField label="Width (ft)" value={width} set={setWidth} /></div>}
      <PlannerField label={cropName === "Garlic" ? "Bulbs planted" : "Plants planted"} value={currentPlants} set={setCurrentPlants} />
    </div>
    {round && <p className="seasonal-muted mt-3 text-xs">For bags and pots, top diameter drives spacing capacity; gallons help describe root volume. A 25-gallon bag is often around 20–24 inches wide, so measure yours for the best result.</p>}
    <div className="seasonal-icon mt-5 rounded-2xl p-5">
      <div className="grid grid-cols-2 gap-4 text-center"><div><p className="seasonal-muted text-xs">Suggested max</p><p className="seasonal-heading text-3xl font-black">{recommended}</p><p className="seasonal-muted text-xs">{cropName === "Garlic" ? "bulbs" : "plants"}</p></div><div><p className="seasonal-muted text-xs">Current capacity</p><p className="seasonal-heading text-3xl font-black">{percent}%</p><p className="seasonal-muted text-xs">at ~{spacing}&quot; spacing</p></div></div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/10"><div className={`h-full rounded-full ${capacityColor(percent)}`} style={{width:`${Math.min(percent,100)}%`}} /></div>
    </div>
    {spaceType === "Growing Bag" && cropName === "Garlic" && Number(gallons) === 25 && count === 15 && <p className="mt-4 rounded-xl bg-black/5 p-3 text-sm"><b>Your 25-gallon garlic example:</b> with a typical ~22-inch top and 5-inch garlic spacing, 15 bulbs is about <b>{percent}% capacity</b>. That is comfortably full, not automatically overcrowded.</p>}
  </Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="seasonal-card max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl border p-6 shadow-xl"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="seasonal-heading text-2xl font-black">{title}</h2><button type="button" onClick={onClose} className="rounded-full px-3 py-2 font-bold" aria-label="Close">✕</button></div>{children}</div></div>; }
function Field({ name, label, type = "text", placeholder, required }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }) { return <label className="block text-sm font-bold">{label}<input name={name} type={type} placeholder={placeholder} required={required} min={type === "number" ? 0 : undefined} className="seasonal-input mt-1 w-full rounded-xl border p-3" /></label>; }
function Select({ name, label, options }: { name: string; label: string; options: string[] }) { return <label className="block text-sm font-bold">{label}<select name={name} className="seasonal-input mt-1 w-full rounded-xl border p-3">{options.map(o => <option key={o}>{o}</option>)}</select></label>; }
function SelectControlled({ label, value, set, options }: { label: string; value: string; set: (v: string) => void; options: string[] }) { return <label className="block text-sm font-bold">{label}<select value={value} onChange={e => set(e.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-3">{options.map(o => <option key={o}>{o}</option>)}</select></label>; }
function PlannerField({ label, value, set }: { label: string; value: string; set: (value: string) => void }) { return <label className="text-sm font-bold">{label}<input type="number" min="0" step="any" inputMode="decimal" value={value} onChange={(e) => set(e.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-3" /></label>; }

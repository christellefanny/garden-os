"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { supabase } from "@/lib/supabase";
import { photoLayoutDraft, parsePhotoAnalysis, photoLayoutKinds, PHOTO_LAYOUT_MAX_ITEMS, type PhotoArea } from "@/lib/photo-layout";
import { prepareLayoutPhoto } from "@/lib/photo-layout-image";
import type { Layout } from "@/lib/layout-design";

type Area = PhotoArea & { id: string };
const bound = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export default function PhotoGardenLayout({ userId, onCancel, onCreate }: { userId: string; onCancel: () => void; onCreate: (layout: Layout) => void }) {
  const [photo, setPhoto] = useState<Awaited<ReturnType<typeof prepareLayoutPhoto>> | null>(null);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [focus, setFocus] = useState<"mixed" | "beds" | "containers">("mixed");
  const [areas, setAreas] = useState<Area[]>([]), [selected, setSelected] = useState("");
  const [name, setName] = useState("My garden from a photo"), [notes, setNotes] = useState("");
  const [summary, setSummary] = useState(""), [scanNotes, setScanNotes] = useState<string[]>([]);
  const [busy, setBusy] = useState(""), [error, setError] = useState("");
  const [reviewed, setReviewed] = useState(false), [keepPhoto, setKeepPhoto] = useState(true);
  const [width, setWidth] = useState(""), [depth, setDepth] = useState("");
  const request = useRef<AbortController | null>(null), version = useRef(0);
  const canvas = useRef<HTMLDivElement>(null), reviewHeading = useRef<HTMLHeadingElement>(null);
  const gesture = useRef<{ id: string; x: number; y: number; width: number; height: number; original: Area } | null>(null);
  const item = areas.find(a => a.id === selected);
  useEffect(() => () => { version.current++; request.current?.abort(); }, []);
  useEffect(() => { if (step === "review") reviewHeading.current?.focus(); }, [step]);
  async function upload(file?: File) {
    if (!file) return;
    const current = ++version.current; request.current?.abort(); setBusy("Preparing picture…"); setError("");
    // Clear a previous picture immediately so an invalid replacement can never scan the old one.
    setPhoto(null); setAreas([]); setSummary(""); setScanNotes([]); setSelected(""); setReviewed(false);
    try {
      const prepared = await prepareLayoutPhoto(file);
      if (version.current === current) setPhoto(prepared);
    } catch (e) { if (version.current === current) setError(e instanceof Error ? e.message : "Could not open that photo. Try a JPG or PNG."); }
    finally { if (version.current === current) setBusy(""); }
  }
  async function scan() {
    if (!photo || busy) return;
    const current = ++version.current, controller = new AbortController(); request.current = controller;
    setBusy("Finding beds, containers and paths…"); setError("");
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError || !data.session || data.session.user.id !== userId) throw Error("Sign in to scan automatically. You can still mark the areas yourself.");
      const response = await fetch("/api/photo-layout", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify({ image: photo.analysis, focus }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(55000)]) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Could not scan this photo.");
      const analysis = parsePhotoAnalysis(result.analysis);
      if (version.current !== current) return;
      const next = analysis.areas.map(a => ({ ...a, id: crypto.randomUUID() }));
      setAreas(next); setSelected(next[0]?.id ?? ""); setSummary(analysis.summary); setScanNotes(analysis.notes); setStep("review"); setReviewed(false);
    } catch (e) { if (version.current === current && !controller.signal.aborted) setError(e instanceof Error ? e.message : "The scan couldn’t finish. You can mark the areas yourself."); }
    finally { if (version.current === current) setBusy(""); }
  }
  function markManually() { version.current++; request.current?.abort(); setBusy(""); setError(""); setStep("review"); }
  function add(kind: Area["kind"]) {
    if (areas.length >= PHOTO_LAYOUT_MAX_ITEMS) return;
    const next: Area = { id: crypto.randomUUID(), name: `${kind} ${areas.filter(a => a.kind === kind).length + 1}`, kind, x: 20, y: 25, w: kind === "Path" ? 55 : kind === "Container" ? 14 : 25, h: kind === "Path" ? 8 : kind === "Container" ? 14 : 25 };
    setAreas([...areas, next]); setSelected(next.id); setReviewed(false); setError("");
  }
  function change(patch: Partial<Area>) {
    setAreas(previous => previous.map(a => {
      if (a.id !== selected) return a;
      const next = { ...a, ...patch };
      next.w = bound(next.w, 4, 100); next.h = bound(next.h, 4, 100);
      next.x = bound(next.x, 0, 100 - next.w); next.y = bound(next.y, 0, 100 - next.h);
      return next;
    })); setReviewed(false); setError("");
  }
  function start(event: PointerEvent<HTMLButtonElement>, area: Area) {
    if (event.button !== 0 || !canvas.current) return;
    setSelected(area.id); setReviewed(false);
    const rect = canvas.current.getBoundingClientRect();
    gesture.current = { id: area.id, x: event.clientX, y: event.clientY, width: rect.width, height: rect.height, original: area };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current; if (!g) return;
    const x = bound(g.original.x + (event.clientX-g.x)/g.width*100, 0, 100-g.original.w);
    const y = bound(g.original.y + (event.clientY-g.y)/g.height*100, 0, 100-g.original.h);
    setAreas(previous => previous.map(a => a.id === g.id ? { ...a, x, y } : a));
  }
  function save() {
    setError("");
    if (!reviewed || !photo) { setError("Review the areas and confirm the map before creating your layout."); return; }
    const widthFeet = width ? Number(width) : undefined, depthFeet = depth ? Number(depth) : undefined;
    if ([widthFeet, depthFeet].some(n => n !== undefined && (!Number.isFinite(n) || n <= 0 || n > 10000))) { setError("Use a positive measurement up to 10,000 feet, or leave it blank."); return; }
    try {
      onCreate(photoLayoutDraft({ summary, notes: scanNotes, areas }, name, { method: "photo", focus, image: keepPhoto ? photo.reference : undefined, aspectRatio: photo.aspectRatio, widthFeet, depthFeet, notes: notes.trim(), reviewedAt: new Date().toISOString() }));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your layout. Your draft is still here."); }
  }
  return <section className="photo-layout-flow" aria-label="Create a garden from a photo">
    <div className="photo-layout-top"><div><p className="modern-eyebrow">A new way to begin</p><h2>From your garden, to your plan.</h2><p>A familiar corner, ready for its next chapter.</p></div><button type="button" className="seasonal-outline rounded-xl border px-4 py-3" onClick={onCancel}>← Back to inspiration</button></div>
    <ol className="photo-layout-steps" aria-label="Photo layout steps"><li aria-current={step === "upload" ? "step" : undefined}>1 · Choose a picture</li><li aria-current={step === "review" ? "step" : undefined}>2 · Review your map</li><li>3 · Make it yours</li></ol>
    {step === "upload" ? <div className="photo-upload-grid"><div className="photo-upload-copy">
      <p className="modern-eyebrow">Map my existing garden</p><h3>Start with a picture of your space.</h3><p>Vegetables in grow bags, flowers in patio pots, or a yard full of beds—every kind of garden belongs here.</p>
      <fieldset className="photo-garden-focus"><legend>How do you grow?</legend>{([{id:"mixed",label:"Mixed garden",detail:"Beds, pots & paths"},{id:"containers",label:"Container garden",detail:"Pots, planters & grow bags"},{id:"beds",label:"Beds & borders",detail:"Raised or in-ground beds"}] as const).map(option=><label key={option.id}><input type="radio" name="photo-garden-focus" checked={focus===option.id} disabled={!!busy} onChange={()=>setFocus(option.id)}/><span><strong>{option.label}</strong><small>{option.detail}</small></span></label>)}</fieldset>
      <p>A clear photo from above or a raised viewpoint works best. Include the whole area and avoid people or personal details.</p>
      <label className="photo-file-label">Choose a garden photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={!!busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; void upload(file); }} /></label>
      <p className="photo-small">JPG, PNG or WebP · up to 20 MB</p>
      {photo && <div className="photo-upload-actions"><button type="button" className="seasonal-button rounded-xl px-5 py-3" disabled={!!busy || userId === "guest"} onClick={() => void scan()}>Find garden areas</button><button type="button" className="seasonal-outline rounded-xl border px-4 py-3" disabled={!!busy} onClick={markManually}>Mark areas myself</button></div>}
      {userId === "guest" && <p className="photo-small">Sign in for automatic detection, or choose a photo and mark the areas yourself—no account needed.</p>}
      <p className="photo-small">When you choose Find garden areas, a resized copy is sent to our AI service to suggest a map. Nothing is saved until you review and create the layout.</p>
    </div><div className="photo-upload-preview">{photo ? <Image src={photo.reference} width={600} height={400} unoptimized alt="Your chosen garden photo" /> : <><Image src="/layout-inspiration/courtyard-open-entry.webp" width={600} height={400} alt="Botanical illustration of a garden with beds, containers and a clear path" /><p>Your own garden belongs here.</p></>}</div></div> : <>
      <div className="photo-review-intro"><h3 ref={reviewHeading} tabIndex={-1}>A first draft, ready for your eye.</h3><p>{summary || "Mark each visible area, then give it a name. You can refine the plan in the editor."}</p><p>Photo angles distort distances. This is an approximate photo map; check the shapes and spacing before using it as a plan. Sunlight and plant identities aren’t inferred.</p>{scanNotes.length > 0 && <ul>{scanNotes.map((note, i) => <li key={i}>{note}</li>)}</ul>}</div>
      <div className="photo-review-grid"><div><div className="photo-map" ref={canvas} style={{ aspectRatio: photo?.aspectRatio || 1 }} aria-label="Photo map preview">
        {/* A local, re-encoded upload, never an arbitrary remote source. */}
        <Image src={photo!.reference} width={600} height={400} unoptimized alt="Your garden with editable area markers" draggable={false} />
        {areas.map((a, i) => <button type="button" key={a.id} className="photo-map-area" data-kind={a.kind} aria-label={`Select area ${i+1}: ${a.name}`} aria-pressed={selected === a.id} style={{ left: `${a.x}%`, top: `${a.y}%`, width: `${a.w}%`, height: `${a.h}%` }} onClick={() => setSelected(a.id)} onPointerDown={e => start(e, a)} onPointerMove={move} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { const g = gesture.current; if (g) setAreas(previous => previous.map(a => a.id === g.id ? g.original : a)); gesture.current = null; }}><span>{i+1}</span></button>)}
      </div><p className="photo-small">Drag a marker to move it. Use the fields beside the photo to resize or reach overlapping areas.</p><div className="photo-add-areas" aria-label="Add an area">{photoLayoutKinds.map(kind => <button type="button" key={kind} className="seasonal-outline rounded-lg border px-3 py-2" disabled={areas.length >= PHOTO_LAYOUT_MAX_ITEMS} onClick={() => add(kind)}>+ {kind}</button>)}</div>{areas.length === 0 && <p role="status">No clear structures found. Add a bed, container, path or border to begin.</p>}</div>
      <div className="photo-area-details"><label>Selected area<select aria-label="Selected area" value={selected} onChange={e => setSelected(e.target.value)}><option value="">Choose an area</option>{areas.map((a, i) => <option key={a.id} value={a.id}>{i+1} · {a.name}</option>)}</select></label>
        {item ? <><label>Area name<input maxLength={80} value={item.name} onChange={e => change({ name: e.target.value })} /></label><label>Area type<select value={item.kind} onChange={e => change({ kind: e.target.value as Area["kind"] })}>{photoLayoutKinds.map(kind => <option key={kind}>{kind}</option>)}</select></label><div className="photo-geometry">{([['x','Left'],['y','Top'],['w','Width'],['h','Height']] as const).map(([key,label]) => <label key={key}>{label} (%)<input type="number" min={key === "w" || key === "h" ? 4 : 0} max={100} step="0.1" value={Math.round(item[key]*10)/10} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n)) change({ [key]: n }); }} /></label>)}</div><button type="button" className="photo-remove-area" onClick={() => { setAreas(areas.filter(a => a.id !== selected)); setSelected(""); setReviewed(false); }}>Remove this area</button></> : <p>Select a numbered area on the photo, or add one.</p>}
      </div></div>
      <div className="photo-save-details"><label>Layout name<input maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label><div className="photo-measurements"><label>Garden width (feet, optional)<input type="number" min="0.1" max="10000" step="any" value={width} onChange={e => setWidth(e.target.value)} /></label><label>Garden depth (feet, optional)<input type="number" min="0.1" max="10000" step="any" value={depth} onChange={e => setDepth(e.target.value)} /></label></div><p className="photo-small">Your measurements are kept as a reference. The photo map is not a scale drawing.</p><label>Notes about this space<textarea maxLength={1200} rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Afternoon shade, a gate to keep clear, or something to check later…" /></label>
      <label className="photo-check"><input type="checkbox" checked={keepPhoto} onChange={e => setKeepPhoto(e.target.checked)} />Keep a small copy of this photo with my layout</label><p className="photo-small">The reference photo follows the layout’s account sync. Your original isn’t added to your picture gallery.</p>
      <label className="photo-check"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />I’ve reviewed the areas and understand the spacing is approximate.</label>
      <div className="photo-upload-actions"><button type="button" className="seasonal-button rounded-xl px-5 py-3" disabled={!reviewed || !areas.length || !name.trim()} onClick={save}>Create editable layout →</button><button type="button" className="seasonal-outline rounded-xl border px-4 py-3" onClick={() => { setStep("upload"); setError(""); }}>Choose another photo</button></div><p className="photo-small">This creates a separate layout. Growing spaces are added to My Gardens only when you choose Create growing spaces in the editor.</p></div>
    </>}
    {busy && <div role="status" className="photo-status">{busy} {busy.startsWith("Finding") && <button type="button" onClick={markManually}>Cancel scan & mark myself</button>}</div>}
    {error && <p role="alert" className="photo-error">{error}</p>}
  </section>;
}

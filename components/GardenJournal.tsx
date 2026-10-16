"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Dialog from "@/components/ui/Dialog";
import { readDetails, type Entry, type Space, type SpaceDetails } from "@/lib/garden";
import { localDay } from "@/lib/growing-calendar";
import { harvestTotals } from "@/lib/connected-garden";

const Pictures = dynamic(() => import("@/components/PhotoJournal"), { loading: () => <p className="seasonal-muted py-8 text-sm">Opening pictures…</p> });
const tabs = ["Journal", "Photos", "Stories"] as const;
const tabLabels = { Journal: "Observations", Photos: "Photos", Stories: "Journal" } as const;
type Tab = typeof tabs[number];
type JournalEntry = Entry & { space: Space };
function initialTab(): Tab {
  if (typeof window === "undefined") return "Journal";
  const value = new URLSearchParams(window.location.search).get("journalTab");
  return tabs.find(tab => tab.toLowerCase() === value) || "Journal";
}
function entriesIn(spaces: Space[]): JournalEntry[] {
  return spaces.flatMap(space => {
    try { return readDetails(space.notes).entries.map(entry => ({ ...entry, space })); }
    catch { return []; }
  }).sort((a, b) => b.date.localeCompare(a.date));
}
function dayLabel(date: string) {
  const value = new Date(`${date}T12:00:00`);
  return Number.isNaN(value.valueOf()) ? date : value.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
const button = "seasonal-button min-h-11 rounded-lg px-4 py-2 text-sm font-semibold";
const outline = "seasonal-outline min-h-11 rounded-lg border px-4 py-2 text-sm";
const input = "w-full rounded-lg border border-[var(--border)] p-3";

export default function GardenJournal({ userId, gardenName, spaces, historySpaces, busy, onSave }: {
  userId: string; gardenName?: string; spaces: Space[]; historySpaces?: Space[]; busy: boolean;
  onSave: (space: Space, details: SpaceDetails) => Promise<boolean>;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [composer, setComposer] = useState<"entry" | "story" | null>(null);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [reading, setReading] = useState<JournalEntry | null>(null);
  const [addingPictures, setAddingPictures] = useState(false);
  const [activity, setActivity] = useState<Entry["kind"]>("Note");
  const [message, setMessage] = useState("");
  const rows = entriesIn(historySpaces || spaces);
  const notes = rows.filter(row => row.format !== "story");
  const stories = rows.filter(row => row.format === "story");
  const days = [...new Set(notes.map(row => row.date))];
  const harvests = harvestTotals(notes);
  useEffect(() => {
    const restore = () => setTab(initialTab());
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  function chooseTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "Journal") url.searchParams.delete("journalTab");
    else url.searchParams.set("journalTab", next.toLowerCase());
    window.history.replaceState(null, "", url);
  }
  function writeStory(entry?: JournalEntry) {
    setEditing(entry || null); setComposer("story"); chooseTab("Stories");
  }
  const targetSpaces = editing && !spaces.some(space => space.id === editing.space.id) ? [editing.space, ...spaces] : spaces;
  return <section className="interior-page journal-page">
    <header className="mb-7 rounded-2xl border border-[var(--border)] bg-[#fffdf7] px-6 py-7 sm:px-9 sm:py-9">
      <p className="mb-3 text-xs uppercase tracking-[0.18em]" style={{ color: "var(--sidebar-start)" }}>{gardenName || "Your garden"} · A growing diary</p>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><h1 className="font-serif text-4xl tracking-tight sm:text-5xl">Garden Journal</h1><p className="seasonal-muted mt-3 max-w-lg text-sm leading-relaxed">The little discoveries. The longer stories. A place to remember your garden as it grows.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={() => { setEditing(null); setActivity("Note"); setComposer("entry"); }}>Add observation</button><button type="button" className={outline} onClick={() => { chooseTab("Photos"); setAddingPictures(open => !open); }}>Add pictures</button></div>
      </div>
      <p className="seasonal-muted mt-6 text-xs">{notes.length} {notes.length === 1 ? "observation" : "observations"} <span className="mx-2">·</span> {stories.length} journal {stories.length === 1 ? "entry" : "entries"} <span className="mx-2">·</span> {new Set(rows.map(row => row.date.slice(0, 4))).size} seasons remembered</p>
    </header>
    <div role="tablist" aria-label="Journal views" className="mb-8 flex gap-7 border-b border-[var(--border)]">{tabs.map(name => <button key={name} id={`journal-tab-${name}`} type="button" role="tab" aria-selected={tab === name} aria-controls={`journal-panel-${name}`} className="min-h-12 border-b-2 px-1 pb-3 text-sm" style={{ borderColor: tab === name ? "var(--sidebar-start)" : "transparent", color: tab === name ? "var(--sidebar-start)" : "var(--muted)", fontWeight: tab === name ? 650 : 400 }} onClick={() => chooseTab(name)}>{tabLabels[name]}</button>)}</div>
    {message && <p role="status" className="interior-notice">{message}</p>}
    <div role="tabpanel" id={`journal-panel-${tab}`} aria-labelledby={`journal-tab-${tab}`}>
      {tab === "Journal" && <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4"><div><h2 className="font-serif text-2xl">Notes from the garden</h2><p className="seasonal-muted mt-1 text-sm">One day, one discovery at a time.</p></div><button type="button" className="seasonal-link min-h-11 text-sm underline" onClick={() => writeStory()}>Write in your journal →</button></div>
        {!notes.length && <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[#fffdf7] p-10 text-center"><p className="font-serif text-2xl">What did you notice today?</p><p className="seasonal-muted mx-auto mt-3 max-w-sm text-sm leading-relaxed">A new leaf, the first ripe tomato, a lesson for next spring. Your garden’s story starts here.</p><button type="button" className={`${outline} mt-5`} onClick={() => { setEditing(null); setComposer("entry"); }}>Add your first observation</button></div>}
        {days.map(day => <section key={day} className="mb-8"><h3 className="seasonal-muted mb-3 text-xs uppercase tracking-widest"><time dateTime={day}>{dayLabel(day)}</time></h3><div className="space-y-3">{notes.filter(row => row.date === day).map(entry => <article key={`${entry.space.id}-${entry.id}`} className="rounded-xl border border-[var(--border)] bg-white p-5 sm:p-6"><div className="mb-3 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full px-3 py-1" style={{ background: "color-mix(in srgb, var(--sidebar-start) 9%, white)", color: "var(--sidebar-start)" }}>{entry.kind === "Note" ? "Observation" : entry.kind}</span><span className="seasonal-muted">{entry.space.name}</span></div><p className="whitespace-pre-wrap break-words text-sm leading-7">{entry.text}</p>{entry.quantity && <p className="mt-3 text-sm font-semibold">Harvested {entry.quantity} {entry.unit} {entry.plantId || ""}</p>}</article>)}</div></section>)}
        <details className="vault-backup-tools mt-8 border-t border-[var(--border)] pt-3"><summary>Harvest comparison · {notes.filter(row => row.kind === "Harvest" && row.quantity).length} measured harvests</summary>{harvests.length ? <div className="overflow-x-auto py-4"><table className="harvest-table w-full text-sm"><thead><tr><th>Season</th><th>Plant / variety</th><th>Yield</th><th>Harvests</th></tr></thead><tbody>{harvests.map(total => <tr key={`${total.year}-${total.plant}-${total.unit}`}><td>{total.year}</td><td>{total.plant}</td><td>{Number(total.quantity.toFixed(2))} {total.unit}</td><td>{total.harvests}</td></tr>)}</tbody></table></div> : <p className="seasonal-muted py-4 text-sm">Record quantities with harvest entries to compare yields across seasons.</p>}</details>
      </div>}
      {tab === "Photos" && <Pictures userId={userId} embedded showComposer={addingPictures} />}
      {tab === "Stories" && <div className="mx-auto max-w-4xl"><div className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-serif text-2xl">Your garden journal</h2><p className="seasonal-muted mt-2 text-sm">Room for the details, lessons, and plans you want to keep.</p></div><button type="button" className={button} onClick={() => writeStory()}>Write an entry</button></div>
        {!stories.length ? <div className="rounded-2xl border border-[var(--border)] bg-[#fffdf7] p-8 sm:p-12"><p className="text-xs uppercase tracking-widest" style={{ color: "var(--sidebar-start)" }}>A page of your own</p><h3 className="mt-4 max-w-lg font-serif text-3xl leading-tight">Some garden moments need more than a quick note.</h3><p className="seasonal-muted mt-4 max-w-lg text-sm leading-7">Write about starting your seedlings, a season’s surprises, or what you hope to grow next year. These entries stay in your private garden journal.</p><button type="button" className={`${outline} mt-6`} onClick={() => writeStory()}>Write your first journal entry →</button></div> : <div className="grid gap-5 md:grid-cols-2">{stories.map(entry => <article key={`${entry.space.id}-${entry.id}`} className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-7"><p className="seasonal-muted text-xs"><time dateTime={entry.date}>{dayLabel(entry.date)}</time> · {Math.max(1, Math.ceil(entry.text.split(/\s+/).length / 200))} min read</p><h3 className="mt-4 break-words font-serif text-2xl leading-snug"><button type="button" className="text-left hover:underline" onClick={() => setReading(entry)}>{entry.title || "A journal entry"}</button></h3><p className="seasonal-muted mt-4 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-7">{entry.text}</p><p className="seasonal-muted mt-4 text-xs">{entry.space.name}</p><div className="mt-auto flex items-center justify-between gap-3 pt-5"><button type="button" className="seasonal-link min-h-11 text-sm underline" onClick={() => setReading(entry)}>Read entry →</button><button type="button" className="seasonal-link min-h-11 text-sm" onClick={() => writeStory(entry)}>Edit entry</button></div></article>)}</div>}
      </div>}
    </div>
    {composer && <Dialog title={composer === "story" ? (editing ? "Edit journal entry" : "Write a journal entry") : "Add observation"} onClose={() => { if (!busy) { setComposer(null); setEditing(null); } }}>
      <form key={editing?.id || composer} onSubmit={async event => {
        event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form);
        const space = targetSpaces.find(item => item.id === fields.get("space"));
        if (!space) return;
        const text = String(fields.get("text") || "").trim(); if (!text) return;
        const quantity = fields.get("quantity") ? Number(fields.get("quantity")) : undefined;
        if (quantity !== undefined && (!Number.isFinite(quantity) || quantity <= 0)) return;
        const entry: Entry = { id: editing?.id || crypto.randomUUID(), kind: composer === "story" ? "Note" : activity, date: String(fields.get("date")), text,
          ...(composer === "story" ? { format: "story" as const, title: String(fields.get("title") || "").trim() } : {}),
          ...(quantity && activity === "Harvest" && composer !== "story" ? { quantity, unit: String(fields.get("unit")), plantId: String(fields.get("plant") || "") } : {}) };
        try {
          const data = readDetails(space.notes);
          const saved = await onSave(space, { ...data, entries: editing ? data.entries.map(item => item.id === editing.id ? entry : item) : [entry, ...data.entries] });
          if (saved) { setMessage(composer === "story" ? "Your entry is saved in your private journal." : "Observation saved."); chooseTab(composer === "story" ? "Stories" : "Journal"); setComposer(null); setEditing(null); }
          else setMessage("Could not save. Your writing is still here; please try again.");
        } catch { setMessage("Could not save. Your writing is still here; please try again."); }
      }}>
        <fieldset disabled={busy || !targetSpaces.length} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm">Growing space<select className={input} name="space" defaultValue={editing?.space.id} disabled={!!editing} required>{targetSpaces.map(space => <option key={space.id} value={space.id}>{space.name}</option>)}</select>{editing && <input type="hidden" name="space" value={editing.space.id} />}</label><label className="grid gap-2 text-sm">Date<input className={input} type="date" name="date" defaultValue={editing?.date || localDay()} required /></label></div>
          {composer === "story" ? <label className="grid gap-2 text-sm">Entry title<input className={`${input} font-serif text-xl`} name="title" maxLength={200} required defaultValue={editing?.title || ""} placeholder="A little victory in the garden" /></label> : <label className="grid gap-2 text-sm">Activity<select className={input} value={activity} onChange={e => setActivity(e.target.value as Entry["kind"])}>{["Note", "Watering", "Harvest", "Pests"].map(kind => <option key={kind}>{kind}</option>)}</select></label>}
          {composer === "entry" && activity === "Harvest" && <div className="grid gap-4 sm:grid-cols-3"><label className="grid gap-2 text-sm">Plant / variety<input className={input} name="plant" placeholder="Roma tomato" /></label><label className="grid gap-2 text-sm">Quantity (optional)<input className={input} name="quantity" type="number" min="0.01" step="any" /></label><label className="grid gap-2 text-sm">Unit<select className={input} name="unit">{["lb", "oz", "kg", "g", "count"].map(unit => <option key={unit}>{unit}</option>)}</select></label></div>}
          <label className="grid gap-2 text-sm">{composer === "story" ? "Your entry" : "Observation"}<textarea className={`${input} resize-y leading-7`} name="text" required rows={composer === "story" ? 16 : 5} maxLength={composer === "story" ? 50000 : 5000} defaultValue={editing?.text || ""} placeholder={composer === "story" ? "Take your time. What happened, what did you learn, and what do you want to remember?" : "What did you notice in the garden?"} /></label>
          <p className="seasonal-muted text-xs">{composer === "story" ? "Private to your journal. Write freely, with paragraphs and up to 50,000 characters." : "A small note today can be a useful lesson next season."}</p>
          <button type="submit" className={button}>{busy ? "Saving…" : composer === "story" ? "Save journal entry" : "Save observation"}</button>
        </fieldset>
        {!targetSpaces.length && <p className="seasonal-muted mt-4 text-sm">Add a growing space in My Gardens to give your journal entries a home.</p>}
        {message && <p role="status" className="mt-4 text-sm">{message}</p>}
      </form>
    </Dialog>}
    {reading && <Dialog title={reading.title || "A journal entry"} onClose={() => setReading(null)}><p className="seasonal-muted mb-6 text-xs">{dayLabel(reading.date)} · {reading.space.name}</p><div className="space-y-5">{reading.text.split(/\n\s*\n/).map((paragraph, index) => <p key={index} className="whitespace-pre-wrap break-words text-base leading-8">{paragraph}</p>)}</div><button type="button" className={`${outline} mt-7`} onClick={() => { setReading(null); writeStory(reading); }}>Edit entry</button></Dialog>}
  </section>;
}

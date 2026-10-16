"use client";
import { useEffect, useRef, useState } from "react";
import InteriorHeader from "@/components/InteriorHeader";
import Dialog from "@/components/ui/Dialog";
import { localDay } from "@/lib/growing-calendar";

type PhotoInfo = { name: string; description: string; date: string; category: string; folderId: string };
type PhotoEntry = { id: string; date: string; category: string; caption: string; plant: string; bed: string; photos: Blob[]; photoDetails?: Record<string, PhotoInfo> };
type Folder = { id: string; name: string };
type Picture = { key: string; entry: PhotoEntry; index: number; blob: Blob; info: PhotoInfo };
const categories = ["My Garden", "Seedlings", "Harvests", "Flowers", "Plant Progress"];
const database = "garden-os-photo-journal-v1";
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Upgrade the existing database in place; all original photo blobs stay intact.
    const request = indexedDB.open(database, 2);
    request.onupgradeneeded = () => {
      for (const name of ["entries", "folders"]) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: "id" });
    };
    request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Close other Garden OS tabs and try again to update photo storage."));
  });
}
async function transact<T>(storeName: "entries" | "folders", mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = action(tx.objectStore(storeName));
    // A successful request is not yet a committed save.
    tx.oncomplete = () => { db.close(); resolve(request.result); };
    tx.onabort = () => { db.close(); reject(tx.error || request.error || new Error("Photo storage transaction failed.")); };
    tx.onerror = () => { db.close(); reject(tx.error || request.error); };
  });
}
function pictureInfo(entry: PhotoEntry, index: number): PhotoInfo {
  return entry.photoDetails?.[String(index)] ?? { name: entry.plant || `Garden photo ${index + 1}`, description: entry.caption || "", date: entry.date, category: entry.category, folderId: "" };
}
function usePhotoUrl(blob: Blob) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(blob);
    let active = true;
    Promise.resolve().then(() => { if (active) setUrl(next); });
    return () => { active = false; URL.revokeObjectURL(next); };
  }, [blob]);
  return url;
}
function PhotoCard({ picture, folders, selected, busy, onSelect, onSave, onDelete }: { picture: Picture; folders: Folder[]; selected: boolean; busy: boolean; onSelect: () => void; onSave: (info: PhotoInfo) => Promise<boolean>; onDelete: () => void }) {
  const url = usePhotoUrl(picture.blob);
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [draft, setDraft] = useState(picture.info);
  const label = picture.info.name || "Garden photo";
  return <article className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
    <div className="relative bg-[var(--surface-alt)]">
      <button type="button" className="block aspect-[4/3] w-full" aria-label={`View ${label}`} onClick={() => setViewing(true)}>
        {/* Blob URLs are local originals; retain the full picture without cropping. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt={picture.info.description || label} className="h-full w-full object-contain" loading="lazy" />}
      </button>
      <label className="absolute left-2 top-2 flex items-center gap-2 rounded-lg bg-white/95 px-2 py-1 text-xs text-[#233b2d]">
        <input type="checkbox" checked={selected} disabled={busy} onChange={onSelect} aria-label={`Select ${label}`} /> Select
      </label>
    </div>
    <div className="p-4">
      <h3 className="break-words font-semibold"><button type="button" className="text-left hover:underline" aria-label={`Edit name and description for ${label}`} onClick={() => { setDraft(picture.info); setEditing(true); }}>{label}</button></h3>
      <p className="seasonal-muted mt-1 text-xs">{picture.info.date} · {picture.info.category}</p>
      {picture.info.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm">{picture.info.description}</p>}
      {(picture.entry.plant || picture.entry.bed) && <p className="seasonal-muted mt-2 text-xs">{[picture.entry.plant, picture.entry.bed].filter(Boolean).join(" · ")}</p>}
      {picture.info.folderId && <p className="seasonal-muted mt-2 text-xs">Folder: {folders.find(f => f.id === picture.info.folderId)?.name || "Unfiled"}</p>}
      {editing && <form className="mt-4" onSubmit={async e => { e.preventDefault(); if (await onSave(draft)) setEditing(false); }}>
        <fieldset disabled={busy} className="grid gap-3 text-sm">
          <label className="grid gap-1">Photo name<input required maxLength={150} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="grid gap-1">Description<textarea rows={3} maxLength={5000} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
          <label className="grid gap-1">Photo date<input type="date" required value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></label>
          <label className="grid gap-1">Photo category<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="grid gap-1">Photo folder<select value={draft.folderId} onChange={e => setDraft({ ...draft, folderId: e.target.value })}><option value="">Unfiled</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
          <div className="flex flex-wrap gap-2"><button type="submit" className="seasonal-button rounded-lg px-3 py-2">Save details</button><button type="button" className="seasonal-outline rounded-lg border px-3 py-2" onClick={() => setEditing(false)}>Cancel</button></div>
        </fieldset>
      </form>}
      {selected && <button type="button" disabled={busy} className="mt-3 block min-h-10 text-xs text-red-800 underline" onClick={onDelete}>Delete picture</button>}
    </div>
    {viewing && <Dialog title={label} onClose={() => setViewing(false)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={picture.info.description || label} className="max-h-[70vh] w-full object-contain" />
      {picture.info.description && <p className="mt-3 whitespace-pre-wrap text-sm">{picture.info.description}</p>}
    </Dialog>}
  </article>;
}
export default function PhotoJournal({ userId, embedded = false, showComposer = true }: { userId: string; embedded?: boolean; showComposer?: boolean }) {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [category, setCategory] = useState("My Garden");
  const [filter, setFilter] = useState("All");
  const [year, setYear] = useState("All");
  const [activeFolder, setActiveFolder] = useState("all");
  const [uploadFolder, setUploadFolder] = useState("");
  const [caption, setCaption] = useState("");
  const [plant, setPlant] = useState("");
  const [bed, setBed] = useState("");
  const [date, setDate] = useState(localDay);
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [folderForm, setFolderForm] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [moveFolder, setMoveFolder] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([transact<PhotoEntry[]>("entries", "readonly", store => store.getAll()), transact<Folder[]>("folders", "readonly", store => store.getAll())]).then(([all, savedFolders]) => {
      if (!active) return;
      setEntries(all.filter(e => e.id.startsWith(userId + ":")));
      setFolders(savedFolders.filter(f => f.id.startsWith(userId + ":")));
      setLoaded(true);
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Photo storage is unavailable in this browser."); });
    return () => { active = false; };
  }, [userId]);
  const pictures: Picture[] = entries.flatMap(entry => entry.photos.map((blob, index) => ({ key: `${entry.id}/${index}`, entry, index, blob, info: pictureInfo(entry, index) })));
  const visible = pictures.filter(p => (filter === "All" || p.info.category === filter) && (year === "All" || p.info.date.startsWith(year)) && (activeFolder === "all" || p.info.folderId === (activeFolder === "unfiled" ? "" : activeFolder))).sort((a, b) => b.info.date.localeCompare(a.info.date));
  const years = [...new Set(pictures.map(p => p.info.date.slice(0, 4)))].sort().reverse();
  async function save() {
    if (!photos.length) return setError("Choose at least one photo.");
    if (photos.some(file => !file.type.startsWith("image/"))) return setError("Please choose image files only.");
    setSaving(true); setError(""); setNotice("");
    try {
      const entry: PhotoEntry = { id: userId + ":" + crypto.randomUUID(), date, category, caption, plant, bed, photos: [...photos], photoDetails: Object.fromEntries(photos.map((file, index) => [String(index), { name: file.name.replace(/\.[^.]+$/, "") || `Garden photo ${index + 1}`, description: caption, date, category, folderId: uploadFolder }])) };
      await transact("entries", "readwrite", store => store.put(entry));
      setEntries(current => [entry, ...current]); setPhotos([]); setCaption(""); setPlant(""); setBed("");
      setActiveFolder(uploadFolder || "all"); setFilter("All"); setYear("All");
      setNotice(`${entry.photos.length} pictures saved. Click a picture’s name to edit its name or description.`);
      if (fileInput.current) fileInput.current.value = "";
    } catch { setError("Could not save photos. Check your browser storage space."); }
    finally { setSaving(false); }
  }
  async function updatePictures(changes: { picture: Picture; info: PhotoInfo }[], successMessage?: string) {
    setSaving(true); setError(""); setNotice("");
    try {
      const updated = new Map<string, PhotoEntry>();
      for (const { picture, info } of changes) {
        const entry = updated.get(picture.entry.id) || picture.entry;
        updated.set(entry.id, { ...entry, photoDetails: { ...entry.photoDetails, [String(picture.index)]: info } });
      }
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("entries", "readwrite");
        for (const entry of updated.values()) tx.objectStore("entries").put(entry);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onabort = () => { db.close(); reject(tx.error); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      });
      setEntries(current => current.map(entry => updated.get(entry.id) || entry));
      setNotice(successMessage ?? (changes.length === 1 ? "Picture details saved." : `${changes.length} pictures moved.`));
      return true;
    } catch { setError("Could not save changes. Please try again."); return false; }
    finally { setSaving(false); }
  }
  async function deletePicture(picture: Picture) {
    if (!window.confirm("Delete this picture? This cannot be undone.")) return;
    setSaving(true); setError("");
    try {
      const entry = picture.entry;
      const remaining = entry.photos.filter((_, index) => index !== picture.index);
      const photoDetails = Object.fromEntries(entry.photos.flatMap((_, index) => index === picture.index ? [] : [[String(index > picture.index ? index - 1 : index), pictureInfo(entry, index)]]));
      const updated = { ...entry, photos: remaining, photoDetails };
      if (remaining.length) await transact("entries", "readwrite", store => store.put(updated));
      else await transact("entries", "readwrite", store => store.delete(entry.id));
      setEntries(current => remaining.length ? current.map(e => e.id === entry.id ? updated : e) : current.filter(e => e.id !== entry.id));
      setSelected([]); setNotice("Picture deleted.");
    } catch { setError("Could not delete picture. Please try again."); }
    finally { setSaving(false); }
  }
  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) return setError("A folder with this name already exists.");
    setSaving(true); setError("");
    try {
      const folder = { id: userId + ":" + crypto.randomUUID(), name };
      await transact("folders", "readwrite", store => store.put(folder));
      setFolders(current => [...current, folder]); setFolderName(""); setFolderForm(false); setUploadFolder(folder.id); setMoveFolder(folder.id);
      setNotice(`Folder “${name}” created. Select pictures and use Move selected to put them here.`);
    } catch { setError("Could not create folder. Please try again."); }
    finally { setSaving(false); }
  }
  return <section className={embedded ? "photo-journal-page" : "interior-page photo-journal-page"}>
    {embedded ? <div className="mb-4"><h2 className="font-serif text-2xl">Pictures</h2><p className="seasonal-muted mt-2 text-sm">Your garden, one picture at a time.</p></div> : <InteriorHeader eyebrow="Your garden in pictures" title="Photo Journal" description="Seedlings, blooms, harvests, and every stage in between." />}
    <p className="seasonal-muted mb-5 text-xs">Photos are saved on this device for now and are not synced to your account.</p>
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="interior-notice">{notice}</p>}
    {showComposer && <form className="modern-card mb-7" onSubmit={e => { e.preventDefault(); void save(); }}>
      <h3 className="mb-4 font-serif text-2xl">Add pictures</h3>
      <fieldset disabled={saving || !loaded} className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">Photos (select multiple)<input ref={fileInput} type="file" accept="image/*" multiple required onChange={e => setPhotos(Array.from(e.target.files || []))} /></label>
        <label className="grid gap-2 text-sm">Folder<select value={uploadFolder} onChange={e => setUploadFolder(e.target.value)}><option value="">Unfiled</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Category<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Date<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
        <label className="grid gap-2 text-sm">Plant name (optional)<input value={plant} onChange={e => setPlant(e.target.value)} /></label>
        <label className="grid gap-2 text-sm">Garden bed (optional)<input value={bed} onChange={e => setBed(e.target.value)} /></label>
        <label className="grid gap-2 text-sm sm:col-span-2">Description for this upload (optional)<textarea rows={2} maxLength={5000} value={caption} onChange={e => setCaption(e.target.value)} /><span className="seasonal-muted text-xs">You can edit each picture’s name and description after uploading.</span></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button type="submit" className="seasonal-button rounded-lg px-5 py-3">{saving ? "Saving…" : `Save ${photos.length || ""} pictures`}</button>{photos.length > 0 && <span className="text-sm">{photos.length} selected</span>}</div>
      </fieldset>
    </form>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-serif text-xl">Folders</h3><button type="button" disabled={saving || !loaded} className="seasonal-outline rounded-lg border px-3 py-2 text-sm" onClick={() => setFolderForm(open => !open)} aria-expanded={folderForm}>+ New folder</button></div>
    {folderForm && <form onSubmit={createFolder} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border)] p-4"><label className="grid flex-1 gap-2 text-sm">Folder name<input autoFocus required maxLength={100} disabled={saving} value={folderName} onChange={e => setFolderName(e.target.value)} placeholder={`e.g. Seedlings — ${localDay()}`} /></label><button disabled={saving} className="seasonal-button rounded-lg px-4 py-2">Create folder</button><button type="button" className="seasonal-outline rounded-lg border px-4 py-2" onClick={() => setFolderForm(false)}>Cancel</button></form>}
    <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Picture folders">
      {[{ id: "all", name: "All pictures" }, { id: "unfiled", name: "Unfiled" }, ...folders].map(folder => <button type="button" key={folder.id} disabled={saving} aria-pressed={activeFolder === folder.id} className="flex min-h-28 flex-col items-start justify-between gap-4 rounded-xl border p-4 text-left text-sm transition-colors" style={{ borderColor: activeFolder === folder.id ? "var(--sidebar-start)" : "var(--border)", background: activeFolder === folder.id ? "color-mix(in srgb, var(--sidebar-start) 7%, white)" : "white", color: "var(--sidebar-start)" }} onClick={() => { setActiveFolder(folder.id); setSelected([]); }}><svg aria-hidden="true" width="26" height="22" viewBox="0 0 26 22" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 19V4a2 2 0 0 1 2-2h6l3 3h9a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z"/><path d="M2 8h22"/></svg><span className="break-words font-semibold">{folder.name}</span><span className="text-xs opacity-75">{pictures.filter(p => folder.id === "all" || p.info.folderId === (folder.id === "unfiled" ? "" : folder.id)).length} pictures</span></button>)}
    </div>
    <div className="mb-5 flex flex-wrap items-center gap-4"><label className="text-sm">Category <select className="ml-2" value={filter} onChange={e => { setFilter(e.target.value); setSelected([]); }}>{["All", ...categories].map(c => <option key={c}>{c}</option>)}</select></label><label className="text-sm">Year <select className="ml-2" value={year} onChange={e => { setYear(e.target.value); setSelected([]); }}>{["All", ...years].map(y => <option key={y}>{y}</option>)}</select></label><span className="seasonal-muted text-xs">{visible.length} pictures</span><button type="button" disabled={saving || !visible.length} className="seasonal-outline min-h-10 text-sm underline" onClick={() => setSelected(selected.length === visible.length ? [] : visible.map(p => p.key))}>{selected.length === visible.length && visible.length ? "Clear selection" : "Select all"}</button></div>
    {!!selected.length && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"><span className="text-sm">{selected.length} selected</span><label className="text-sm">Photo category <select disabled={saving} className="ml-2" value={bulkCategory} onChange={e => setBulkCategory(e.target.value)}><option value="">Choose category</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label><button disabled={saving || !bulkCategory} type="button" className="seasonal-button rounded-lg px-4 py-2 text-sm" onClick={async () => { const changes = pictures.filter(p => selected.includes(p.key)).map(picture => ({ picture, info: { ...picture.info, category: bulkCategory } })); if (await updatePictures(changes, `Category updated for ${changes.length} pictures.`)) setSelected([]); }}>Apply category</button><label className="text-sm">Move to <select disabled={saving} className="ml-2" value={moveFolder} onChange={e => setMoveFolder(e.target.value)}><option value="">Unfiled</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label><button disabled={saving} type="button" className="seasonal-button rounded-lg px-4 py-2 text-sm" onClick={async () => { const moved = await updatePictures(pictures.filter(p => selected.includes(p.key)).map(picture => ({ picture, info: { ...picture.info, folderId: moveFolder } }))); if (moved) setSelected([]); }}>Move selected</button></div>}
    {!loaded && !error ? <p className="seasonal-muted">Loading pictures…</p> : visible.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center"><p className="font-serif text-xl">Room for your garden memories</p><p className="seasonal-muted mt-2 text-sm">{pictures.length ? "No pictures match this folder or filter." : "Use Add pictures to start your gallery, then organize pictures into folders."}</p></div> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{visible.map(picture => <PhotoCard key={picture.key} picture={picture} folders={folders} selected={selected.includes(picture.key)} busy={saving} onSelect={() => setSelected(current => current.includes(picture.key) ? current.filter(key => key !== picture.key) : [...current, picture.key])} onSave={info => updatePictures([{ picture, info }])} onDelete={() => void deletePicture(picture)} />)}</div>}
  </section>;
}

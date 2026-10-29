"use client";
import { useEffect, useRef, useState } from "react";
import InteriorHeader from "@/components/InteriorHeader";
import Dialog from "@/components/ui/Dialog";
import { openDatabase, transact } from "@/lib/photo-local";
import { supabase } from "@/lib/supabase";
import { photoRequest, uploadCloudEntry, type PhotoInfo, type PhotoEntry, type PhotoFolder as Folder } from "@/lib/photo-cloud";
import { localDay } from "@/lib/growing-calendar";

type Picture = { key: string; entry: PhotoEntry; index: number; blob: Blob; info: PhotoInfo };
const categories = ["My Garden", "Seedlings", "Harvests", "Flowers", "Plant Progress"];
const inspirationCategories = ["Garden Layouts", "Flower Beds", "Vegetable Gardens", "Pots & Planters", "Paths & Walls", "Outdoor Living", "Colors & Plant Combinations", "Other Ideas"];
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
function PhotoCard({ picture, folders, selected, busy, categoryOptions, onSelect, onSave, onDelete }: { picture: Picture; folders: Folder[]; selected: boolean; busy: boolean; categoryOptions: string[]; onSelect: () => void; onSave: (info: PhotoInfo) => Promise<boolean>; onDelete: () => void }) {
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
      {editing && <Dialog title="Edit picture details" onClose={() => { if (!busy) setEditing(false); }}><form className="mt-4" onSubmit={async e => { e.preventDefault(); if (await onSave(draft)) setEditing(false); }}>
        <fieldset disabled={busy} className="grid gap-3 text-sm">
          <label className="grid gap-1">Photo name<input required maxLength={150} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="grid gap-1">Description<textarea rows={3} maxLength={5000} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label>
          <label className="grid gap-1">Photo date<input type="date" required value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></label>
          <label className="grid gap-1">Photo category<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{categoryOptions.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="grid gap-1">Photo folder<select value={draft.folderId} onChange={e => setDraft({ ...draft, folderId: e.target.value })}><option value="">Unfiled</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
          <div className="flex flex-wrap gap-2"><button type="submit" className="seasonal-button rounded-lg px-3 py-2">Save details</button><button type="button" className="seasonal-outline rounded-lg border px-3 py-2" onClick={() => setEditing(false)}>Cancel</button></div>
        </fieldset>
      </form></Dialog>}
      {selected && <button type="button" disabled={busy} className="mt-3 block min-h-10 text-xs text-red-800 underline" onClick={onDelete}>Delete picture</button>}
    </div>
    {viewing && <Dialog title={label} onClose={() => setViewing(false)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={picture.info.description || label} className="max-h-[70vh] w-full object-contain" />
      {picture.info.description && <p className="mt-3 whitespace-pre-wrap text-sm">{picture.info.description}</p>}
    </Dialog>}
  </article>;
}
function UploadPreview({ file }: { file: File }) {
  const url = usePhotoUrl(file);
  return <figure className="min-w-0 rounded-lg border border-[var(--border)] p-2">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url || undefined} alt={file.name} className="h-28 w-full object-contain" />
    <figcaption className="mt-2 truncate text-xs">{file.name}</figcaption>
  </figure>;
}
export default function PhotoJournal({ userId, embedded = false, showComposer = false, onCloseComposer, gardenId, gardenName }: { userId: string; embedded?: boolean; showComposer?: boolean; onCloseComposer?: () => void; gardenId?: string; gardenName?: string }) {
  const signedIn = userId !== "guest";
  const isInspiration = gardenId === "garden-inspiration";
  const categoryOptions = isInspiration ? inspirationCategories : categories;
  const [cloudStatus, setCloudStatus] = useState(signedIn ? "Checking photo backup…" : "");
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [category, setCategory] = useState(gardenId === "garden-inspiration" ? "Garden Layouts" : "My Garden");
  const [filter, setFilter] = useState("All");
  const [year, setYear] = useState("All");
  const [activeFolder, setActiveFolder] = useState(gardenId ? "all" : "folders");
  const [folderComposer, setFolderComposer] = useState(false);
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
    const inAlbum = (item: {id:string;gardenId?:string}) => item.id.startsWith(userId + ":") && (!gardenId || item.gardenId === gardenId);
    const refresh = async () => {
      try {
        const [localEntries, localFolders] = await Promise.all([transact<PhotoEntry[]>("entries", "readonly", store => store.getAll()), transact<Folder[]>("folders", "readonly", store => store.getAll())]);
        if (!active) return;
        setEntries(localEntries.filter(inAlbum)); setFolders(localFolders.filter(inAlbum)); setLoaded(!signedIn);
        if (!signedIn) return;
        try {
          const {records=[]} = await photoRequest(supabase, "GET");
          const mergedEntries = new Map(localEntries.filter(e=>e.id.startsWith(userId+":")).map(e=>[e.id,e]));
          const mergedFolders = new Map(localFolders.filter(f=>f.id.startsWith(userId+":")).map(f=>[f.id,f]));
          for (const record of records) {
            if (!active) return;
            const remote = record.value;
            if(!inAlbum(remote))continue;
            if (remote.kind === "folder") {
              const folder = {...remote, cloudVersion:record.version};
              await transact("folders", "readwrite", store=>store.put(folder)); mergedFolders.set(folder.id,folder);
            } else if (remote.deleted) {
              await transact("entries", "readwrite", store=>store.delete(remote.id)); mergedEntries.delete(remote.id);
            } else {
              const cached=mergedEntries.get(remote.id);
              const blobs: Blob[]=[];
              for(const [index,path] of remote.cloudPaths!.entries()) {
                const cachedIndex=cached?.cloudPaths?.indexOf(path) ?? -1;
                if(cachedIndex >= 0 && cached?.photos[cachedIndex]) blobs.push(cached.photos[cachedIndex]);
                else {
                  const response=await fetch(record.urls![index],{signal:AbortSignal.timeout(60000)});
                  if(!response.ok) throw Error("Could not download a picture. Your device copy is safe.");
                  blobs.push(await response.blob());
                }
              }
              const entry:PhotoEntry={...remote,photos:blobs,cloudVersion:record.version};
              await transact("entries", "readwrite", store=>store.put(entry));mergedEntries.set(entry.id,entry);
            }
          }
          if(active){setEntries([...mergedEntries.values()].filter(inAlbum));setFolders([...mergedFolders.values()].filter(inAlbum));setCloudStatus("Cloud pictures loaded. New pictures and edits sync to your account.");}
        } catch(err) {if(active)setCloudStatus(err instanceof Error ? err.message : "Cloud backup unavailable. Your device copy is safe.");}
        finally {if(active)setLoaded(true);}
      } catch(err) {if(active)setError(err instanceof Error ? err.message : "Photo storage is unavailable in this browser.");}
    };
    void refresh();
    return () => {active=false;};
  }, [userId, gardenId, signedIn]);
  async function saveFolderCloud(folder:Folder):Promise<Folder>{
    if(!signedIn)return folder;
    const {cloudVersion,...value}=folder;
    const {record}=await photoRequest(supabase,"PUT",{version:cloudVersion??0,value:{...value,kind:"folder"}});
    return {...folder,cloudVersion:record!.version};
  }
  async function backUpExisting(){
    setSaving(true);setError("");
    try{
      const savedFolders:Folder[]=[];
      for(const folder of folders){const saved=folder.cloudVersion?folder:await saveFolderCloud(folder);await transact("folders","readwrite",store=>store.put(saved));savedFolders.push(saved);}
      setFolders(savedFolders);
      for(const entry of entries.filter(e=>!e.cloudVersion)){
        const saved=await uploadCloudEntry(supabase,entry);
        await transact("entries","readwrite",store=>store.put(saved));
        setEntries(current=>current.map(e=>e.id===saved.id?saved:e));
      }
      setCloudStatus("Your pictures are backed up. Open this garden on another device using the same account.");
    }catch(err){setError(err instanceof Error?err.message:"Backup interrupted. Your device pictures are safe.");}
    finally{setSaving(false);}
  }
  const pictures: Picture[] = entries.flatMap(entry => entry.photos.map((blob, index) => ({ key: `${entry.id}/${index}`, entry, index, blob, info: pictureInfo(entry, index) })));
  const visible = pictures.filter(p => (filter === "All" || p.info.category === filter) && (year === "All" || p.info.date.startsWith(year)) && (activeFolder === "all" || p.info.folderId === (activeFolder === "unfiled" ? "" : activeFolder))).sort((a, b) => b.info.date.localeCompare(a.info.date));
  const years = [...new Set(pictures.map(p => p.info.date.slice(0, 4)))].sort().reverse();
  async function save() {
    if (!photos.length) return setError("Choose at least one photo.");
    if (photos.some(file => !file.type.startsWith("image/"))) return setError("Please choose image files only.");
    setSaving(true); setError(""); setNotice("");
    try {
      let entry: PhotoEntry = { id: userId + ":" + crypto.randomUUID(), ...(gardenId ? { gardenId, gardenName } : {}), date, category, caption, plant, bed, photos: [...photos], photoDetails: Object.fromEntries(photos.map((file, index) => [String(index), { name: file.name.replace(/\.[^.]+$/, "") || `Garden photo ${index + 1}`, description: caption, date, category, folderId: uploadFolder }])) };
      await transact("entries", "readwrite", store => store.put(entry));
      if(signedIn){
        try{entry=await uploadCloudEntry(supabase,entry);await transact("entries","readwrite",store=>store.put(entry));setCloudStatus("Pictures backed up to your account.");}
        catch(err){setCloudStatus(err instanceof Error?err.message:"Cloud backup pending. Your originals are saved on this device.");}
      }
      setEntries(current => [entry, ...current]); setPhotos([]); setCaption(""); setPlant(""); setBed("");
      setActiveFolder(uploadFolder || "unfiled"); setFolderComposer(false); onCloseComposer?.(); setFilter("All"); setYear("All");
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
      if(signedIn)for(const [id,entry] of updated){updated.set(id,await uploadCloudEntry(supabase,entry));}
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
    } catch(err) { setError(err instanceof Error?err.message:"Could not save changes. Please try again."); return false; }
    finally { setSaving(false); }
  }
  async function deletePicture(picture: Picture) {
    if (!window.confirm("Delete this picture? This cannot be undone.")) return;
    setSaving(true); setError("");
    try {
      const entry = picture.entry;
      const remaining = entry.photos.filter((_, index) => index !== picture.index);
      const photoDetails = Object.fromEntries(entry.photos.flatMap((_, index) => index === picture.index ? [] : [[String(index > picture.index ? index - 1 : index), pictureInfo(entry, index)]]));
      let updated: PhotoEntry = { ...entry, photos: remaining, photoDetails, ...(entry.cloudPaths?{cloudPaths:entry.cloudPaths.filter((_,index)=>index!==picture.index)}:{}) };
      if(signedIn){
        if(remaining.length)updated=await uploadCloudEntry(supabase,updated);
        else{
          const cloud=entry.cloudVersion?entry:await uploadCloudEntry(supabase,entry);
          await photoRequest(supabase,"PUT",{version:cloud.cloudVersion,value:{id:entry.id,kind:"entry",gardenId:entry.gardenId,deleted:true}});
        }
      }
      if (remaining.length) await transact("entries", "readwrite", store => store.put(updated));
      else await transact("entries", "readwrite", store => store.delete(entry.id));
      setEntries(current => remaining.length ? current.map(e => e.id === entry.id ? updated : e) : current.filter(e => e.id !== entry.id));
      setSelected([]); setNotice("Picture deleted.");
    } catch(err) { setError(err instanceof Error?err.message:"Could not delete picture. Please try again."); }
    finally { setSaving(false); }
  }
  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) return;
    if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) return setError("A folder with this name already exists.");
    setSaving(true); setError("");
    try {
      let folder: Folder = { id: userId + ":" + crypto.randomUUID(), name, ...(gardenId ? { gardenId } : {}) };
      folder=await saveFolderCloud(folder);
      await transact("folders", "readwrite", store => store.put(folder));
      setFolders(current => [...current, folder]); setFolderName(""); setFolderForm(false); setUploadFolder(folder.id); setMoveFolder(folder.id); setActiveFolder(folder.id); setSelected([]);
      setNotice(`Folder “${name}” created. Add pictures directly here, or move existing pictures into this folder.`);
    } catch(err) { setError(err instanceof Error?err.message:"Could not create folder. Please try again."); }
    finally { setSaving(false); }
  }
  return <section className={embedded ? "photo-journal-page" : "interior-page photo-journal-page"}>
    {embedded ? <div className="mb-4"><h2 className="font-serif text-2xl">{gardenId ? "Your garden’s progress" : "Pictures"}</h2><p className="seasonal-muted mt-2 text-sm">{gardenId ? "From the first seedlings to the last harvest. Add dated pictures and return to see how this garden grew." : "Your garden, one picture at a time."}</p></div> : <InteriorHeader eyebrow={isInspiration ? "Your vision board" : "Your garden in pictures"} title={isInspiration ? "Garden Inspiration" : "Photo Journal"} description={isInspiration ? "Collect the garden ideas you love—layouts, containers, flowers, pathways, and the little details you want to try someday." : "Seedlings, blooms, harvests, and every stage in between."} />}
    <p className="seasonal-muted mb-3 text-xs">{signedIn?"Private to your account. Pictures, dates, descriptions and folders sync across devices, with a copy kept on this device.":"Guest pictures are saved in this browser on this device. Sign in to use cloud photo backup."}</p>
    {signedIn&&<p role="status" className="seasonal-muted mb-4 text-sm">{cloudStatus}</p>}
    {signedIn&&(entries.some(e=>!e.cloudVersion)||folders.some(f=>!f.cloudVersion))&&<div className="interior-notice mb-5"><p className="mb-3 text-sm">Some existing pictures or folders are only on this device. Keep them here and back them up to your account.</p><button type="button" className="seasonal-button min-h-11 rounded-lg px-4" disabled={saving} onClick={()=>void backUpExisting()}>{saving?"Backing up…":"Back up existing pictures"}</button></div>}
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="interior-notice">{notice}</p>}
    {(!embedded || gardenId) && <button type="button" className="seasonal-button mb-5 rounded-lg px-4 py-2" onClick={() => setFolderComposer(true)}>Add pictures</button>}
    {(showComposer || folderComposer) && <Dialog title={uploadFolder ? `Add pictures to ${folders.find(folder => folder.id === uploadFolder)?.name || "folder"}` : "Add pictures"} onClose={() => { if (!saving) { setFolderComposer(false); onCloseComposer?.(); setPhotos([]); setError(""); } }}>
    {error && <p role="alert" className="mb-4 text-sm text-red-800">{error}</p>}
    <form onSubmit={e => { e.preventDefault(); void save(); }}>
      {!!photos.length && <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Selected picture previews">{photos.map((file, index) => <UploadPreview key={`${file.name}-${index}`} file={file} />)}</div>}
      <fieldset disabled={saving || !loaded} className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">Photos (select multiple)<input ref={fileInput} type="file" accept="image/*" multiple required onChange={e => setPhotos(Array.from(e.target.files || []))} /></label>
        <label className="grid gap-2 text-sm">Folder<select value={uploadFolder} onChange={e => setUploadFolder(e.target.value)}><option value="">Unfiled</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Category<select value={category} onChange={e => setCategory(e.target.value)}>{categoryOptions.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Date<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
        <label className="grid gap-2 text-sm">Plant name (optional)<input value={plant} onChange={e => setPlant(e.target.value)} /></label>
        <label className="grid gap-2 text-sm">Garden bed (optional)<input value={bed} onChange={e => setBed(e.target.value)} /></label>
        <label className="grid gap-2 text-sm sm:col-span-2">Description for this upload (optional)<textarea rows={2} maxLength={5000} value={caption} onChange={e => setCaption(e.target.value)} /><span className="seasonal-muted text-xs">You can edit each picture’s name and description after uploading.</span></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button type="submit" className="seasonal-button rounded-lg px-5 py-3">{saving ? "Saving…" : `Save ${photos.length || ""} pictures`}</button>{photos.length > 0 && <span className="text-sm">{photos.length} selected</span>}</div>
      </fieldset>
    </form></Dialog>}
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-serif text-xl">Folders</h3><button type="button" disabled={saving || !loaded} className="seasonal-outline rounded-lg border px-3 py-2 text-sm" onClick={() => setFolderForm(open => !open)} aria-expanded={folderForm}>+ New folder</button></div>
    {folderForm && <Dialog title="New picture folder" onClose={() => { if (!saving) setFolderForm(false); }}>{error && <p role="alert" className="text-sm text-red-800">{error}</p>}<form onSubmit={createFolder} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border)] p-4"><label className="grid flex-1 gap-2 text-sm">Folder name<input autoFocus required maxLength={100} disabled={saving} value={folderName} onChange={e => setFolderName(e.target.value)} placeholder={`e.g. Seedlings — ${localDay()}`} /></label><button disabled={saving} className="seasonal-button rounded-lg px-4 py-2">Create folder</button><button type="button" className="seasonal-outline rounded-lg border px-4 py-2" onClick={() => setFolderForm(false)}>Cancel</button></form></Dialog>}
    <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Picture folders">
      {[{ id: "unfiled", name: "Unfiled" }, ...folders].map(folder => <div key={folder.id} className="rounded-xl border bg-white p-4" style={{ borderColor: activeFolder === folder.id ? "var(--sidebar-start)" : "var(--border)" }}>
        <button type="button" disabled={saving} aria-pressed={activeFolder === folder.id} className="flex min-h-24 w-full flex-col items-start gap-3 text-left text-sm" style={{ color: "var(--sidebar-start)" }} onClick={() => { setActiveFolder(folder.id); setUploadFolder(folder.id === "unfiled" ? "" : folder.id); setSelected([]); setFilter("All"); setYear("All"); }}>
          <svg aria-hidden="true" width="26" height="22" viewBox="0 0 26 22" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 19V4a2 2 0 0 1 2-2h6l3 3h9a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z"/><path d="M2 8h22"/></svg>
          <span className="break-words font-semibold">{folder.name}</span><span className="seasonal-muted text-xs">{pictures.filter(p => p.info.folderId === (folder.id === "unfiled" ? "" : folder.id)).length} pictures</span>
        </button>
        <button type="button" disabled={saving || !loaded} aria-label={`Add pictures to ${folder.name}`} className="seasonal-outline mt-4 rounded-lg border px-3 py-2 text-sm" onClick={() => { setUploadFolder(folder.id === "unfiled" ? "" : folder.id); setActiveFolder(folder.id); setSelected([]); setFolderComposer(true); }}>Add pictures</button>
      </div>)}
    </div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><button type="button" className="seasonal-link min-h-11 text-sm underline" onClick={() => { setActiveFolder(activeFolder === "all" ? "folders" : "all"); setSelected([]); setFilter("All"); setYear("All"); }}>{activeFolder === "all" ? "Back to folders" : "Show all pictures"}</button>{activeFolder !== "folders" && <h3 className="font-serif text-xl">{activeFolder === "all" ? (gardenId ? "This garden’s pictures" : "All pictures") : activeFolder === "unfiled" ? "Unfiled" : folders.find(folder => folder.id === activeFolder)?.name}</h3>}</div>
    {activeFolder !== "folders" && <>
    <div className="mb-5 flex flex-wrap items-center gap-4"><label className="text-sm">Category <select className="ml-2" value={filter} onChange={e => { setFilter(e.target.value); setSelected([]); }}>{["All", ...categoryOptions].map(c => <option key={c}>{c}</option>)}</select></label><label className="text-sm">Year <select className="ml-2" value={year} onChange={e => { setYear(e.target.value); setSelected([]); }}>{["All", ...years].map(y => <option key={y}>{y}</option>)}</select></label><span className="seasonal-muted text-xs">{visible.length} pictures</span><button type="button" disabled={saving || !visible.length} className="seasonal-outline min-h-10 text-sm underline" onClick={() => setSelected(selected.length === visible.length ? [] : visible.map(p => p.key))}>{selected.length === visible.length && visible.length ? "Clear selection" : "Select all"}</button></div>
    {!!selected.length && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"><span className="text-sm">{selected.length} selected</span><label className="text-sm">Photo category <select disabled={saving} className="ml-2" value={bulkCategory} onChange={e => setBulkCategory(e.target.value)}><option value="">Choose category</option>{categoryOptions.map(c => <option key={c}>{c}</option>)}</select></label><button disabled={saving || !bulkCategory} type="button" className="seasonal-button rounded-lg px-4 py-2 text-sm" onClick={async () => { const changes = pictures.filter(p => selected.includes(p.key)).map(picture => ({ picture, info: { ...picture.info, category: bulkCategory } })); if (await updatePictures(changes, `Category updated for ${changes.length} pictures.`)) setSelected([]); }}>Apply category</button><label className="text-sm">Move to <select disabled={saving} className="ml-2" value={moveFolder} onChange={e => setMoveFolder(e.target.value)}><option value="">Unfiled</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label><button disabled={saving} type="button" className="seasonal-button rounded-lg px-4 py-2 text-sm" onClick={async () => { const moved = await updatePictures(pictures.filter(p => selected.includes(p.key)).map(picture => ({ picture, info: { ...picture.info, folderId: moveFolder } }))); if (moved) setSelected([]); }}>Move selected</button></div>}
    {!loaded && !error ? <p className="seasonal-muted">Loading pictures…</p> : visible.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center"><p className="font-serif text-xl">Room for your garden memories</p><p className="seasonal-muted mt-2 text-sm">{pictures.length ? "No pictures match this folder or filter." : "Use Add pictures to start your gallery, then organize pictures into folders."}</p></div> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{visible.map(picture => <PhotoCard categoryOptions={categoryOptions} key={picture.key} picture={picture} folders={folders} selected={selected.includes(picture.key)} busy={saving || !loaded} onSelect={() => setSelected(current => current.includes(picture.key) ? current.filter(key => key !== picture.key) : [...current, picture.key])} onSave={info => updatePictures([{ picture, info }])} onDelete={() => void deletePicture(picture)} />)}</div>}
    </>}
  </section>;
}

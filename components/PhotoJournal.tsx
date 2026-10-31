"use client";
import { useEffect, useRef, useState } from "react";
import InteriorHeader from "@/components/InteriorHeader";
import Dialog from "@/components/ui/Dialog";
import { openDatabase, transact } from "@/lib/photo-local";
import { supabase } from "@/lib/supabase";
import { photoRequest, uploadCloudEntry, type PhotoInfo, type PhotoEntry, type PhotoFolder as Folder } from "@/lib/photo-cloud";
import { localDay } from "@/lib/growing-calendar";

type GardenOption = { id: string; name: string };
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
function PhotoCard({ picture, folders, selected, busy, categoryOptions, inspiration = false, onSelect, onSave, onDelete, onCopyToGarden, onView }: { picture: Picture; folders: Folder[]; selected: boolean; busy: boolean; categoryOptions: string[]; inspiration?: boolean; onCopyToGarden?: () => void; onView: () => void; onSelect: () => void; onSave: (info: PhotoInfo) => Promise<boolean>; onDelete: () => void }) {
  const url = usePhotoUrl(picture.blob);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(picture.info);
  const label = picture.info.name || "Garden photo";
  return <article className={inspiration ? "mb-5 inline-block w-full break-inside-avoid overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm" : "min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]"}>
    <div className="relative bg-[var(--surface-alt)]">
      <button type="button" className={inspiration ? "block w-full" : "block aspect-[4/3] w-full"} aria-label={`View ${label}`} onClick={onView}>
        {/* Blob URLs are local originals; retain the full picture without cropping. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt={picture.info.description || label} className={inspiration ? "h-auto w-full object-cover" : "h-full w-full object-contain"} loading="lazy" />}
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
      {picture.info.folderId && <p className="seasonal-muted mt-2 text-xs">{folders.find(f => f.id === picture.info.folderId)?.name || "Unfiled"}</p>}
      {onCopyToGarden && <button type="button" disabled={busy} className="seasonal-outline mt-3 min-h-10 rounded-lg border px-3 py-2 text-sm" onClick={onCopyToGarden}>Save to My Garden</button>}
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
  </article>;
}
function GalleryViewer({ pictures, initialIndex, onClose }: { pictures: Picture[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  const current = pictures[index];
  const url = usePhotoUrl(current.blob);
  const touchStart = useRef<{x:number;y:number}|null>(null);
  const next = () => setIndex(i => Math.min(pictures.length - 1, i + 1));
  const previous = () => setIndex(i => Math.max(0, i - 1));
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") { event.preventDefault(); setIndex(i => Math.min(pictures.length - 1, i + 1)); }
      if (event.key === "ArrowLeft") { event.preventDefault(); setIndex(i => Math.max(0, i - 1)); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pictures.length]);
  return <Dialog title={current.info.name || "Garden picture"} onClose={onClose}>
    <div onTouchStart={e => { const t=e.touches[0]; touchStart.current={x:t.clientX,y:t.clientY}; }}
      onTouchEnd={e => {const start=touchStart.current;touchStart.current=null;if(!start)return;const t=e.changedTouches[0];const dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dx)>55 && Math.abs(dx)>Math.abs(dy)*1.3){if(dx<0)next();else previous();}}}>
      <div className="relative flex items-center justify-center gap-2">
        <button type="button" disabled={index===0} aria-label="Previous picture" onClick={previous} className="seasonal-outline shrink-0 rounded-full border px-3 py-3 disabled:opacity-30">←</button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={current.info.description || current.info.name} className="min-w-0 max-h-[68vh] w-full object-contain" draggable={false} />
        <button type="button" disabled={index===pictures.length-1} aria-label="Next picture" onClick={next} className="seasonal-outline shrink-0 rounded-full border px-3 py-3 disabled:opacity-30">→</button>
      </div>
      <p className="seasonal-muted mt-3 text-center text-xs">{index+1} of {pictures.length} pictures · Swipe left or right</p>
      {current.info.description && <p className="mt-3 whitespace-pre-wrap text-sm">{current.info.description}</p>}
    </div>
  </Dialog>;
}
function BoardPreview({blob, name}: {blob: Blob; name: string}) { const url = usePhotoUrl(blob); return url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : null; }
function UploadPreview({ file }: { file: File }) {
  const url = usePhotoUrl(file);
  return <figure className="min-w-0 rounded-lg border border-[var(--border)] p-2">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url || undefined} alt={file.name} className="h-28 w-full object-contain" />
    <figcaption className="mt-2 truncate text-xs">{file.name}</figcaption>
  </figure>;
}
export default function PhotoJournal({ userId, embedded = false, showComposer = false, onCloseComposer, gardenId, gardenName, gardens = [] }: { userId: string; embedded?: boolean; showComposer?: boolean; onCloseComposer?: () => void; gardenId?: string; gardenName?: string; gardens?: GardenOption[] }) {
  const signedIn = userId !== "guest";
  const isInspiration = gardenId === "garden-inspiration";
  const categoryOptions = isInspiration ? inspirationCategories : categories;
  const [cloudStatus, setCloudStatus] = useState(signedIn ? "Checking photo backup…" : "");
  const automaticBackupAttempt = useRef("");
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [category, setCategory] = useState(gardenId === "garden-inspiration" ? "Garden Layouts" : "My Garden");
  const [filter, setFilter] = useState("All");
  const [year, setYear] = useState("All");
  const [activeFolder, setActiveFolder] = useState(gardenId === "garden-inspiration" ? "folders" : gardenId ? "all" : "folders");
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
  const [renamingBoard, setRenamingBoard] = useState<Folder | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [copyPicture, setCopyPicture] = useState<Picture | null>(null);
  const [targetGarden, setTargetGarden] = useState("");
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
  // Signed-in uploads already sync immediately. Also recover existing device-only
  // pictures and boards on page load, without asking for a manual backup click.
  // Attempt each pending set once per page visit so a server outage does not
  // cause repeated uploads or a retry loop. The manual backup remains available.
  useEffect(() => {
    if (!signedIn || !loaded || saving) return;
    const pending = [...folders.filter(f => !f.cloudVersion).map(f => f.id), ...entries.filter(e => !e.cloudVersion).map(e => e.id)].sort();
    if (!pending.length) return;
    const signature = pending.join("|");
    if (automaticBackupAttempt.current === signature) return;
    automaticBackupAttempt.current = signature;
    setCloudStatus("Backing up pictures and boards automatically…");
    void backUpExisting();
  }, [signedIn, loaded, saving, entries, folders]);
  const pictures: Picture[] = entries.flatMap(entry => entry.photos.map((blob, index) => ({ key: `${entry.id}/${index}`, entry, index, blob, info: pictureInfo(entry, index) })));
  const visible = pictures.filter(p => (!isInspiration || activeFolder !== "folders") && (filter === "All" || p.info.category === filter) && (year === "All" || p.info.date.startsWith(year)) && (activeFolder === "all" || p.info.folderId === (activeFolder === "unfiled" ? "" : activeFolder))).sort((a, b) => b.info.date.localeCompare(a.info.date));
  const years = [...new Set(pictures.map(p => p.info.date.slice(0, 4)))].sort().reverse();
  async function save() {
    if (isInspiration && !folders.some(f => f.id === uploadFolder)) return setError("Create or choose a board before adding inspiration.");
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
  async function copyToGarden(e: React.FormEvent) {
    e.preventDefault();
    const target = gardens.find(g => g.id === targetGarden);
    if (!copyPicture || !target || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const info = copyPicture.info;
      // Copy the image, never move it: the original stays in Garden Inspiration.
      let entry: PhotoEntry = {
        id: userId + ":" + crypto.randomUUID(),
        gardenId: target.id, gardenName: target.name,
        date: info.date, category: "My Garden", caption: info.description,
        plant: "", bed: "", photos: [copyPicture.blob],
        photoDetails: { "0": { ...info, category: "My Garden", folderId: "" } },
      };
      await transact("entries", "readwrite", store => store.put(entry));
      if (signedIn) {
        try {
          entry = await uploadCloudEntry(supabase, entry);
          await transact("entries", "readwrite", store => store.put(entry));
          setCloudStatus("Inspiration picture copied and backed up to your account.");
        } catch (err) {
          setCloudStatus(err instanceof Error ? err.message : "Cloud backup pending. Your garden copy is saved on this device.");
        }
      }
      setCopyPicture(null); setTargetGarden("");
      setNotice(`Saved a copy of “${info.name}” to ${target.name}. The inspiration original is unchanged.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not copy the picture. Try again.");
    } finally { setSaving(false); }
  }
  async function renameBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!renamingBoard || saving) return;
    const name = newBoardName.trim();
    if (!name) return setError("Board name cannot be empty.");
    if (folders.some(f => f.id !== renamingBoard.id && f.name.toLowerCase() === name.toLowerCase())) return setError("A board with that name already exists.");
    setSaving(true); setError("");
    try {
      const updated = await saveFolderCloud({ ...renamingBoard, name });
      await transact("folders", "readwrite", store => store.put(updated));
      setFolders(current => current.map(f => f.id === updated.id ? updated : f));
      setRenamingBoard(null);
      setNotice(`Board renamed to “${name}”. All pictures remain in the board.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not rename the board."); }
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
    {embedded ? <div className="mb-4"><h2 className="font-serif text-2xl">{gardenId ? "Your garden’s progress" : "Pictures"}</h2><p className="seasonal-muted mt-2 text-sm">{gardenId ? "From the first seedlings to the last harvest. Add dated pictures and return to see how this garden grew." : "Your garden, one picture at a time."}</p></div> : isInspiration ? <header className="relative mb-7 min-h-[250px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-5 py-8 sm:min-h-[290px] sm:px-8 sm:py-12"><div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] md:block" style={{ backgroundImage: "url(/garden-inspiration-approved-scene.webp)", backgroundRepeat: "no-repeat", backgroundSize: "contain", backgroundPosition: "right bottom", maskImage: "linear-gradient(to right, transparent, black 20%)" }} /><div className="relative max-w-xl"><p className="seasonal-muted text-xs font-semibold uppercase tracking-[.2em]">Your vision board</p><h1 className="mt-3 font-serif text-4xl text-[var(--foreground)] sm:text-5xl">Garden Inspiration</h1><p className="seasonal-muted mt-4 text-sm leading-7 sm:text-base">Collect the garden ideas you love—layouts, containers, flowers, pathways, and the little details you want to try someday.</p></div></header> : <InteriorHeader eyebrow="Your garden in pictures" title="Photo Journal" description="Seedlings, blooms, harvests, and every stage in between." />}
    <p className="seasonal-muted mb-3 text-xs">{signedIn?"Private to your account. Pictures, dates, descriptions and folders sync across devices, with a copy kept on this device.":"Guest pictures are saved in this browser on this device. Sign in to use cloud photo backup."}</p>
    {signedIn&&<p role="status" className="seasonal-muted mb-4 text-sm">{cloudStatus}</p>}
    {signedIn&&(entries.some(e=>!e.cloudVersion)||folders.some(f=>!f.cloudVersion))&&<div className="interior-notice mb-5"><p className="mb-3 text-sm">Some existing pictures or folders are only on this device. Keep them here and back them up to your account.</p><button type="button" className="seasonal-button min-h-11 rounded-lg px-4" disabled={saving} onClick={()=>void backUpExisting()}>{saving?"Backing up…":"Back up existing pictures"}</button></div>}
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="interior-notice">{notice}</p>}
    {isInspiration ? <div className="relative mb-7 overflow-hidden rounded-3xl border border-[var(--border)] p-5 shadow-sm sm:p-7" style={{ background: "color-mix(in srgb, var(--sidebar-start) 13%, var(--surface))" }}>
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="max-w-xl"><p className="seasonal-muted text-xs font-semibold uppercase tracking-[.2em]">A collection of possibilities</p><h2 className="mt-2 font-serif text-2xl sm:text-3xl">Ideas worth growing into.</h2><p className="seasonal-muted mt-2 text-sm leading-6">Give every idea a home. Create a board for the garden spaces, planting combinations, and little details you hope to bring to life.</p></div>
        <button type="button" disabled={!loaded || saving} className="seasonal-button relative z-10 rounded-xl px-5 py-3" onClick={() => setFolderForm(true)}>+ Create a board</button>
      </div>
    </div> : <button type="button" className="seasonal-button mb-5 rounded-lg px-4 py-2" onClick={() => setFolderComposer(true)}>Add pictures</button>}
    {copyPicture && <Dialog title="Save inspiration to My Garden" onClose={() => { if (!saving) setCopyPicture(null); }}>
      <form className="mt-4 grid gap-4" onSubmit={e => void copyToGarden(e)}>
        <p className="text-sm">Copy “{copyPicture.info.name}” into a garden’s picture gallery. The original will remain on your inspiration board.</p>
        {gardens.length ? <label className="grid gap-2 text-sm">Choose garden<select required value={targetGarden} onChange={e => setTargetGarden(e.target.value)}><option value="">Select a garden</option>{gardens.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label> : <p role="status" className="text-sm">Create a garden under My Gardens before saving an inspiration to it.</p>}
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving || !targetGarden} className="seasonal-button rounded-lg px-4 py-2">{saving ? "Saving…" : "Save copy"}</button><button type="button" disabled={saving} className="seasonal-outline rounded-lg border px-4 py-2" onClick={() => setCopyPicture(null)}>Cancel</button></div>
      </form>
    </Dialog>}
    {(showComposer || folderComposer) && <Dialog title={uploadFolder ? `Add pictures to ${folders.find(folder => folder.id === uploadFolder)?.name || "board"}` : "Add pictures"} onClose={() => { if (!saving) { setFolderComposer(false); onCloseComposer?.(); setPhotos([]); setError(""); } }}>
    {error && <p role="alert" className="mb-4 text-sm text-red-800">{error}</p>}
    <form onSubmit={e => { e.preventDefault(); void save(); }}>
      {!!photos.length && <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Selected picture previews">{photos.map((file, index) => <UploadPreview key={`${file.name}-${index}`} file={file} />)}</div>}
      <fieldset disabled={saving || !loaded} className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">Photos (select multiple)<input ref={fileInput} type="file" accept="image/*" multiple required onChange={e => setPhotos(Array.from(e.target.files || []))} /></label>
        {isInspiration ? <label className="grid gap-2 text-sm">Board<select required value={uploadFolder} onChange={e => setUploadFolder(e.target.value)}><option value="">Select a board</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label> : <label className="grid gap-2 text-sm">Folder<select value={uploadFolder} onChange={e => setUploadFolder(e.target.value)}><option value="">Unfiled</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
        <label className="grid gap-2 text-sm">Category<select value={category} onChange={e => setCategory(e.target.value)}>{categoryOptions.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Date<input type="date" required value={date} onChange={e => setDate(e.target.value)} /></label>
        {!isInspiration && <label className="grid gap-2 text-sm">Plant name (optional)<input value={plant} onChange={e => setPlant(e.target.value)} /></label>}
        {!isInspiration && <label className="grid gap-2 text-sm">Garden bed (optional)<input value={bed} onChange={e => setBed(e.target.value)} /></label>}
        <label className="grid gap-2 text-sm sm:col-span-2">Description for this upload (optional)<textarea rows={2} maxLength={5000} value={caption} onChange={e => setCaption(e.target.value)} /><span className="seasonal-muted text-xs">You can edit each picture’s name and description after uploading.</span></label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button type="submit" className="seasonal-button rounded-lg px-5 py-3">{saving ? "Saving…" : `Save ${photos.length || ""} pictures`}</button>{photos.length > 0 && <span className="text-sm">{photos.length} selected</span>}</div>
      </fieldset>
    </form></Dialog>}
    {isInspiration ? <>
      {renamingBoard && <Dialog title="Rename inspiration board" onClose={() => { if (!saving) setRenamingBoard(null); }}>
        <form className="grid gap-4" onSubmit={e => void renameBoard(e)}>
          <label className="grid gap-2 text-sm">Board name<input autoFocus required maxLength={100} disabled={saving} value={newBoardName} onChange={e => setNewBoardName(e.target.value)} /></label>
          <p className="seasonal-muted text-xs">Your pictures and board contents will stay unchanged.</p>
          <div className="flex gap-3"><button disabled={saving || !newBoardName.trim()} className="seasonal-button rounded-lg px-4 py-2">Save name</button><button type="button" disabled={saving} className="seasonal-outline rounded-lg border px-4 py-2" onClick={() => setRenamingBoard(null)}>Cancel</button></div>
        </form>
      </Dialog>}
      {folderForm && <Dialog title="Create an inspiration board" onClose={() => { if (!saving) setFolderForm(false); }}><form onSubmit={createFolder} className="grid gap-4"><label className="grid gap-2 text-sm">Board name<input autoFocus required maxLength={100} disabled={saving} value={folderName} onChange={e => setFolderName(e.target.value)} placeholder="e.g. My Dream Backyard" /></label><p className="seasonal-muted text-xs">Name a collection for the ideas you want to keep together.</p><button disabled={saving} className="seasonal-button rounded-xl px-5 py-3">{saving ? "Creating…" : "Create board"}</button></form></Dialog>}
      {activeFolder === "folders" ? <>
        <div className="mb-5 flex items-center justify-between"><h3 className="font-serif text-2xl">Your inspiration boards</h3><span className="seasonal-muted text-sm">{folders.length} {folders.length === 1 ? "board" : "boards"}</span></div>
        {folders.length === 0 ? <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center"><h3 className="font-serif text-2xl">Start your garden inspiration</h3><p className="seasonal-muted mx-auto mt-2 max-w-md text-sm leading-6">Create your first board, then fill it with the ideas, flowers, and garden details you love.</p><button className="seasonal-button mt-6 rounded-xl px-5 py-3" onClick={() => setFolderForm(true)}>Create a board</button></div> :
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{folders.map(board => {
          const boardPictures = pictures.filter(p => p.info.folderId === board.id);
          const cover = boardPictures[0];
          return <article key={board.id} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:-translate-y-1 hover:shadow-md"><button type="button" className="block w-full text-left" onClick={() => { setActiveFolder(board.id); setUploadFolder(board.id); setSelected([]); setFilter("All"); setYear("All"); }}>
            <div className="grid h-48 grid-cols-3 gap-1 overflow-hidden bg-[var(--surface-alt)]">{boardPictures.slice(0,3).map(p => <BoardPreview key={p.key} blob={p.blob} name={p.info.name} />)}{!cover && <div className="col-span-3 flex items-center justify-center text-5xl opacity-50">✿</div>}</div>
            <div className="flex items-center justify-between gap-3 px-5 pt-4"><p className="seasonal-muted text-sm">{boardPictures.length} {boardPictures.length === 1 ? "idea" : "ideas"}</p><span className="seasonal-muted text-xl">↗</span></div>
          </button><button type="button" disabled={saving} className="mb-4 ml-5 max-w-[calc(100%-2.5rem)] break-words text-left font-serif text-xl underline-offset-4 hover:underline focus-visible:underline" aria-label={`Edit board name ${board.name}`} onClick={() => { setRenamingBoard(board); setNewBoardName(board.name); setError(""); }}>{board.name}</button></article>;
        })}</div>}
        {pictures.some(p => !p.info.folderId) && folders.length > 0 && <div className="mt-6 rounded-xl border border-[var(--border)] p-4 text-sm"><p>Some pictures were added before boards were available. Open a board and select <strong>Organize earlier pictures</strong> to place them.</p></div>}
      </> : <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><button className="seasonal-outline rounded-xl border px-4 py-2" onClick={() => { setActiveFolder("folders"); setSelected([]); }}>← All boards</button><button className="seasonal-button rounded-xl px-5 py-3" onClick={() => { setUploadFolder(activeFolder); setFolderComposer(true); }}>+ Add inspiration</button></div>
        <div className="mb-4"><button type="button" className="text-left font-serif text-3xl underline-offset-4 hover:underline focus-visible:underline" onClick={() => {const board=folders.find(f => f.id === activeFolder);if(board){setRenamingBoard(board);setNewBoardName(board.name);setError("");}}} aria-label="Edit board name">{folders.find(f => f.id === activeFolder)?.name}</button></div>
        {pictures.some(p => !p.info.folderId) && <button className="seasonal-outline mb-5 rounded-lg border px-4 py-2 text-sm" onClick={() => { setSelected(pictures.filter(p => !p.info.folderId).map(p => p.key)); setMoveFolder(activeFolder); }}>Organize earlier pictures</button>}
      </>}
    </> : <>
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
    </>}
    {(!isInspiration || activeFolder !== "folders") && <>
    <div className="mb-5 flex flex-wrap items-center gap-4"><label className="text-sm">Category <select className="ml-2" value={filter} onChange={e => { setFilter(e.target.value); setSelected([]); }}>{["All", ...categoryOptions].map(c => <option key={c}>{c}</option>)}</select></label><label className="text-sm">Year <select className="ml-2" value={year} onChange={e => { setYear(e.target.value); setSelected([]); }}>{["All", ...years].map(y => <option key={y}>{y}</option>)}</select></label><span className="seasonal-muted text-xs">{visible.length} pictures</span><button type="button" disabled={saving || !visible.length} className="seasonal-outline min-h-10 text-sm underline" onClick={() => setSelected(selected.length === visible.length ? [] : visible.map(p => p.key))}>{selected.length === visible.length && visible.length ? "Clear selection" : "Select all"}</button></div>
    {!!selected.length && <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"><span className="text-sm">{selected.length} selected</span><label className="text-sm">Photo category <select disabled={saving} className="ml-2" value={bulkCategory} onChange={e => setBulkCategory(e.target.value)}><option value="">Choose category</option>{categoryOptions.map(c => <option key={c}>{c}</option>)}</select></label><button disabled={saving || !bulkCategory} type="button" className="seasonal-button rounded-lg px-4 py-2 text-sm" onClick={async () => { const changes = pictures.filter(p => selected.includes(p.key)).map(picture => ({ picture, info: { ...picture.info, category: bulkCategory } })); if (await updatePictures(changes, `Category updated for ${changes.length} pictures.`)) setSelected([]); }}>Apply category</button><label className="text-sm">Move to <select disabled={saving} className="ml-2" value={moveFolder} onChange={e => setMoveFolder(e.target.value)}><option value="">{isInspiration ? "Choose board" : "Unfiled"}</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label><button disabled={saving || (isInspiration && !moveFolder)} type="button" className="seasonal-button rounded-lg px-4 py-2 text-sm" onClick={async () => { const moved = await updatePictures(pictures.filter(p => selected.includes(p.key)).map(picture => ({ picture, info: { ...picture.info, folderId: moveFolder } }))); if (moved) setSelected([]); }}>Move selected</button></div>}
    {viewIndex !== null && visible[viewIndex] && <GalleryViewer key={visible[viewIndex].key} pictures={visible} initialIndex={viewIndex} onClose={() => setViewIndex(null)} />}
    {!loaded && !error ? <p className="seasonal-muted">Loading pictures…</p> : visible.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center"><p className="font-serif text-xl">{isInspiration ? "Room for your garden inspiration" : "Room for your garden memories"}</p><p className="seasonal-muted mt-2 text-sm">{pictures.length ? "No pictures match this folder or filter." : isInspiration ? "Add pictures to this board and build your vision one idea at a time." : "Use Add pictures to start your gallery, then organize pictures into folders."}</p></div> : <div className={isInspiration ? "columns-1 gap-5 sm:columns-2 xl:columns-3" : "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"}>{visible.map(picture => <PhotoCard onView={() => setViewIndex(visible.findIndex(p => p.key === picture.key))} onCopyToGarden={isInspiration ? () => { setCopyPicture(picture); setTargetGarden(""); } : undefined} categoryOptions={categoryOptions} inspiration={isInspiration} key={picture.key} picture={picture} folders={folders} selected={selected.includes(picture.key)} busy={saving || !loaded} onSelect={() => setSelected(current => current.includes(picture.key) ? current.filter(key => key !== picture.key) : [...current, picture.key])} onSave={info => updatePictures([{ picture, info }])} onDelete={() => void deletePicture(picture)} />)}</div>}
    </>}
  </section>;
}

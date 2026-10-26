import type { PhotoEntry, PhotoFolder } from "./photo-cloud";

const database = "garden-os-photo-journal-v1";
export function openDatabase(): Promise<IDBDatabase> {
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
export async function transact<T>(storeName: "entries" | "folders", mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
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

// Copy, never move: guest originals remain available if transfer is interrupted.
export async function copyGuestPhotosToAccount(userId:string){
  const [entries,folders]=await Promise.all([transact<PhotoEntry[]>("entries","readonly",store=>store.getAll()),transact<PhotoFolder[]>("folders","readonly",store=>store.getAll())]);
  const accountId=(id:string)=>id.replace(/^guest:/,userId+":");
  for(const folder of folders.filter(f=>f.id.startsWith("guest:"))){
    const id=accountId(folder.id);
    if(!folders.some(f=>f.id===id))await transact("folders","readwrite",store=>store.put({...folder,id,cloudVersion:undefined}));
  }
  for(const entry of entries.filter(e=>e.id.startsWith("guest:"))){
    const id=accountId(entry.id);
    if(entries.some(e=>e.id===id))continue;
    const photoDetails=entry.photoDetails?Object.fromEntries(Object.entries(entry.photoDetails).map(([key,info])=>[key,{...info,folderId:accountId(info.folderId)}])):undefined;
    await transact("entries","readwrite",store=>store.put({...entry,id,photoDetails,cloudVersion:undefined,cloudPaths:undefined}));
  }
}

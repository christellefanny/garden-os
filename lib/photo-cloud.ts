import type { SupabaseClient } from '@supabase/supabase-js';

export const PHOTO_BUCKET = 'garden-atelier-private-photos';
export const PHOTO_LIMIT = 20 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
export type PhotoCollection = "inspiration" | "tasks" | "bouquets";
export type PhotoInfo = { name: string; description: string; date: string; category: string; folderId: string };
export type PhotoEntry = { collection?: PhotoCollection; contextId?: string; id: string; gardenId?: string; gardenName?: string; date: string; category: string; caption: string; plant: string; bed: string; photos: Blob[]; photoDetails?: Record<string, PhotoInfo>; cloudPaths?: string[]; cloudVersion?: number };
export type PhotoFolder = { collection?: PhotoCollection; contextId?: string; id: string; name: string; gardenId?: string; cloudVersion?: number };
export type CloudPhoto = Omit<PhotoEntry, 'photos' | 'cloudVersion'> & { kind: 'entry'; deleted?: boolean };
export type CloudFolder = Omit<PhotoFolder, 'cloudVersion'> & { kind: 'folder' };
export type PhotoRecord = { key: string; version: number; value: CloudPhoto | CloudFolder; urls?: string[] };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function ownedPhotoId(id: unknown, userId: string): id is string {
  return typeof id === 'string' && id.startsWith(userId + ':') && uuid.test(id.slice(userId.length + 1));
}
export function photoStateKey(userId: string, kind: 'entry' | 'folder', id: string) {
  return `garden-os-photo-${kind}-${userId}-${id.slice(userId.length + 1)}`;
}
export function ownedPhotoPath(path: unknown, userId: string): path is string {
  return typeof path === 'string' && path.startsWith(userId + '/') && path.length < 250 && /^[a-z0-9/-]+$/i.test(path) && !path.includes('..');
}
function short(value: unknown, max: number): value is string { return typeof value === 'string' && value.length <= max; }
export function validCloudPhoto(value: unknown, userId: string): value is CloudPhoto | CloudFolder {
  if (!value || typeof value !== 'object') return false;
  const v = value as Omit<CloudPhoto, 'kind'> & Omit<CloudFolder, 'kind'> & { kind: unknown };
  if (v.collection !== undefined && !["inspiration", "tasks", "bouquets"].includes(v.collection)) return false;
  if (v.collection !== undefined && v.gardenId !== undefined) return false;
  if (v.contextId !== undefined && (v.collection !== "tasks" || !short(v.contextId, 300) || !v.contextId.trim())) return false;
  if (!ownedPhotoId(v.id, userId) || (v.gardenId !== undefined && (!short(v.gardenId, 100) || !v.gardenId))) return false;
  if (v.kind === 'folder') return short(v.name, 100) && !!v.name.trim();
  if (v.kind !== 'entry') return false;
  if (v.deleted === true) return true;
  if (!short(v.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !short(v.category, 100) || !short(v.caption, 5000) || !short(v.plant, 200) || !short(v.bed, 200)) return false;
  if (v.gardenName !== undefined && !short(v.gardenName, 100)) return false;
  if (!Array.isArray(v.cloudPaths) || !v.cloudPaths.length || v.cloudPaths.length > 50 || !v.cloudPaths.every(p => ownedPhotoPath(p, userId))) return false;
  if (v.photoDetails && (typeof v.photoDetails !== 'object' || Object.entries(v.photoDetails).some(([key, info]) => !/^\d+$/.test(key) || Number(key) >= v.cloudPaths!.length || !info || !short(info.name, 150) || !short(info.description, 5000) || !short(info.date, 10) || !/^\d{4}-\d{2}-\d{2}$/.test(info.date) || !short(info.category, 100) || !(info.folderId === '' || ownedPhotoId(info.folderId, userId))))) return false;
  return true;
}

export async function photoRequest(client: SupabaseClient, method: string, body?: unknown): Promise<{ records?: PhotoRecord[]; record?: PhotoRecord; uploads?: { path: string; token: string }[] }> {
  const { data } = await client.auth.getSession();
  if (!data.session) throw new Error('Sign in to back up your pictures.');
  const response = await fetch('/api/photos', { method, headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: 'no-store', signal: AbortSignal.timeout(60000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Photo sync is unavailable. Your device copy is safe.');
  return result;
}
export async function uploadCloudEntry(client: SupabaseClient, entry: PhotoEntry): Promise<PhotoEntry> {
  let cloudPaths = entry.cloudPaths;
  if (!cloudPaths) {
    if (entry.photos.length > 50 || entry.photos.some(p => p.size > PHOTO_LIMIT || !PHOTO_TYPES.includes(p.type))) throw new Error('Choose up to 50 JPG, PNG, WebP, GIF or AVIF pictures, each under 20 MB. Your originals remain on this device.');
    const result = await photoRequest(client, 'POST', { id: entry.id, gardenId: entry.gardenId, files: entry.photos.map(p => ({ size: p.size, type: p.type })) });
    cloudPaths = [];
    for (const [index, upload] of result.uploads!.entries()) {
      const { error } = await client.storage.from(PHOTO_BUCKET).uploadToSignedUrl(upload.path, upload.token, entry.photos[index], { contentType: entry.photos[index].type, cacheControl: '3600' });
      if (error) throw new Error('Upload interrupted. Your originals remain on this device; try backing them up again.');
      cloudPaths.push(upload.path);
    }
  }
  const { cloudVersion } = entry;
  const metadata = { collection: entry.collection, contextId: entry.contextId, id: entry.id, gardenId: entry.gardenId, gardenName: entry.gardenName, date: entry.date, category: entry.category, caption: entry.caption, plant: entry.plant, bed: entry.bed, photoDetails: entry.photoDetails };
  const { record } = await photoRequest(client, 'PUT', { version: cloudVersion ?? 0, value: { ...metadata, kind: 'entry', cloudPaths } });
  return { ...entry, cloudPaths, cloudVersion: record!.version };
}

/** Keep inspiration separate from dated garden progress, including older untagged records. */
export function inPhotoCollection(item: {id:string;gardenId?:string;collection?:string;contextId?:string}, userId:string, collection?:PhotoCollection, gardenId?:string, contextId?:string) {
  return item.id.startsWith(userId+":") && item.collection===collection && (!gardenId || item.gardenId===gardenId) && (contextId === undefined || item.contextId === contextId);
}

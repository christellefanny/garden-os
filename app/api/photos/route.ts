import { authenticated, adminDatabase } from '@/lib/reminders-server';
import { PHOTO_BUCKET, PHOTO_LIMIT, PHOTO_TYPES, ownedPhotoId, photoStateKey, validCloudPhoto, type PhotoRecord } from '@/lib/photo-cloud';

const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
async function ownerGarden(auth: NonNullable<Awaited<ReturnType<typeof authenticated>>>, gardenId?: string) {
  if (!gardenId) return true;
  const { data, error } = await auth.db.from('gardens').select('id').eq('id', gardenId).eq('user_id', auth.user.id).maybeSingle();
  return !error && !!data;
}
async function input(request: Request) {
  const text = await request.text();
  if (text.length > 250000) throw Error('Request too large.');
  return JSON.parse(text);
}
export async function GET(request: Request) {
  const auth = await authenticated(request);
  if (!auth) return json({ error: 'Sign in to sync pictures.' }, 401);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Photo cloud storage needs the server connection. Your device pictures remain safe.' }, 503);
  try {
    const records: PhotoRecord[] = [];
    for (let start = 0; ; start += 500) {
      const { data, error } = await auth.db.from('garden_os_state').select('key,value,version').eq('user_id', auth.user.id).like('key', 'garden-os-photo-%').order('key').range(start, start + 499);
      if (error) throw error;
      records.push(...data.filter(r => validCloudPhoto(r.value, auth.user.id) && r.key === photoStateKey(auth.user.id, r.value.kind, r.value.id)));
      if (data.length < 500) break;
    }
    const bucket = adminDatabase().storage.from(PHOTO_BUCKET);
    for (const record of records) {
      if (record.value.kind !== 'entry' || record.value.deleted) continue;
      const { data, error } = await bucket.createSignedUrls(record.value.cloudPaths!, 3600);
      if (error || !data || data.some(p => p.error || !p.signedUrl)) throw error || Error('Pictures unavailable.');
      record.urls = data.map(p => p.signedUrl!);
    }
    return json({ records });
  } catch { return json({ error: 'Could not load cloud pictures. Your device copy is still available. Try again when connected.' }, 503); }
}
export async function POST(request: Request) {
  const auth = await authenticated(request);
  if (!auth) return json({ error: 'Sign in to sync pictures.' }, 401);
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Photo cloud storage needs the server connection. Your device pictures remain safe.' }, 503);
  try {
    const body = await input(request);
    if (!ownedPhotoId(body.id, auth.user.id) || (body.gardenId !== undefined && (typeof body.gardenId !== 'string' || !body.gardenId || body.gardenId.length > 100)) || !Array.isArray(body.files) || !body.files.length || body.files.length > 50 || body.files.some((f: { size: number; type: string }) => !f || !Number.isInteger(f.size) || f.size <= 0 || f.size > PHOTO_LIMIT || !PHOTO_TYPES.includes(f.type))) return json({ error: 'Choose up to 50 supported pictures, each under 20 MB.' }, 400);
    if (!await ownerGarden(auth, body.gardenId)) return json({ error: 'Garden unavailable.' }, 403);
    const storage = adminDatabase().storage;
    const existing = await storage.getBucket(PHOTO_BUCKET);
    if (existing.error) {
      const created = await storage.createBucket(PHOTO_BUCKET, { public: false, fileSizeLimit: PHOTO_LIMIT, allowedMimeTypes: PHOTO_TYPES });
      if (created.error) {
        const retry = await storage.getBucket(PHOTO_BUCKET);
        if (retry.error || retry.data.public) throw created.error;
      }
    } else if (existing.data.public) throw Error('Private bucket required.');
    const uploads = [];
    const batch = crypto.randomUUID();
    for (const index of body.files.keys()) {
      const path = `${auth.user.id}/${body.id.slice(auth.user.id.length + 1)}/${batch}/${index}`;
      const { data, error } = await storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
      if (error || !data) throw error || Error('Upload unavailable.');
      uploads.push({ path, token: data.token });
    }
    return json({ uploads });
  } catch { return json({ error: 'Cloud upload could not start. Your originals remain on this device. Please try again.' }, 503); }
}
export async function PUT(request: Request) {
  const auth = await authenticated(request);
  if (!auth) return json({ error: 'Sign in to sync pictures.' }, 401);
  try {
    const body = await input(request);
    if (!validCloudPhoto(body.value, auth.user.id) || !Number.isInteger(body.version) || body.version < 0) return json({ error: 'Invalid picture record.' }, 400);
    const value = body.value;
    if (!await ownerGarden(auth, value.gardenId)) return json({ error: 'Garden unavailable.' }, 403);
    const key = photoStateKey(auth.user.id, value.kind, value.id);
    const previous = value.kind === 'entry' ? await auth.db.from('garden_os_state').select('value').eq('user_id', auth.user.id).eq('key', key).maybeSingle() : null;
    if(previous?.error)return json({error:'Could not check the previous photo version. Your device copy is safe.'},503);
    const { data, error } = await auth.db.rpc('garden_os_save_state', { p_key: key, p_value: value, p_version: body.version });
    if (error) return json({ error: error.code === '40001' ? 'These pictures changed on another device. Reopen the album to load that version, then try your change again.' : 'Could not back up pictures. Your device copy is safe.' }, error.code === '40001' ? 409 : 503);
    if(value.kind==='entry'&&process.env.SUPABASE_SERVICE_ROLE_KEY&&previous?.data&&validCloudPhoto(previous.data.value,auth.user.id)&&previous.data.value.kind==='entry'){
      const keep = value.deleted ? [] : value.cloudPaths ?? [];
      const removed = (previous.data.value.cloudPaths ?? []).filter(path=>!keep.includes(path));
      if(removed.length)await adminDatabase().storage.from(PHOTO_BUCKET).remove(removed);
    }
    return json({ record: data?.[0] });
  } catch { return json({ error: 'Could not save picture details. Please try again.' }, 400); }
}

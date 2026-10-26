import { copyGuestPhotosToAccount } from './photo-local';
import { supabase } from './supabase';
import { readGuest, guestStateKeys, mergeGuestValue } from './guest';

const transfers = new Map<string, Promise<void>>();
export function transferGuest(userId: string, accessToken: string): Promise<void> {
  const running = transfers.get(userId);
  if (running) return running;
  const task = saveGuestToAccount(userId, accessToken).finally(() => transfers.delete(userId));
  transfers.set(userId, task);
  return task;
}
async function saveGuestToAccount(userId: string, accessToken: string) {
  const guest = readGuest();
  // Stable UUIDs make retries idempotent and keep plant/layout references intact.
  if (guest.gardens.length) {
    const { error } = await supabase.from('gardens').upsert(guest.gardens.map(g => ({ ...g, user_id: userId })));
    if (error) throw new Error(error.message);
  }
  if (guest.spaces.length) {
    const { error } = await supabase.from('growing_spaces').upsert(guest.spaces);
    if (error) throw new Error(error.message);
  }
  const keys = guestStateKeys(localStorage).filter(key => !/active-garden|last-page/.test(key));
  if (keys.length) {
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const response = await fetch('/api/state', { headers });
    if (!response.ok) throw new Error('Could not connect to account storage. Your guest copy is still on this device.');
    const { records } = await response.json();
    for (const key of keys) {
      const target = key.replace(/-guest(?=-|$)/, `-${userId}`);
      const record = records.find((r: { key: string }) => r.key === target);
      const raw = localStorage.getItem(key)!;
      let value: unknown;
      try { value = JSON.parse(raw); } catch { value = raw; }
      const local = localStorage.getItem(target);
      const pendingKey = `garden-os-sync-pending-${userId}`;
      const pending: Record<string, string> = JSON.parse(localStorage.getItem(pendingKey) || "{}");
      let account = record?.value;
      if (local !== null) {
        let parsed: unknown;
        try { parsed = JSON.parse(local); } catch { parsed = local; }
        // Include account edits still waiting for cloud sync; keep a recovery copy.
        localStorage.setItem(`${target}-before-guest-transfer`, local);
        account = pending[target] ? mergeGuestValue(parsed, account) : mergeGuestValue(account, parsed);
      }
      const merged = mergeGuestValue(account, value);
      const saved = await fetch('/api/state', { method: 'PUT', headers, body: JSON.stringify({ key: target, value: merged, version: record?.version ?? 0 }) });
      if (!saved.ok) throw new Error('Account save was interrupted. Your guest copy is retained; retry to finish.');
      const text = typeof merged === 'string' ? merged : JSON.stringify(merged);
      localStorage.setItem(target, text);
      localStorage.setItem(`${target}-cloud-base`, text);
      delete pending[target];
      localStorage.setItem(pendingKey, JSON.stringify(pending));
    }
  }
  await copyGuestPhotosToAccount(userId);
  // Guest originals remain as a recovery copy; never delete before cloud success.
  localStorage.removeItem('garden-os-guest-transfer-email');
  localStorage.removeItem('garden-os-guest-active');
}

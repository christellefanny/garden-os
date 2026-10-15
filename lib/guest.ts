import type { Garden, Space } from './garden';

export const GUEST_ID = 'guest';
export const GUEST_DATA_KEY = 'garden-os-guest-data';
export type GuestData = { gardens: Garden[]; spaces: Space[] };
export function readGuest(): GuestData {
  const raw = localStorage.getItem(GUEST_DATA_KEY);
  if (!raw) return { gardens: [], spaces: [] };
  const data = JSON.parse(raw);
  if (!Array.isArray(data.gardens) || !Array.isArray(data.spaces))
    throw new Error('Guest records could not be read. Your browser copy has been retained.');
  return data;
}
export function writeGuest(data: GuestData) {
  // Persist before reporting success or updating the screen.
  localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('garden-os-data-change'));
}
export function saveGuestGarden(input: Omit<Garden, 'id'>, existing?: Garden): Garden {
  const state = readGuest();
  const garden = { ...input, id: existing?.id ?? crypto.randomUUID() };
  writeGuest({ ...state, gardens: [garden, ...state.gardens.filter(g => g.id !== garden.id)] });
  return garden;
}
export function saveGuestSpaces(next: Space[]) {
  const state = readGuest();
  const ids = new Set(next.map(s => s.id));
  writeGuest({ ...state, spaces: [...state.spaces.filter(s => !ids.has(s.id)), ...next] });
}

// Retain account values on scalar conflicts; merge records by stable ID.
export function mergeGuestValue(account: unknown, guest: unknown): unknown {
  if (account === undefined) return guest;
  if (Array.isArray(account) && Array.isArray(guest)) {
    const combined = [...account];
    for (const value of guest) {
      const id = value && typeof value === 'object' ? value.id : undefined;
      if (!combined.some(item => id ? item?.id === id : JSON.stringify(item) === JSON.stringify(value))) combined.push(value);
    }
    return combined;
  }
  if (account && guest && typeof account === 'object' && typeof guest === 'object' && !Array.isArray(account) && !Array.isArray(guest)) {
    const result: Record<string, unknown> = { ...account };
    for (const [key, value] of Object.entries(guest)) result[key] = mergeGuestValue(result[key], value);
    return result;
  }
  return account;
}
export function guestStateKeys(storage: Storage): string[] {
  const prefixes = ['plant-vault', 'calendar', 'layout', 'custom-layouts', 'original-layout-name', 'layout-selection', 'active-garden', 'last-page'];
  return Object.keys(storage).filter(key => prefixes.some(p => key.startsWith(`garden-os-${p}-`) && (key.endsWith('-guest') || key.includes('-guest-'))) && !/cloud-base|conflict|backup|before-/.test(key));
}

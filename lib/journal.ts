import { readDetails, type Entry } from './garden.ts';

export const journalKey = (userId: string) => `garden-os-journal-${userId}`;

// Standalone writing stays separate from bed records; never create a fake space.
export function readJournal(userId: string): Entry[] {
  const raw = localStorage.getItem(journalKey(userId));
  if (raw === null) return [];
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries)) throw new Error('Saved journal could not be read. Your existing copy is preserved.');
  return readDetails(JSON.stringify({ garden_os: 1, notes: '', plants: [], entries })).entries;
}

export function saveJournalEntry(userId: string, entry: Entry) {
  const current = readJournal(userId);
  const next = current.some(item => item.id === entry.id)
    ? current.map(item => item.id === entry.id ? entry : item)
    : [entry, ...current];
  localStorage.setItem(journalKey(userId), JSON.stringify(next));
  window.dispatchEvent(new Event('garden-os-data-change'));
  return next;
}

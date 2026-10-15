import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readGuest, writeGuest, saveGuestGarden, saveGuestSpaces, mergeGuestValue, guestStateKeys } from '../lib/guest.ts';

function storage() {
  const values = {};
  return new Proxy(values, { get(target, key) {
    if (key === 'getItem') return k => target[k] ?? null;
    if (key === 'setItem') return (k, v) => { target[k] = v; };
    return target[key];
  } });
}
test('guest garden, spaces, plants and harvest entries survive reload, failed writes never report success', () => {
  globalThis.localStorage = storage();
  globalThis.window = { dispatchEvent() {} };
  const garden = saveGuestGarden({ name: 'Backyard', year: 2027, location: null, hardiness_zone: null });
  const notes = JSON.stringify({ plants: [{ id: 'plant' }], entries: [{ kind: 'Harvest', text: 'First tomato' }] });
  saveGuestSpaces([{ id: 'space', garden_id: garden.id, notes }]);
  assert.equal(readGuest().gardens[0].id, garden.id);
  assert.equal(readGuest().spaces[0].notes, notes);
  saveGuestGarden({ ...garden, name: 'Updated' }, garden);
  assert.equal(readGuest().gardens.length, 1);
  globalThis.localStorage = { getItem() { return null; }, setItem() { throw new Error('Quota exceeded'); } };
  assert.throws(() => writeGuest({ gardens: [], spaces: [] }), /Quota/);
});
test('account merge keeps existing records and combines guest records without retry duplicates', () => {
  const account = { plants: [{ id: 'a', name: 'Rose' }], tasks: { old: { status: 'done' } }, lastFrost: '05-15' };
  const guest = { plants: [{ id: 'b', name: 'Tomato' }], tasks: { new: { status: 'done' } }, lastFrost: '05-20' };
  const merged = mergeGuestValue(account, guest);
  assert.equal(merged.plants.length, 2);
  assert.equal(merged.lastFrost, '05-15');
  assert.ok(merged.tasks.old && merged.tasks.new);
  assert.deepEqual(mergeGuestValue(merged, guest), merged);
});
test('migration selects only guest records, never other accounts or sync metadata', () => {
  const s = storage();
  for (const key of ['garden-os-calendar-guest', 'garden-os-layout-2027-guest-bed', 'garden-os-calendar-private', 'garden-os-layout-2027-guest-bed-cloud-base', 'sb-auth-token']) s.setItem(key, '[]');
  assert.deepEqual(guestStateKeys(s).sort(), ['garden-os-calendar-guest', 'garden-os-layout-2027-guest-bed']);
});

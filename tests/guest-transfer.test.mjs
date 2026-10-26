import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { readGuest, guestStateKeys, mergeGuestValue } from '../lib/guest.ts';
const source = await readFile(new URL('../lib/guest-transfer.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const code = compiled.replace(/import[^;]+from[^;]+;/g, line => line.includes('photo-local') ? 'const {copyGuestPhotosToAccount}=globalThis.__guestTransferTest;' : line.includes('supabase') ? 'const {supabase}=globalThis.__guestTransferTest;' : 'const {readGuest,guestStateKeys,mergeGuestValue}=globalThis.__guestTransferTest;');

test('interrupted transfer retains guest data, retries without duplicates, merges account records and excludes other accounts', async () => {
  const values = {
    'garden-os-guest-data': JSON.stringify({ gardens: [{ id: 'garden', name: 'Guest garden' }], spaces: [{ id: 'space', garden_id: 'garden', notes: 'original harvest notes' }] }),
    'garden-os-plant-vault-guest': JSON.stringify([{ id: 'tomato', name: 'Tomato' }]),
    'garden-os-calendar-guest': JSON.stringify({ tasks: { done: { status: 'done' } } }),
    'garden-os-calendar-other-user': 'private',
    'garden-os-guest-transfer-email': 'garden@example.test',
    'garden-os-guest-active': 'true',
  };
  globalThis.localStorage = new Proxy(values, { get(target, key) {
    if (key === 'getItem') return k => target[k] ?? null;
    if (key === 'setItem') return (k, v) => { target[k] = v; };
    if (key === 'removeItem') return k => { delete target[k]; };
    return target[key];
  } });
  const tables = { gardens: new Map(), growing_spaces: new Map() };
  const records = [{ key: 'garden-os-plant-vault-account', value: [{ id: 'rose', name: 'Rose' }], version: 1 }];
  let fail = true, photoCopies = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    if (options.method !== 'PUT') return { ok: true, json: async () => ({ records: structuredClone(records) }) };
    const input = JSON.parse(options.body);
    if (input.key.includes('calendar') && fail) { fail = false; return { ok: false }; }
    const row = records.find(r => r.key === input.key);
    assert.equal(input.version, row?.version ?? 0);
    const saved = { ...input, version: input.version + 1 };
    if (row) Object.assign(row, saved); else records.push(saved);
    return { ok: true };
  };
  globalThis.__guestTransferTest = {
    supabase: { from(table) { return { async upsert(rows) { for (const row of rows) tables[table].set(row.id, row); return { error: null }; } }; } },
    readGuest, guestStateKeys, mergeGuestValue, copyGuestPhotosToAccount: async id => { assert.equal(id,"account"); photoCopies++; },
  };
  try {
    const { transferGuest } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
    const original = values['garden-os-guest-data'];
    await assert.rejects(transferGuest('account', 'test-token'), /interrupted/);
    assert.equal(values['garden-os-guest-data'], original);
    assert.ok(values['garden-os-guest-transfer-email']);
    assert.equal(photoCopies,0,'Photos only copy after garden/state transfer succeeds');
    await transferGuest('account', 'test-token');
    assert.equal(photoCopies,1);
    assert.equal(tables.gardens.size, 1);
    assert.equal(tables.growing_spaces.size, 1);
    assert.equal(tables.gardens.get('garden').user_id, 'account');
    assert.equal(tables.growing_spaces.get('space').notes, 'original harvest notes');
    assert.deepEqual(records[0].value.map(p => p.id), ['rose', 'tomato']);
    assert.equal(records[1].value.tasks.done.status, 'done');
    assert.equal(records.length, 2);
    assert.equal(values['garden-os-guest-transfer-email'], undefined);
    assert.equal(values['garden-os-guest-data'], original);
    assert.equal(values['garden-os-calendar-other-user'], 'private');
  } finally { globalThis.fetch = originalFetch; delete globalThis.__guestTransferTest; }
});

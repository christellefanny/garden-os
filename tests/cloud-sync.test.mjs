import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCloudSync } from "../lib/cloud-sync.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const key = `garden-os-journal-${userId}`;
const otherKey = `garden-os-calendar-${userId}`;
const pendingKey = `garden-os-sync-pending-${userId}`;
class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, raw) { this.values.set(key, String(raw)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}
const until = async (check, message = "condition did not become true") => {
  for (let i = 0; i < 200; i++) {
    if (check()) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  assert.fail(message);
};
function harness(t, { storage = new MemoryStorage(), records = [], intercept = () => null, retryMs = 20, canHydrate, onReady = () => {} } = {}) {
  const remote = new Map(records.map(record => [record.key, record]));
  const calls = [], statuses = [];
  let conflicts = [], ready = false;
  const request = async (method, body) => {
    calls.push({ method, body });
    const response = await intercept(method, body, remote);
    if (response) return response;
    if (method === "GET") return { ok: true, status: 200, data: { records: [...remote.values()] } };
    const previous = remote.get(body.key);
    if ((previous?.version ?? 0) !== body.version) return { ok: false, status: 409, data: {} };
    const record = { key: body.key, value: body.value, version: body.version + 1 };
    remote.set(body.key, record);
    return { ok: true, status: 200, data: { record } };
  };
  const sync = createCloudSync({
    userId, storage, write: (key, raw) => storage.setItem(key, raw), request,
    onStatus: status => statuses.push(status), onConflicts: value => { conflicts = value; },
    canHydrate, onReady: () => { ready = true; onReady(); }, onDataChange: () => {}, debounceMs: 5, retryMs,
  });
  t.after(() => sync.stop());
  return { sync, storage, remote, calls, statuses,
    get conflicts() { return conflicts; }, get ready() { return ready; },
    edit(key, value) { const raw = JSON.stringify(value); storage.setItem(key, raw); sync.edit(key, raw); },
  };
}

test("failed initial read still tracks edits and reconnect reads versions before uploading", async t => {
  let unavailable = true;
  const h = harness(t, { retryMs: 10000, intercept: method => method === "GET" && unavailable
    ? { ok: false, status: 503, data: { setup: true } } : null });
  await h.sync.start();
  assert.ok(h.ready, "local application remains usable");
  h.edit(key, [{ text: "A note made offline" }]);
  assert.deepEqual(JSON.parse(h.storage.getItem(pendingKey)), { [key]: '[{"text":"A note made offline"}]' });
  assert.equal(h.calls.filter(call => call.method === "PUT").length, 0);
  unavailable = false;
  h.sync.retry();
  await until(() => h.remote.has(key));
  assert.deepEqual(h.remote.get(key).value, [{ text: "A note made offline" }]);
  assert.deepEqual(h.calls.map(call => call.method), ["GET", "GET", "PUT"]);
  assert.equal(h.statuses.at(-1), "All changes synced to your account");
});

test("network failure on first load automatically retries without requiring a new edit", async t => {
  let first = true;
  const h = harness(t, { intercept: method => { if (method === "GET" && first) { first = false; throw new Error("offline"); } } });
  await h.sync.start();
  h.edit(key, ["preserve"]);
  await until(() => h.remote.has(key));
  assert.equal(h.remote.get(key).version, 1);
  assert.deepEqual(JSON.parse(h.storage.getItem(pendingKey)), {});
});

test("pending edits survive stopping and restarting after an unavailable initial read", async t => {
  const h = harness(t, { retryMs: 10000, intercept: () => ({ ok: false, status: 503, data: {} }) });
  await h.sync.start();
  h.edit(key, ["saved before reload"]);
  h.sync.stop();
  const next = harness(t, { storage: h.storage });
  await next.sync.start();
  assert.deepEqual(next.remote.get(key).value, ["saved before reload"]);
  assert.deepEqual(JSON.parse(next.storage.getItem(pendingKey)), {});
});

test("offline edits upload with the remote version when the cloud still equals the saved base", async t => {
  const storage = new MemoryStorage();
  storage.setItem(key, '["offline edit"]');
  storage.setItem(`${key}-cloud-base`, '["original"]');
  const h = harness(t, { storage, records: [{ key, value: ["original"], version: 7 }] });
  await h.sync.start();
  assert.equal(h.remote.get(key).version, 8);
  assert.deepEqual(h.remote.get(key).value, ["offline edit"]);
  assert.deepEqual(h.conflicts, []);
});

test("transient PUT errors remain pending and retry rather than becoming false conflicts", async t => {
  let fail = true;
  const h = harness(t, { intercept: method => method === "PUT" && fail ? { ok: false, status: 503, data: {} } : null });
  await h.sync.start();
  h.edit(key, ["first"]);
  await until(() => h.calls.some(call => call.method === "PUT"));
  assert.match(h.statuses.at(-1), /unavailable/);
  assert.deepEqual(h.conflicts, []);
  h.edit(key, ["newer edit"]);
  fail = false;
  await until(() => h.remote.get(key)?.value[0] === "newer edit");
  assert.equal(h.statuses.at(-1), "All changes synced to your account");
});

test("a success never masks another key's conflict and both versions remain available", async t => {
  const storage = new MemoryStorage();
  storage.setItem(key, '["local"]');
  storage.setItem(`${key}-cloud-base`, '["original"]');
  storage.setItem(otherKey, '{"lastFrost":"05-15"}');
  const h = harness(t, { storage, records: [{ key, value: ["another device"], version: 2 }] });
  await h.sync.start();
  assert.deepEqual(h.conflicts, [key]);
  assert.match(h.statuses.at(-1), /differences need review/);
  assert.equal(storage.getItem(key), '["local"]');
  assert.equal(storage.getItem(`${key}-cloud-conflict`), '["another device"]');
  assert.equal(storage.getItem(`${key}-before-cloud-migration`), '["local"]');
  assert.ok(h.remote.has(otherKey));
  h.edit(key, ["another device"]);
  h.sync.retry();
  await until(() => h.conflicts.length === 0);
  assert.equal(h.statuses.at(-1), "All changes synced to your account");
});

test("409 fetches the current cloud choice without overwriting either device", async t => {
  const h = harness(t, { records: [{ key, value: ["original"], version: 1 }] });
  await h.sync.start();
  h.remote.set(key, { key, value: ["other device"], version: 2 });
  h.edit(key, ["local edit"]);
  h.edit(otherKey, { saved: true });
  await until(() => h.storage.getItem(`${key}-cloud-conflict`) === '["other device"]');
  assert.deepEqual(h.remote.get(key).value, ["other device"]);
  assert.equal(h.storage.getItem(key), '["local edit"]');
  assert.deepEqual(h.conflicts, [key]);
  assert.match(h.statuses.at(-1), /differences need review/);
  assert.ok(h.remote.has(otherKey));
});

test("new edits made during an in-flight PUT are not acknowledged by the older response", async t => {
  let release;
  let paused = true;
  const h = harness(t, { intercept: async method => {
    if (method === "PUT" && paused) { paused = false; await new Promise(resolve => { release = resolve; }); }
  } });
  await h.sync.start();
  h.edit(key, ["first"]);
  await until(() => release);
  h.edit(key, ["second"]);
  release();
  await until(() => h.remote.get(key)?.value[0] === "second");
  const puts = h.calls.filter(call => call.method === "PUT");
  assert.deepEqual(puts.map(call => call.body.version), [0, 1]);
  assert.equal(h.storage.getItem(`${key}-cloud-base`), '["second"]');
});

test("an ambiguous successful PUT is acknowledged on retry without duplicate writes", async t => {
  let once = true;
  const h = harness(t, { intercept: (method, body, remote) => {
    if (method === "PUT" && once) {
      once = false;
      remote.set(body.key, { key: body.key, value: body.value, version: body.version + 1 });
      throw new Error("response lost");
    }
  } });
  await h.sync.start();
  h.edit(key, ["accepted remotely"]);
  await until(() => h.calls.filter(call => call.method === "GET").length === 2 && h.statuses.at(-1) === "All changes synced to your account");
  assert.equal(h.calls.filter(call => call.method === "PUT").length, 1);
  assert.equal(h.remote.get(key).version, 1);
});

test("cleanup ignores late responses and stops retrying; unrelated keys are never uploaded", async t => {
  let release;
  const h = harness(t, { intercept: async method => {
    if (method === "GET") await new Promise(resolve => { release = resolve; });
  } });
  const started = h.sync.start();
  h.edit("garden-os-journal-guest", ["guest"]);
  h.edit(`${key}-cloud-base`, ["base"]);
  h.edit(key, ["pending"]);
  h.sync.stop();
  const statusCount = h.statuses.length;
  release();
  await started;
  await new Promise(resolve => setTimeout(resolve, 40));
  assert.equal(h.calls.length, 1);
  assert.equal(h.statuses.length, statusCount);
  assert.equal(h.ready, false);
  assert.deepEqual(Object.keys(JSON.parse(h.storage.getItem(pendingKey))), [key]);
});

test("the workspace becomes ready before a slow initial upload finishes", async t => {
  const storage = new MemoryStorage();
  storage.setItem(key, '["existing local writing"]');
  let release;
  const h = harness(t, { storage, intercept: async method => {
    if (method === "PUT") await new Promise(resolve => { release = resolve; });
  } });
  const started = h.sync.start();
  await until(() => release);
  assert.ok(h.ready);
  assert.match(h.statuses.at(-1), /Syncing/);
  release();
  await started;
  assert.equal(h.statuses.at(-1), "All changes synced to your account");
});

test("a malformed successful read never treats the account as empty or uploads blindly", async t => {
  const storage = new MemoryStorage();
  storage.setItem(key, '["local copy"]');
  const h = harness(t, { storage, retryMs: 10000, intercept: () => ({ ok: true, status: 200, data: {} }) });
  await h.sync.start();
  assert.ok(h.ready);
  assert.equal(h.calls.filter(call => call.method === "PUT").length, 0);
  assert.equal(storage.getItem(key), '["local copy"]');
  assert.match(h.statuses.at(-1), /unavailable/);
});

test("a new conflict cannot offer a stale cloud choice before the fresh read returns", async t => {
  let release, reads = 0;
  const storage = new MemoryStorage();
  storage.setItem(`${key}-cloud-conflict`, '["stale choice"]');
  const h = harness(t, { storage, records: [{ key, value: ["original"], version: 1 }], intercept: async method => {
    if (method === "GET" && ++reads === 2) await new Promise(resolve => { release = resolve; });
  } });
  await h.sync.start();
  h.remote.set(key, { key, value: ["new cloud version"], version: 2 });
  h.edit(key, ["local edit"]);
  await until(() => release);
  assert.deepEqual(h.conflicts, [], "do not expose the old saved cloud choice");
  release();
  await until(() => h.conflicts.length === 1);
  assert.equal(storage.getItem(`${key}-cloud-conflict`), '["new cloud version"]');
});


test("recovery stages newer cloud data while an editor retains its unsaved draft", async t => {
  const storage = new MemoryStorage();
  const vault = `garden-os-plant-vault-${userId}`;
  const original = '[{"id":"rose","name":"Rose"}]';
  storage.setItem(vault, original);
  storage.setItem(`${vault}-cloud-base`, original);
  let opened = false, unavailable = true;
  const h = harness(t, { storage, retryMs: 10000, canHydrate: () => !opened, onReady: () => { opened = true; },
    records: [{ key: vault, value: [{ id: "rose", name: "Rose" }, { id: "basil", name: "Basil" }], version: 2 }],
    intercept: method => method === "GET" && unavailable ? { ok: false, status: 503, data: {} } : null });
  await h.sync.start();
  unavailable = false;
  h.sync.retry();
  await until(() => h.conflicts.includes(vault));
  assert.equal(storage.getItem(vault), original, "do not replace an open editor's backing data");
  assert.equal(storage.getItem(`${vault}-cloud-base`), original);
  assert.ok(Object.hasOwn(JSON.parse(storage.getItem(pendingKey)), vault), "briefing must wait for review");
  h.edit(vault, [{ id: "rose", name: "Rose" }, { id: "mint", name: "Mint from the open form" }]);
  h.sync.retry();
  await until(() => h.calls.filter(call => call.method === "GET").length === 3);
  assert.equal(h.calls.filter(call => call.method === "PUT").length, 0, "stale editor cannot overwrite newer cloud data");
  assert.equal(h.remote.get(vault).value[1].id, "basil");
  assert.match(storage.getItem(vault), /Mint from the open form/);
});

test("cloud-only recovery is staged without inventing a local record and survives manual retry", async t => {
  const records = [{ key, value: ["cloud only"], version: 4 }];
  const h = harness(t, { records, canHydrate: () => false });
  await h.sync.start();
  assert.equal(h.storage.getItem(key), null);
  assert.equal(h.storage.getItem(`${key}-cloud-base`), null);
  assert.equal(h.storage.getItem(`${key}-before-cloud-migration-absent`), "true");
  assert.deepEqual(JSON.parse(h.storage.getItem(pendingKey)), { [key]: null });
  assert.deepEqual(h.conflicts, [key]);
  h.sync.stop();
  const retry = harness(t, { storage: h.storage, records, canHydrate: () => false });
  await retry.sync.start();
  assert.deepEqual(retry.conflicts, [key]);
  assert.equal(retry.storage.getItem(key), null);
  assert.equal(retry.calls.filter(call => call.method === "PUT").length, 0);
});

test("a newer remote edit after explicit cloud choice is staged for a new review", async t => {
  const h = harness(t, { records: [{ key, value: ["reviewed cloud choice"], version: 2 }], canHydrate: () => false });
  await h.sync.start();
  h.edit(key, ["reviewed cloud choice"]);
  h.sync.stop();
  const retry = harness(t, { storage: h.storage, records: [{ key, value: ["later remote edit"], version: 3 }], canHydrate: () => false });
  await retry.sync.start();
  assert.equal(retry.storage.getItem(key), '["reviewed cloud choice"]');
  assert.equal(retry.storage.getItem(`${key}-cloud-conflict`), '["later remote edit"]');
  assert.deepEqual(retry.conflicts, [key]);
  assert.equal(retry.calls.filter(call => call.method === "PUT").length, 0);
});

test("PostgreSQL jsonb normalization does not block offline edits or identical acknowledgements", async t => {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  t.after(() => db.close());
  const raw = '[{"name":"Rose","id":"rose","notes":"old","nested":{"z":1,"a":2}}]';
  const normalized = (await db.query('SELECT $1::jsonb AS value', [raw])).rows[0].value;
  assert.notEqual(JSON.stringify(normalized), raw, "exercise real jsonb reordering");
  const storage = new MemoryStorage();
  storage.setItem(key, raw.replace('"old"', '"offline edit"'));
  storage.setItem(`${key}-cloud-base`, raw);
  const h = harness(t, { storage, records: [{ key, value: normalized, version: 7 }], canHydrate: () => false });
  await h.sync.start();
  assert.deepEqual(h.conflicts, []);
  assert.equal(h.remote.get(key).version, 8);
  assert.equal(h.remote.get(key).value[0].notes, "offline edit");
  const same = harness(t, { records: [{ key, value: normalized, version: 7 }], canHydrate: () => false });
  same.storage.setItem(key, raw);
  await same.sync.start();
  assert.deepEqual(same.conflicts, []);
  assert.equal(same.calls.filter(call => call.method === "PUT").length, 0);
  assert.equal(same.statuses.at(-1), "All changes synced to your account");
});

test("semantic comparisons preserve array ordering and plain-string differences", async t => {
  const storage = new MemoryStorage();
  storage.setItem(key, '["one","two"]');
  storage.setItem(`${key}-cloud-base`, '["one","two"]');
  storage.setItem(otherKey, 'original');
  storage.setItem(`${otherKey}-cloud-base`, 'original');
  const h = harness(t, { storage, canHydrate: () => false, records: [
    { key, value: ["two", "one"], version: 2 },
    { key: otherKey, value: 'changed', version: 2 },
  ] });
  await h.sync.start();
  assert.deepEqual(h.conflicts.sort(), [key, otherKey].sort());
  assert.equal(h.calls.filter(call => call.method === "PUT").length, 0);
});

test("the workspace hydration guard persists across retries and account identity is keyed", () => {
  const boundary = readFileSync(new URL('../components/CloudDataBoundary.tsx', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../components/GardenApp.tsx', import.meta.url), 'utf8');
  assert.match(boundary, /const workspaceOpened = useRef/);
  assert.match(boundary, /canHydrate: \(\) => !workspaceOpened.current/);
  assert.match(boundary, /workspaceOpened.current = true; setReady\(true\)/);
  assert.match(app, /<CloudDataBoundary key=\{userId\}/);
  assert.match(app, /<CloudDataBoundary key=\{GUEST_ID\}/);
});


test("failed retry preserves a cloud-only pending marker through unrelated edits", async t => {
  const h = harness(t, { records: [{ key, value: ["cloud only"], version: 4 }], canHydrate: () => false });
  await h.sync.start();
  h.sync.stop();
  const retry = harness(t, { storage: h.storage, canHydrate: () => false, retryMs: 10000,
    intercept: () => ({ ok: false, status: 503, data: {} }) });
  await retry.sync.start();
  retry.edit(otherKey, { saved: true });
  const pending = JSON.parse(retry.storage.getItem(pendingKey));
  assert.ok(Object.hasOwn(pending, key));
  assert.equal(pending[key], null);
  assert.equal(pending[otherKey], '{"saved":true}');
  assert.equal(retry.calls.filter(call => call.method === "PUT").length, 0);
});

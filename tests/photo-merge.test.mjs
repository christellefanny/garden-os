import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inPhotoCollection, validCloudPhoto, uploadCloudEntry } from '../lib/photo-cloud.ts';
const user = '11111111-1111-4111-8111-111111111111';
const id = `${user}:22222222-2222-4222-8222-222222222222`;
const manifest = { id, kind: 'entry', date: '2026-11-03', category: 'Progress', caption: '', plant: '', bed: '', cloudPaths: [`${user}/22222222-2222-4222-8222-222222222222/0.jpg`] };

test('merged albums retain private collection, task context, garden and space isolation', () => {
  const progress = { id, gardenId: 'garden-1', spaceId: 'space-1' };
  assert.ok(inPhotoCollection(progress, user, undefined, 'garden-1', undefined, 'space-1'));
  assert.equal(inPhotoCollection(progress, user, undefined, 'garden-1', undefined, 'space-2'), false);
  for (const collection of ['inspiration', 'tasks', 'bouquets']) {
    const entry = { id, collection, ...(collection === 'tasks' ? { contextId: 'task-1' } : {}) };
    assert.ok(inPhotoCollection(entry, user, collection));
    assert.equal(inPhotoCollection(entry, user), false);
    assert.equal(inPhotoCollection(entry, 'another-user', collection), false);
    assert.equal(inPhotoCollection(entry, user, undefined, 'garden-1'), false);
  }
  assert.equal(inPhotoCollection({ id, collection: 'tasks', contextId: 'task-1' }, user, 'tasks', undefined, 'task-2'), false);
});

test('legacy synthetic garden inspiration is readable only in inspiration without rewriting it', () => {
  const legacy = { ...manifest, gardenId: 'garden-inspiration' };
  const original = JSON.stringify(legacy);
  assert.ok(inPhotoCollection(legacy, user, 'inspiration'));
  assert.equal(inPhotoCollection(legacy, user), false);
  assert.equal(inPhotoCollection(legacy, user, 'tasks'), false);
  assert.equal(inPhotoCollection(legacy, user, 'bouquets'), false);
  assert.equal(inPhotoCollection(legacy, 'another-user', 'inspiration'), false);
  assert.ok(validCloudPhoto(legacy, user));
  assert.equal(JSON.stringify(legacy), original);
});

test('photo uploads retain collection, context and space metadata', async () => {
  const oldFetch = globalThis.fetch;
  const writes = [];
  globalThis.fetch = async (_url, options) => {
    writes.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ record: { version: 2 } }) };
  };
  try {
    const client = { auth: { getSession: async () => ({ data: { session: { access_token: 'test-only' } } }) } };
    await uploadCloudEntry(client, { ...manifest, collection: 'tasks', contextId: 'task-1', photos: [] });
    await uploadCloudEntry(client, { ...manifest, gardenId: 'garden-1', spaceId: 'space-1', photos: [] });
    assert.equal(writes[0].value.collection, 'tasks');
    assert.equal(writes[0].value.contextId, 'task-1');
    assert.equal(writes[1].value.spaceId, 'space-1');
    assert.ok(writes.every(write => validCloudPhoto(write.value, user)));
  } finally { globalThis.fetch = oldFetch; }
});

test('merged photo UI includes vision search, gallery navigation, board rename and explicit garden copy', () => {
  const source = readFileSync(new URL('../components/PhotoJournal.tsx', import.meta.url), 'utf8');
  for (const feature of ['vision-gallery', 'Find an idea', 'GalleryViewer', 'copyToGarden', 'renameBoard', 'inPhotoCollection(item, userId, collection, gardenId, contextId, spaceId)']) assert.ok(source.includes(feature), feature);
  assert.ok(source.includes('spaceId:entry.spaceId,deleted:true'));
});

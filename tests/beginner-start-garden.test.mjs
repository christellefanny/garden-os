import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('closing beginner invitation retains its action and adds decorative garden color', () => {
  const source = read('components/GardenLearning.tsx');
  const band = source.match(/<section className="learning-note beginner-start-garden"[\s\S]*?<\/section>/)?.[0];
  assert.ok(band);
  assert.match(band, /aria-labelledby="beginner-start-garden-heading"/);
  assert.match(band, /id="beginner-start-garden-heading">Start your garden/);
  assert.match(band, /Put the six steps into practice with a simple garden layout\./);
  assert.match(band, /onClick=\{onPlan\}>Start Your Garden<\/button>/);
  assert.match(band, /className="beginner-start-garden-art" aria-hidden="true"/);
  for (const plant of ['tomato', 'basil', 'zinnia']) {
    assert.match(band, new RegExp(`src="/planting-now/${plant}\\.webp"[^>]*alt=""`));
    assert.ok(statSync(new URL(`../public/planting-now/${plant}.webp`, import.meta.url)).size > 0);
  }
  assert.ok(source.indexOf(band) > source.indexOf('className="learning-guide-grid"'));
  assert.equal((band.match(/<button /g) || []).length, 1);
});

test('closing illustration stays in its own responsive, non-interactive column', () => {
  const css = read('app/globals.css');
  assert.match(css, /\.learning-note\.beginner-start-garden\s*\{[^}]*display:grid;[^}]*minmax\(0,1fr\)/);
  assert.match(css, /\.beginner-start-garden-art\s*\{[^}]*pointer-events:none/);
  assert.match(css, /\.beginner-start-garden-art img\s*\{[^}]*mask-image:radial-gradient/);
  assert.match(css, /@media\(max-width:600px\)\{\.learning-note\.beginner-start-garden\{grid-template-columns:minmax\(0,1fr\)/);
});

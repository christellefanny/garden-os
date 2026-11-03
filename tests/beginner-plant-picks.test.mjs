import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as plants from '../lib/beginner-plants.ts';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const require = createRequire(import.meta.url);
const moduleStyles = new Proxy({}, { get: (_, key) => key === '__esModule' ? false : String(key) });
const exports = {};
const source = read('components/BeginnerPlantPicks.tsx');
const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
vm.runInNewContext(code, { exports, require: name => ({
  '@/lib/beginner-plants': plants,
  './BeginnerPlantPicks.module.css': moduleStyles,
  'next/image': ({ src, alt, width, height, style }) => React.createElement('img', { src, alt, width, height, style }),
}[name] || require(name)) });
const Picks = exports.default;
const escaped = text => renderToStaticMarkup(React.createElement('span', {}, text)).slice(6, -7);

test('eight researched options have complete growing information and valid source URLs', () => {
  assert.equal(plants.BEGINNER_PLANTS.length, 8);
  assert.equal(new Set(plants.BEGINNER_PLANTS.map(p => p.id)).size, 8);
  for (const kind of ['vegetable', 'flower']) assert.equal(plants.BEGINNER_PLANTS.filter(p => p.kind === kind).length, 4);
  for (const plant of plants.BEGINNER_PLANTS) {
    for (const field of ['id', 'name', 'season', 'light', 'why', 'start', 'timing', 'spacing', 'container', 'care', 'timeToReward', 'companions', 'caution']) assert.ok(typeof plant[field] === 'string' && plant[field].length > 3, `${plant.id}: ${field}`);
    assert.ok(plant.sources.length > 0);
    for (const source of plant.sources) { assert.ok(source.label.length > 5); assert.equal(new URL(source.url).protocol, 'https:'); }
    if (plant.guideSlug) assert.match(plant.guideSlug, /^[a-z-]+$/);
  }
  assert.ok(plants.BEGINNER_COMPANION_NOTE.length > 100);
  assert.ok(plants.BEGINNER_COMPANION_SOURCES.length > 0);
});

test('page and popup expose the same complete cards and safely open public flower guides', () => {
  for (const mode of ['page', 'dialog']) {
    const html = renderToStaticMarkup(React.createElement(Picks, { mode }));
    assert.equal((html.match(/<details /g) || []).length, 8);
    assert.equal((html.match(/<summary /g) || []).length, 8);
    assert.match(html, new RegExp(`<h${mode === 'page' ? 2 : 3} id="beginner-plants-heading"`));
    assert.match(html, /not a shopping list/);
    assert.doesNotMatch(html, /role="dialog"|<button|<input|<form|<details[^>]* open=/);
    for (const plant of plants.BEGINNER_PLANTS) {
      for (const field of ['name', 'season', 'light', 'why', 'start', 'timing', 'spacing', 'container', 'care', 'timeToReward', 'companions', 'caution']) assert.ok(html.includes(escaped(plant[field])), `${mode}: ${plant.id} ${field}`);
      for (const source of plant.sources) assert.ok(html.includes(`href="${escaped(source.url)}" target="_blank" rel="noopener noreferrer"`));
      if (plant.guideSlug) assert.ok(html.includes(`href="/flower-corner/${plant.guideSlug}" target="_blank" rel="noopener noreferrer"`));
    }
  }
});

test('native keyboard disclosures remain intact, with scoped focus and narrow-layout styles', () => {
  assert.match(source, /<details/); assert.match(source, /<summary/);
  assert.doesNotMatch(source, /onKeyDown|preventDefault|tabIndex|aria-expanded|localStorage|supabase|fetch\(|navigator\./);
  const css = read('components/BeginnerPlantPicks.module.css');
  assert.match(css, /\.summary:focus-visible/);
  assert.match(css, /max-width: 380px/);
  assert.match(css, /data-mode="dialog"\] \.grid \{ grid-template-columns: 1fr/);
  assert.doesNotMatch(css, /line-clamp|text-overflow:\s*ellipsis/);
  for (const path of [...source.matchAll(/src: '([^']+\.webp)'/g)].map(m => m[1])) assert.ok(statSync(new URL('../public' + path, import.meta.url)).size > 1000);
});

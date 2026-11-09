import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as spaceSoil from '../lib/growing-space-soil.ts';
import * as cropSoil from '../lib/vegetable-soil.ts';
import { SoilGuidance } from './helpers/soil-component.mjs';

const require = createRequire(import.meta.url);
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const guideSource = read('components/GrowingSpaceSoilGuide.tsx');
const editorSource = read('components/SpaceEditor.tsx');
const styles = new Proxy({}, { get: (_, key) => key === '__esModule' ? false : `space-soil-${String(key)}` });
const escaped = value => renderToStaticMarkup(React.createElement('span', null, value)).slice(6, -7);
function load(source, mocks) {
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => mocks[name] || require(name) });
  return exports.default;
}
const Guide = load(guideSource, {
  '@/components/VegetableSoilGuidance': SoilGuidance,
  '@/lib/vegetable-soil': cropSoil,
  '@/lib/growing-space-soil': spaceSoil,
  './GrowingSpaceSoilGuide.module.css': styles,
});
const renderGuide = initialContext => renderToStaticMarkup(React.createElement(Guide, { initialContext, onBack() {} }));
const inputs = html => html.match(/<input\b[^>]*>/g) || [];

// Static markup can inspect both render branches but cannot prove browser focus,
// retained FileList, keyboard handling, or actual persistence. Browser QA does that.
function renderEditor(base, guideOpen = false) {
  const Editor = load(editorSource, {
    react: { ...React, useState: initial => React.useState(initial === false ? guideOpen : initial) },
    '@/components/ui/Dialog': ({ children }) => React.createElement('div', { role: 'dialog' }, children),
    '@/components/GrowingSpaceSoilGuide': Guide,
    '@/lib/growing-space-soil': spaceSoil,
    '@/lib/garden': { spaceTypes: ['Raised Bed', 'Container', 'Hydroponic'], readDetails: notes => JSON.parse(notes) },
  });
  return renderToStaticMarkup(React.createElement(Editor, {
    space: { id: 'fixture', name: 'Draft bed', type: 'Raised Bed', length_feet: 8, width_feet: 4, notes: JSON.stringify({ garden_os: 1, notes: 'Draft note', plants: [], entries: [], raisedBedBase: base }) },
    busy: false, onSave: async () => true, onClose() {},
  }));
}

test('unknown guide context selects no radio and asks rather than guesses', () => {
  const html = renderGuide(null);
  assert.equal(inputs(html).length, 3);
  assert.ok(inputs(html).every(input => !input.includes('checked=')));
  assert.match(html, /Choose a growing setup above/);
  for (const guide of Object.values(spaceSoil.soilGuides)) assert.ok(!html.includes(escaped(guide.title)));
  assert.match(html, /<h3[^>]*tabindex="-1"/);
  assert.doesNotMatch(html, /<form|type="submit"|download=|\.pdf["?]/i);
});

test('all three explicit contexts render exactly one selected choice and complete guidance', () => {
  for (const [context, guide] of Object.entries(spaceSoil.soilGuides)) {
    const html = renderGuide(context);
    const selected = inputs(html).filter(input => input.includes('checked='));
    assert.equal(selected.length, 1, context);
    assert.ok(selected[0].includes(`value="${context}"`));
    for (const text of [guide.title, guide.intro, guide.caution, ...guide.steps.flatMap(step => [step.title, step.body])]) assert.ok(html.includes(escaped(text)), text);
    assert.match(html, /type="button"[^>]*>← Back to growing-space setup/);
  }
});

test('six materials and all 26 crops are present only as optional collapsed reading', () => {
  assert.equal(spaceSoil.soilMaterials.length, 6);
  assert.equal(cropSoil.vegetableSoilProfiles.length, 26);
  const html = renderGuide(null);
  assert.equal((html.match(/<details\b/g) || []).length, 8);
  assert.doesNotMatch(html, /<details[^>]*\bopen[=> ]/);
  for (const material of spaceSoil.soilMaterials) {
    for (const key of ['name', 'role', 'helps', 'caution']) assert.ok(html.includes(escaped(material[key])), `${material.id} ${key}`);
  }
  assert.equal((html.match(/<option\b/g) || []).length, 27);
  for (const crop of cropSoil.vegetableSoilProfiles) assert.ok(html.includes(`value="${escaped(crop.name)}"`));
  assert.doesNotMatch(html, /data-soil-guidance=/);
  assert.match(html, /Optional ingredients, not a shopping list/);
});

test('sources have safe external links with visible context and unique accessible labels', () => {
  for (const context of [null, 'ground', 'raised', 'container']) {
    const html = renderGuide(context);
    const expected = [...spaceSoil.soilMaterials.flatMap(material => material.sources), ...(context ? spaceSoil.soilGuides[context].sources : [])];
    for (const source of expected) {
      assert.match(source.url, /^https:\/\//);
      assert.ok(html.includes(`href="${escaped(source.url)}" target="_blank" rel="noopener noreferrer"`));
    }
    assert.equal((html.match(/opens in a new tab/g) || []).length, expected.length);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(ids.length, new Set(ids).size);
    for (const match of html.matchAll(/(?:aria-labelledby|for)="([^"]+)"/g)) assert.ok(ids.includes(match[1]));
  }
});

test('guide is read-only and crop context identity resets optional crop state', () => {
  assert.doesNotMatch(guideSource, /fetch\s*\(|localStorage|sessionStorage|supabase|navigator\.|onSubmit|onSave|soil_type/);
  assert.match(guideSource, /spaceId=\{`soil-guide-\$\{context \?\? "unknown"\}`\}/);
  assert.match(guideSource, /raisedBedBase=\{context === "raised" \? "open-soil" : undefined\}/);
  assert.match(guideSource, /mode="contextual"/);
  assert.match(guideSource, /headingLevel=\{4\}/);
});

test('construction is optional and unknown or malformed legacy data stays undecided', () => {
  for (const base of [undefined, 'unexpected', { legacy: true }, 'open-soil', 'closed-base']) {
    const html = renderEditor(base);
    const construction = inputs(html).filter(input => input.includes('name="raisedBedBase"'));
    assert.equal(construction.length, 3);
    assert.ok(construction.every(input => !input.includes('required')));
    const selected = construction.filter(input => input.includes('checked='));
    assert.equal(selected.length, 1);
    const expected = ['open-soil', 'closed-base'].includes(base) ? base : '';
    assert.ok(selected[0].includes(`value="${expected}"`));
    assert.match(html, /raised bed\? \(optional\)/);
  }
});

test('guide-open render retains hidden draft form instead of conditionally replacing it', () => {
  const closed = renderEditor('closed-base');
  const opened = renderEditor('closed-base', true);
  assert.doesNotMatch(closed, /<form[^>]*hidden=/);
  assert.match(opened, /data-growing-space-soil-guide/);
  assert.match(opened, /<form[^>]*hidden=""/);
  for (const html of [closed, opened]) {
    assert.match(html, /name="name"[^>]*value="Draft bed"/);
    assert.match(html, /name="notes"[^>]*>Draft note<\/textarea>/);
    assert.match(html, /type="file"[^>]*multiple=""/);
  }
  assert.match(editorSource, /<form ref=\{formRef\} hidden=\{guideOpen\}/);
  assert.match(editorSource, /onClose=\{guideOpen \? returnToSetup : onClose\}/);
  assert.match(editorSource, /onBack=\{returnToSetup\}/);
  assert.match(editorSource, /raisedBedBase: type === "Raised Bed" \? raisedBedBase \|\| undefined : undefined/);
});

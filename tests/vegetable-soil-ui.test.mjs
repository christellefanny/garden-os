import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SoilGuidance, soilComponentSource } from './helpers/soil-component.mjs';
import { getVegetableSoilProfile, vegetableSoilProfiles } from '../lib/vegetable-soil.ts';

const render = props => renderToStaticMarkup(React.createElement(SoilGuidance, props));
const escaped = value => renderToStaticMarkup(React.createElement('span', null, value)).slice(6, -7);
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('every full crop card renders three sourced rows with collapsed optional detail', () => {
  for (const profile of vegetableSoilProfiles) {
    const html = render({ name: profile.name, category: 'Vegetable' });
    assert.match(html, /Soil &amp; drainage/);
    assert.equal((html.match(/<dt>/g) || []).length, 3, profile.id);
    for (const field of ['bed', 'container', 'moisture']) assert.ok(html.includes(escaped(profile[field])), `${profile.id} ${field}`);
    assert.match(html, /<details class="soil-learnMore"><summary>/);
    assert.doesNotMatch(html, /<details[^>]* open=|<button|<input|<form|role="dialog"/);
    for (const source of profile.sources) assert.ok(html.includes(`href="${escaped(source.url)}" target="_blank" rel="noopener noreferrer"`));
    assert.match(html, /opens in a new tab/);
    assert.match(html, /closed bottom uses container guidance/);
    assert.match(html, /designed water reservoir is different/);
    assert.match(html, /how acidic or alkaline soil is/);
    if (profile.ph) {
      assert.ok(html.includes(`${profile.ph.min.toFixed(1)}–${profile.ph.max.toFixed(1)}`));
      assert.match(html, /not a measurement of your soil/);
    } else {
      assert.match(html, /haven’t listed a verified soil pH range/);
      assert.doesNotMatch(html, /Preferred soil pH:/);
    }
  }
});

test('contextual advice defaults from explicit space type without changing the crop copy', () => {
  const profile = getVegetableSoilProfile('Tomato');
  for (const [spaceType, chosen, omitted] of [
    ['Container', 'container', 'bed'], ['Grow Bag', 'container', 'bed'], ['Growing Bag', 'container', 'bed'],
    ['Raised Bed', 'bed', 'container'], ['In-ground Bed', 'bed', 'container'],
  ]) {
    const html = render({ name: 'Tomato', spaceType, mode: 'contextual' });
    assert.ok(html.includes(escaped(profile[chosen])), spaceType);
    assert.ok(!html.includes(escaped(profile[omitted])), spaceType);
    assert.ok(html.includes(escaped(profile.moisture)), spaceType);
    assert.equal((html.match(/<button type="button"/g) || []).length, 2);
    assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
    assert.equal((html.match(/aria-pressed="false"/g) || []).length, 1);
    assert.match(html, /role="group" aria-label="Soil guidance growing method"/);
    assert.doesNotMatch(html, /role="tab"|role="tablist"|type="submit"/);
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map(match => match[1]);
    assert.ok(controls.every(id => html.includes(`id="${id}"`)));
  }
});

test('unknown growing methods request a choice rather than guessing the rooting medium', () => {
  for (const spaceType of [undefined, 'Greenhouse', 'Patio', 'Unknown']) {
    const html = render({ name: 'Tomato', spaceType, mode: 'contextual' });
    assert.match(html, /Choose a growing method/);
    assert.equal((html.match(/aria-pressed="false"/g) || []).length, 2);
    assert.equal((html.match(/<dt>/g) || []).length, 0);
    assert.doesNotMatch(html, /aria-pressed="true"/);
  }
});

test('hydroponic spaces never receive soil pH ranges or ordinary watering instructions', () => {
  for (const mode of ['full', 'contextual']) {
    const html = render({ name: 'Tomato', category: 'Vegetable', spaceType: 'Hydroponic', mode });
    assert.match(html, /do not apply to a hydroponic nutrient solution/);
    assert.doesNotMatch(html, /<dt>|<details|<button|Preferred soil pH|6\.0–6\.8/);
    assert.ok(!html.includes(escaped(getVegetableSoilProfile('Tomato').moisture)));
  }
});

test('unknown vegetable fallback is honest and unrelated categories stay hidden', () => {
  const html = render({ name: 'Mystery vegetable', category: 'Vegetable' });
  assert.match(html, /don’t have verified soil guidance for Mystery vegetable yet/);
  assert.match(html, /You can still save your plant/);
  assert.doesNotMatch(html, /<details|<button|<input|<dt>|Preferred soil pH|Sources &amp;/);
  for (const props of [
    { name: '' }, { name: '  ', category: 'Vegetable' }, { name: 'Unknown' }, { name: 'Unknown', category: 'Other' },
    { name: 'Tomato', category: 'Flower' }, { name: 'Basil', category: 'Herb' }, { name: 'Carrot flower' },
  ]) assert.equal(render(props), '', JSON.stringify(props));
});

test('multiple cards have unique labels and controls, with caller-appropriate heading depth', () => {
  const html = renderToStaticMarkup(React.createElement('div', null,
    ...[3, 4, 5].map(headingLevel => React.createElement(SoilGuidance, { key: headingLevel, name: 'Tomato', mode: 'contextual', spaceType: 'Container', headingLevel }))));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const level of [3, 4, 5]) assert.match(html, new RegExp(`<h${level} id="[^"]+" class="soil-heading">`));
  assert.match(html, /for Tomato<\/span>/);
  const labelled = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map(match => match[1]);
  assert.ok(labelled.every(id => ids.includes(id)));
});

test('crop, category, mode or growing-space changes remount optional UI state', () => {
  const original = SoilGuidance({ name: 'Tomato', category: 'Vegetable', mode: 'contextual', spaceId: 'pot-a', spaceType: 'Container' });
  for (const change of [{ name: 'Lettuce' }, { category: 'Other' }, { mode: 'full' }, { spaceType: 'Raised Bed' }, { spaceId: 'pot-b' }, { spaceId: undefined }]) {
    const next = SoilGuidance({ name: 'Tomato', category: 'Vegetable', mode: 'contextual', spaceId: 'pot-a', spaceType: 'Container', ...change });
    assert.notEqual(original.key, next.key);
  }
  assert.doesNotMatch(soilComponentSource, /localStorage|sessionStorage|fetch\(|supabase|navigator\.|onSubmit|soil_type/);
});

test('integration keeps native forms and includes public reading without auth gates', () => {
  const vault = read('components/PlantVault.tsx');
  assert.ok(vault.indexOf('<VegetableSoilGuidance name={viewedPlant.name}') < vault.indexOf('<CompanionPlanting name={viewedPlant.name}'));
  const space = read('components/SpacePanel.tsx');
  assert.match(space, /name=\{selected\?\.name \?\? plantName\}/);
  assert.match(space, /spaceType=\{space\.type\}/);
  assert.match(space, /spaceId=\{space\.id\}/);
  assert.match(read('components/PlantPlanner.tsx'), /spaceId=\{selected\?\.id\}/);
  assert.ok(space.indexOf('<VegetableSoilGuidance') < space.indexOf('Quantity\n'));
  assert.match(space, /guidanceCategory = resolvePlantCategory\(plantName, selected, editedPlant\)/);
  assert.match(space, /category: resolvePlantCategory\(name, selected, editedPlant\)/);
  const beginner = read('components/BeginnerPlantPicks.tsx');
  assert.match(beginner, /plant\.kind === 'vegetable' && <VegetableSoilGuidance/);
  assert.doesNotMatch(beginner, /supabase|localStorage|signIn|userId/);
  const css = read('components/VegetableSoilGuidance.module.css');
  assert.match(css, /min-height: 44px/);
  assert.match(css, /summary:focus-visible/);
  assert.match(css, /max-width: 380px/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.doesNotMatch(css, /line-clamp|text-overflow:\s*ellipsis/);
});

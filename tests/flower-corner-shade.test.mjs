import { test } from 'node:test';
import assert from 'node:assert/strict';
import { additionalShadeProfiles, shadeCareEligibility } from '../lib/flower-corner-shade.ts';
import { flowerCornerProfiles } from '../lib/flower-corner-library.ts';
import { careVisualMode } from '../lib/flower-care-visuals.ts';
import {
  flowerCornerClassifications, getPlantClassification, getPlantLifecycles,
  getPlantLifecycleLabel, matchesPlantLifecycle, plantLifecycleOptions,
} from '../lib/flower-corner-classification.ts';

const byId = id => additionalShadeProfiles.find(profile => profile.id === id);
const expectedIds = ['japanese-painted-fern', 'autumn-fern', 'brunnera', 'pulmonaria', 'bergenia', 'ligularia', 'tiarella', 'bleeding-heart', 'hellebores', 'coleus'];

test('shade expansion has ten complete, distinct profiles with institutional sources', () => {
  assert.deepEqual(additionalShadeProfiles.map(profile => profile.id), expectedIds);
  assert.equal(additionalShadeProfiles.filter(profile => profile.kind === 'foliage').length, 6);
  const fields = ['name', 'botanical', 'summary', 'light', 'water', 'spacing', 'matureSize', 'indoorStart', 'directSow', 'transplant', 'germination', 'sowToBloom', 'pinching', 'deadheading', 'cutback', 'feeding', 'problems', 'bouquet', 'seedSaving'];
  for (const profile of additionalShadeProfiles) {
    for (const field of fields) assert.ok(profile[field]?.length >= (field === 'name' ? 3 : 8), `${profile.id}.${field}`);
    assert.equal(profile.reviewed, '2026-11-03');
    assert.ok(profile.notes.length >= 2, profile.id);
    assert.ok(profile.sources.length >= 2, profile.id);
    assert.match(profile.light, /shade/i, profile.id);
    for (const source of profile.sources) {
      const url = new URL(source.url);
      assert.equal(url.protocol, 'https:');
      assert.ok(url.hostname.endsWith('.edu') || url.hostname === 'www.rhs.org.uk', source.url);
      assert.ok(source.title.length > 10);
      assert.equal(url.search, '');
      assert.equal(url.hash, '');
    }
  }
});

test('every integrated profile has explicit sourced lifecycle metadata', () => {
  assert.equal(new Set(flowerCornerProfiles.map(profile => profile.id)).size, flowerCornerProfiles.length);
  assert.ok(flowerCornerProfiles.length >= 55);
  assert.deepEqual(Object.keys(flowerCornerClassifications).sort(), flowerCornerProfiles.map(profile => profile.id).sort());
  for (const profile of flowerCornerProfiles) {
    const classification = getPlantClassification(profile);
    assert.ok(classification, profile.id);
    assert.ok(classification.botanicalLifecycles.length > 0, profile.id);
    assert.equal(typeof classification.grownAsAnnual, 'boolean');
    assert.ok(classification.label.length >= 6);
    assert.ok(classification.note.length > 30);
    assert.ok(classification.sourceUrls.length > 0);
    for (const value of classification.botanicalLifecycles) assert.ok(['annual', 'biennial', 'perennial'].includes(value));
    for (const source of classification.sourceUrls) assert.equal(new URL(source).protocol, 'https:');
    assert.deepEqual(getPlantLifecycles(profile), getPlantLifecycles(profile.id));
  }
});

test('lifecycle filters retain botanical distinctions and grown-as-annual nuance', () => {
  assert.deepEqual(getPlantLifecycles('zinnias'), ['annual']);
  assert.deepEqual(getPlantLifecycles('hosta'), ['perennial']);
  assert.deepEqual(getPlantLifecycles('coleus'), ['annual', 'perennial']);
  assert.deepEqual(getPlantClassification('coleus').botanicalLifecycles, ['perennial']);
  assert.match(getPlantLifecycleLabel('coleus'), /Tender perennial.*grown as annual/);
  for (const id of ['rudbeckia', 'lisianthus', 'statice', 'scabiosa', 'dianthus', 'violas']) {
    assert.deepEqual(getPlantLifecycles(id), ['annual', 'biennial', 'perennial'], id);
  }
  assert.equal(matchesPlantLifecycle('china-asters', 'perennial'), false);
  assert.equal(matchesPlantLifecycle('perennial-asters', 'annual'), false);
  assert.equal(matchesPlantLifecycle('bleeding-heart', 'perennial'), true);
  assert.equal(matchesPlantLifecycle('bleeding-heart', 'annual'), false);
  assert.equal(matchesPlantLifecycle('anything', 'all'), true);
  assert.deepEqual(getPlantLifecycles('not-a-known-plant'), []);
  assert.deepEqual(getPlantLifecycles('__proto__'), []);
  assert.deepEqual(getPlantLifecycles('constructor'), []);
  assert.equal(matchesPlantLifecycle('not-a-known-plant', 'perennial'), false);
  assert.deepEqual(plantLifecycleOptions.map(option => option.value), ['annual', 'biennial', 'perennial']);
});

test('lifecycle arrays returned to consumers cannot mutate reference metadata', () => {
  const values = getPlantLifecycles('hosta');
  values.push('annual');
  assert.deepEqual(getPlantLifecycles('hosta'), ['perennial']);
});

test('ferns never inherit flower-seed, pinching or deadheading instructions', () => {
  for (const id of ['japanese-painted-fern', 'autumn-fern']) {
    const profile = byId(id);
    assert.match(profile.indoorStart, /spores/);
    assert.match(profile.sowToBloom, /No flowers|Never flowers/);
    assert.match(profile.seedSaving, /no seeds/i);
    assert.match(profile.pinching, /Do not pinch/);
    assert.equal(shadeCareEligibility[id].pinching, 'leave-intact');
    assert.equal(shadeCareEligibility[id].deadheading, 'leave-intact');
  }
});

test('care illustration eligibility is species-specific and complete', () => {
  assert.deepEqual(Object.keys(shadeCareEligibility).sort(), [...expectedIds].sort());
  assert.deepEqual(Object.entries(shadeCareEligibility).filter(([, modes]) => modes.pinching === 'pinch').map(([id]) => id), ['coleus']);
  assert.equal(shadeCareEligibility['bleeding-heart'].deadheading, 'leave-intact');
  assert.equal(shadeCareEligibility['bleeding-heart'].cutback, 'dormant');
  assert.equal(shadeCareEligibility.hellebores.cutback, 'selective');
  assert.equal(shadeCareEligibility.bergenia.cutback, 'selective');
  assert.equal(shadeCareEligibility.coleus.cutback, 'trim');
  for (const profile of additionalShadeProfiles) {
    assert.notEqual(profile.pinching, profile.deadheading, profile.id);
    assert.notEqual(profile.deadheading, profile.cutback, profile.id);
    for (const technique of ['pinching', 'deadheading', 'cutback']) {
      assert.equal(careVisualMode(profile.id, technique), shadeCareEligibility[profile.id][technique], `${profile.id}.${technique}`);
    }
  }
});

test('shade references preserve timing, dormancy, toxicity and propagation caveats', () => {
  assert.match(byId('coleus').germination, /10–14 days.*70–75°F/);
  assert.match(byId('coleus').indoorStart, /8–10 weeks/);
  assert.match(byId('coleus').sowToBloom, /not a bloom countdown/);
  assert.match(byId('hellebores').sowToBloom, /4–5 years/);
  assert.match(byId('bleeding-heart').sowToBloom, /2–3 years/);
  assert.match(byId('bleeding-heart').cutback, /naturally died back/);
  assert.match(byId('brunnera').seedSaving, /Seedlings may vary/);
  assert.match(byId('tiarella').seedSaving, /two genetically distinct/i);
  assert.match(byId('autumn-fern').problems, /invasive/);
  assert.match(byId('hellebores').problems, /poisonous/);
  assert.match(byId('bleeding-heart').problems, /poisonous/);
  assert.match(byId('ligularia').botanical, /dentata/);
  assert.match(byId('ligularia').notes.join(' '), /not the narrow flower spires/);
});

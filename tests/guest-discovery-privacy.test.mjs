import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import jsx from 'react/jsx-runtime';
import ts from 'typescript';
import * as calendar from '../lib/growing-calendar.ts';
import * as garden from '../lib/garden.ts';
import * as journal from '../lib/journal.ts';
import * as seasons from '../lib/seasons.ts';
import * as navigation from '../lib/navigation.ts';
import { readGuest } from '../lib/guest.ts';
import * as plantingNow from '../lib/planting-now.ts';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
function compile(file, overrides = {}) {
  const compiled = { exports: {} };
  const output = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(output, {
    exports: compiled.exports,
    localStorage: globalThis.localStorage,
    require(name) {
      if (name in overrides) return overrides[name];
      if (name === 'react') return React;
      if (name === 'react/jsx-runtime') return jsx;
      if (name === '@/lib/growing-calendar') return calendar;
      if (name === '@/lib/garden') return garden;
      if (name === '@/lib/journal') return journal;
      if (name === '@/lib/seasons') return seasons;
      if (name === '@/lib/navigation') return navigation;
      if (name === '@/components/seasonal/SeasonProvider') return { useSeason: () => ({ season: 'fall' }) };
      if (name === '@/lib/connected-garden') return { dailyRecommendations: () => [] };
      if (name === '@/lib/garden-layout') return { initialLayout: [], nineBedLayout: () => [] };
      if (name === '@/lib/layout-design') return { gardenFootprint: () => null };
      if (name === '@/components/BlankGardenLayout') return { loadCustomLayouts: key => JSON.parse(globalThis.localStorage.getItem(key) || '[]') };
      if (name === '@/components/GuestPlantingNow') return { __esModule: true, default: () => React.createElement('section', { 'data-discovery': true }, React.createElement('h2', null, 'What to Plant Now')) };
      if (name === '@/components/GuestGardenExample') return { __esModule: true, default: () => React.createElement('section', null, 'Example plan') };
      return { __esModule: true, default: () => null };
    },
  });
  return compiled.exports;
}

function storage(values = {}) {
  const reads = [];
  globalThis.localStorage = {
    getItem(key) { reads.push(key); return values[key] ?? null; },
    setItem() { throw new Error('Rendering must not change saved work'); },
    removeItem() { throw new Error('Rendering must not remove saved work'); },
  };
  return reads;
}
const props = { userId: 'guest', gardens: [], spaces: [], allSpaces: [], vault: [], navigate() {}, onGarden() {}, onNewGarden() {}, onSpace() {}, onBed() {}, onVault() {}, onEditExample() {}, onSignOut() {} };
function dashboard(overrides = {}) {
  const { ModernDashboard } = compile('components/ConservatoryUI.tsx');
  return renderToStaticMarkup(React.createElement(ModernDashboard, { ...props, ...overrides }));
}
const accountGarden = { id: 'account-garden', name: 'PRIVATE ACCOUNT GARDEN', year: 2026, location: null, hardiness_zone: null };
const guestGarden = { id: 'guest-garden', name: 'My guest balcony', year: 2026, location: null, hardiness_zone: null };

test('discovery asks visitors to find their growing zone', () => {
  storage();
  const { default: GuestPlantingNow } = compile('components/GuestPlantingNow.tsx', {
    '@/lib/planting-now': plantingNow,
  });
  const html = renderToStaticMarkup(React.createElement(GuestPlantingNow));
  assert.match(html, />Find my growing zone<\/button>/);
  assert.doesNotMatch(html, /Find my growing location/);
});

test('fresh guest home foregrounds discovery without example layouts or empty activity cards', () => {
  storage();
  const html = dashboard();
  assert.match(html, /guest-discovery-lead/);
  assert.equal((html.match(/What to Plant Now/g) || []).length, 1);
  assert.ok(html.indexOf('What to Plant Now') < html.indexOf('atelier-welcome-note'));
  assert.doesNotMatch(html, /<h2>My Gardens<\/h2>|A possibility for your garden|Vegetable garden|Flower garden|Herb garden|Example plan|<h2>My Garden Layout<\/h2>|This Week|Recent Observations/);
  assert.doesNotMatch(html, /modern-main-grid|modern-bottom-grid/);
});

test('returning guest keeps real local gardens and scoped notes; account cache is never read', () => {
  const values = {
    'garden-os-guest-data': JSON.stringify({ gardens: [guestGarden], spaces: [] }),
    'garden-os-journal-guest': JSON.stringify([{ id: 'guest-note', kind: 'Note', date: '2026-11-06', text: 'Guest balcony note' }]),
    'garden-os-journal-account': JSON.stringify([{ id: 'private-note', kind: 'Note', date: '2026-11-06', text: 'PRIVATE ACCOUNT NOTE' }]),
    'garden-os-custom-layouts-v1-account-account-garden': JSON.stringify([{ name: 'PRIVATE ACCOUNT LAYOUT' }]),
  };
  const reads = storage(values);
  const before = JSON.stringify(values);
  const guest = readGuest();
  const html = dashboard({ gardens: guest.gardens, garden: guest.gardens[0] });
  assert.match(html, /<h2>My Gardens<\/h2>|My guest balcony/);
  assert.match(html, /My guest balcony/);
  assert.match(html, /Recent Observations/);
  assert.match(html, /Guest balcony note/);
  assert.doesNotMatch(html, /This Week|Example plan|guest-discovery-lead|PRIVATE ACCOUNT|A possibility for your garden/);
  assert.ok(reads.every(key => !key.includes('-account')));
  assert.equal(JSON.stringify(values), before);
});

test('a guest task and actual saved layouts display independently from observations', () => {
  const today = calendar.localDay();
  storage({
    'garden-os-layout-selection-guest-planning': 'guest-layout',
    'garden-os-custom-layouts-v1-guest-planning': JSON.stringify([{ id: 'guest-layout', name: 'Saved balcony layout', items: [] }]),
    'garden-os-calendar-guest': JSON.stringify({
      ...calendar.calendarDefaults,
      reminders: [{ id: 'custom|guest-task', plantId: '', title: 'Water the seedlings', date: today }],
    }),
  });
  const html = dashboard();
  assert.match(html, /<h2>My Garden Layout<\/h2>/);
  assert.match(html, /Saved balcony layout/);
  assert.match(html, /This Week/);
  assert.match(html, /Water the seedlings/);
  assert.doesNotMatch(html, /Recent Observations|Example plan/);

  storage({ 'garden-os-layout-2027-guest-planning': JSON.stringify([{ id: 'flowers', name: 'My flower bed' }]) });
  const legacy = dashboard();
  assert.match(legacy, /Your saved nine-bed layout/);
  assert.doesNotMatch(legacy, /This Week|Recent Observations|Example plan/);
});

test('signed-in home retains its account collection without guest discovery layout', () => {
  storage({
    'garden-os-journal-account': JSON.stringify([{ id: 'private-note', kind: 'Note', date: '2026-11-06', text: 'PRIVATE ACCOUNT NOTE' }]),
    'garden-os-journal-guest': JSON.stringify([{ id: 'guest-note', kind: 'Note', date: '2026-11-06', text: 'GUEST ONLY NOTE' }]),
  });
  const html = dashboard({ userId: 'account', gardens: [accountGarden], garden: accountGarden });
  assert.match(html, /<h2>My Gardens<\/h2>/);
  assert.match(html, /PRIVATE ACCOUNT GARDEN/);
  assert.match(html, /PRIVATE ACCOUNT NOTE/);
  assert.match(html, /Example plan/);
  assert.match(html, /This Week/);
  assert.doesNotMatch(html, /guest-discovery-lead|GUEST ONLY NOTE/);
  assert.ok(html.indexOf('My Gardens') < html.indexOf('What to Plant Now'));
});

test('signed-in dashboard retains both empty activity cards', () => {
  storage();
  const html = dashboard({ userId: 'account' });
  assert.match(html, /No scheduled steps this week/);
  assert.match(html, /Your observations belong here/);
});

test('Home ends with a secondary sign-out button for signed-in accounts only', () => {
  storage();
  assert.doesNotMatch(dashboard(), /Sign out/);
  const html = dashboard({ userId: 'account' });
  assert.match(html, /<footer[^>]*><button type="button" class="seasonal-outline[^"]*">Sign out<\/button><\/footer><\/div>$/);
});

function app({ session = null, guest = null, data = null }) {
  const values = [session, guest, false, '', 0, false, false, data, '', false];
  let index = 0;
  const { default: GardenApp } = compile('components/GardenApp.tsx', {
    react: { ...React, useEffect() {}, useState: () => [values[index++], () => {}] },
    '@/lib/guest': { GUEST_ID: 'guest' },
    '@/components/CloudDataBoundary': { __esModule: true, default: ({ userId, children }) => React.createElement('div', { 'data-sync-identity': userId }, children) },
    '@/components/GardenWorkspace': { __esModule: true, default: ({ userId, initialGardens }) => React.createElement('div', { 'data-workspace-identity': userId }, initialGardens.map(g => g.name).join(', ')) },
  });
  return renderToStaticMarkup(React.createElement(GardenApp));
}

test('signed-out guest branch cannot reuse stale account gardens', () => {
  storage();
  const html = app({ guest: { gardens: [guestGarden], spaces: [] }, data: { userId: 'account', gardens: [accountGarden], spaces: [], error: '' } });
  assert.match(html, /data-workspace-identity="guest"/);
  assert.match(html, /My guest balcony/);
  assert.doesNotMatch(html, /PRIVATE ACCOUNT GARDEN/);
});

test('signed-in branch uses matching account data and never stale guest data', () => {
  storage();
  const html = app({ session: { user: { id: 'account' } }, guest: { gardens: [guestGarden], spaces: [] }, data: { userId: 'account', gardens: [accountGarden], spaces: [], error: '' } });
  assert.match(html, /data-workspace-identity="account"/);
  assert.match(html, /PRIVATE ACCOUNT GARDEN/);
  assert.doesNotMatch(html, /My guest balcony/);
});

test('account switching waits instead of displaying the preceding account records', () => {
  storage();
  const html = app({ session: { user: { id: 'other-account' } }, data: { userId: 'account', gardens: [accountGarden], spaces: [], error: '' } });
  assert.match(html, /Opening your garden/);
  assert.doesNotMatch(html, /PRIVATE ACCOUNT GARDEN|data-workspace-identity/);
});

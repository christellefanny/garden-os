import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as learning from '../lib/garden-learning.ts';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const require = createRequire(import.meta.url);
function compile(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(read(file), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, ...globals, require: name => name in mocks ? mocks[name] : require(name) });
  return exports;
}
const MockLink = ({ children, href, ...props }) => React.createElement('a', { href, ...props }, children);
const MockDialog = ({ title, children }) => React.createElement('section', { role: 'dialog', 'aria-label': title }, children);
const MockSources = compile('components/LearningSources.tsx').default;
const progressCalls = [];
const articleMocks = {
  react: { ...React, useState: initial => [initial, () => {}] },
  'next/link': MockLink,
  '@/components/LearningSources': MockSources,
  '@/lib/garden-learning': learning,
  '@/components/useLearningProgress': { useLearningProgress: userId => { progressCalls.push(userId); return { checks: { 'space:0': true }, setCheck: () => {}, disabled: false, error: '' }; } },
};
const Article = compile('components/BeginnerGuideArticle.tsx', articleMocks).default;

test('one shared lesson renderer preserves every step, checklist and source in tab and popup modes', () => {
  for (const guide of learning.beginnerGuides) {
    const page = renderToStaticMarkup(React.createElement(Article, { guide, userId: 'guest', mode: 'page' }));
    const popup = renderToStaticMarkup(React.createElement(Article, { guide, userId: 'guest', mode: 'dialog', onNext: () => {} }));
    for (const text of [guide.intro, ...guide.steps, guide.mistake, ...guide.checklist]) {
      const escaped = renderToStaticMarkup(React.createElement('span', {}, text)).slice(6, -7);
      assert.ok(page.includes(escaped), guide.id + ' page body'); assert.ok(popup.includes(escaped), guide.id + ' popup body');
    }
    for (const source of guide.sources) { assert.ok(page.includes(`href="${source.url}"`)); assert.ok(popup.includes(`href="${source.url}"`)); }
    assert.equal((page.match(/<h1 /g) || []).length, 1);
    assert.doesNotMatch(popup, /<h1 /);
    assert.match(page, /href="\/beginners-guide\//);
    assert.match(popup, /<button[^>]*>Next guide →|<button[^>]*>Return to the first guide/);
    assert.doesNotMatch(page, /role="dialog"|learning-modal-article/);
    assert.match(popup, /learning-modal-article/);
    assert.match(page, /shared between your tabs/);
  }
});

test('Design your space appears near the end of only the space lesson in both render modes', () => {
  for (const guide of learning.beginnerGuides) {
    for (const mode of ['page', 'dialog']) {
      const html = renderToStaticMarkup(React.createElement(Article, { guide, userId: 'guest', mode }));
      assert.doesNotMatch(html, /Try it in Plan/);
      if (guide.id !== 'space') {
        assert.doesNotMatch(html, /Design your space|Open Plan &amp; Design/);
        continue;
      }
      assert.equal((html.match(/Open Plan &amp; Design/g) || []).length, 1);
      assert.match(html, /<section[^>]*aria-labelledby="beginner-design-heading"/);
      assert.match(html, new RegExp(`<h${mode === 'page' ? 2 : 3} id="beginner-design-heading">Design your space</h`));
      assert.match(html, /Ready to start your garden\?/);
      const design = html.indexOf('id="beginner-design-heading"');
      assert.ok(design > html.lastIndexOf('class="learning-check"'), 'Invitation follows the practical checklist');
      assert.ok(design < html.indexOf('Sources and further reading'), 'Invitation stays inside the lesson before sources');
      assert.match(html, mode === 'page' ? /<a[^>]*href="\/\?view=garden-layout"[^>]*>Open Plan &amp; Design<\/a>/ : /<button[^>]*>Open Plan &amp; Design<\/button>/);
    }
  }
});

function descendants(node) {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(descendants)];
}
test('space design actions retain the page workspace hook and popup navigation callback', () => {
  let pageClicks = 0, popupClicks = 0;
  const guide = learning.beginnerGuides[0];
  const page = Article({ guide, userId: 'guest', mode: 'page', onWorkspaceNavigate: () => pageClicks++ });
  const popup = Article({ guide, userId: 'guest', mode: 'dialog', onPlan: () => popupClicks++ });
  const pageAction = descendants(page).find(node => node.props.href === '/?view=garden-layout');
  const popupAction = descendants(popup).find(node => node.type === 'button' && node.props.children === 'Open Plan & Design');
  assert.ok(pageAction); assert.ok(popupAction);
  assert.equal(pageAction.props.target, undefined);
  pageAction.props.onClick(); popupAction.props.onClick();
  assert.equal(pageClicks, 1); assert.equal(popupClicks, 1);
});

test('only the final guide offers Explore Plants, return and Start Your Garden in accessible responsive order', () => {
  for (const guide of learning.beginnerGuides) {
    for (const mode of ['page', 'dialog']) {
      const tree = Article({ guide, userId: 'account-a', mode });
      const nav = descendants(tree).find(node => node.type === 'nav');
      const actions = React.Children.toArray(nav.props.children);
      const final = guide.id === 'care';
      assert.deepEqual(actions.map(node => node.props.children), final ? ['Explore Plants', 'Return to the first guide', 'Start Your Garden'] : ['Next guide →']);
      assert.equal(nav.props['aria-label'], 'Guide next steps');
      if (!final) continue;
      assert.match(nav.props.className, /grid-cols-1.*sm:grid-cols-3/);
      for (const action of actions) assert.match(action.props.className, /min-h-11/);
      if (mode === 'page') assert.deepEqual(actions.map(node => node.props.href), ['/?view=plant-vault', '/beginners-guide/space', '/?view=garden-layout']);
      else assert.ok(actions.every(node => node.type === 'button'));
    }
  }
});

test('signed-in final actions use the actual vault and designer without changing helper navigation', () => {
  const events = [];
  const props = { guide: learning.beginnerGuides.at(-1), userId: 'account-a' };
  const popup = Article({ ...props, mode: 'dialog', onExplorePlants: () => events.push('vault'), onNext: id => events.push(id), onPlan: () => events.push('layout') });
  const popupActions = React.Children.toArray(descendants(popup).find(node => node.type === 'nav').props.children);
  popupActions.forEach(node => node.props.onClick());
  assert.deepEqual(events, ['vault', 'space', 'layout']);
  const page = Article({ ...props, mode: 'page', onWorkspaceNavigate: () => events.push('workspace') });
  const pageActions = React.Children.toArray(descendants(page).find(node => node.type === 'nav').props.children);
  pageActions[0].props.onClick(); pageActions[2].props.onClick();
  assert.deepEqual(events.slice(3), ['workspace', 'workspace']);
  const workspace = read('components/GardenWorkspace.tsx');
  assert.match(workspace, /onExplorePlants=\{\(\)=>\{setVaultQuery\(""\);navigate\("Plant Vault"\);\}\}/);
});

test('guest Explore Plants expands an inline explanation and public option, without accessing a private vault', () => {
  let expanded = false;
  const GuestArticle = compile('components/BeginnerGuideArticle.tsx', {
    ...articleMocks,
    react: { ...React, useState: () => [expanded, next => { expanded = typeof next === 'function' ? next(expanded) : next; }] },
  }).default;
  const props = { guide: learning.beginnerGuides.at(-1), userId: 'guest', mode: 'dialog', onExplorePlants: () => assert.fail('Guest must not use the vault callback') };
  let tree = GuestArticle(props);
  let explore = descendants(tree).find(node => node.type === 'button' && node.props.children === 'Explore Plants');
  assert.equal(explore.props['aria-expanded'], false);
  assert.equal(descendants(tree).find(node => node.type === 'aside').props.hidden, true);
  explore.props.onClick(); tree = GuestArticle(props);
  explore = descendants(tree).find(node => node.type === 'button' && node.props.children === 'Explore Plants');
  assert.equal(explore.props['aria-expanded'], true);
  const aside = descendants(tree).find(node => node.type === 'aside');
  assert.equal(aside.props.hidden, false); assert.equal(explore.props['aria-controls'], aside.props.id);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /Plant Vault holds your personal plant collection and is available when you sign in/);
  assert.match(html, /href="\/flower-corner"[^>]*>Explore Flower Corner/);
  assert.doesNotMatch(html, /view=plant-vault|role="dialog"|href="[^\"]*(?:signin|signup)/);
  explore.props.onClick(); assert.equal(expanded, false);
  const pending = Article({ ...props, userId: null });
  assert.equal(descendants(pending).find(node => node.type === 'button' && node.props.children === 'Explore Plants').props.disabled, true);
  const workspace = read('components/GardenWorkspace.tsx');
  assert.match(workspace, /!guest \|\| destination !== "Plant Vault"/);
  assert.match(workspace, /if \(guestMode && next === "Plant Vault"\) next = "Dashboard"/);
  assert.match(workspace, /!guestMode && vaultOpen/);
});

test('checklists never use a guest store while auth is unresolved and retain account separation', () => {
  progressCalls.length = 0;
  const guide = learning.beginnerGuides[0];
  const pending = renderToStaticMarkup(React.createElement(Article, { guide, userId: null, mode: 'page', identityMessage: 'Account unavailable' }));
  assert.deepEqual(progressCalls, []); assert.match(pending, /Account unavailable/);
  assert.equal((pending.match(/disabled=""/g) || []).length, guide.checklist.length);
  const signed = renderToStaticMarkup(React.createElement(Article, { guide, userId: 'account-1', mode: 'page' }));
  assert.deepEqual(progressCalls, ['account-1']); assert.match(signed, /checked=""/);
});

function overview({ helper = false, selected = '', kind = 'beginner' } = {}) {
  let n = 0; const values = ['', 'All', selected, helper, 'containers', 'flowers', helper, 0, ''];
  const stateChanges = [];
  const View = compile('components/GardenLearning.tsx', {
    react: { ...React, useState: () => { const index = n++; return [values[index], value => stateChanges.push([index, value])]; } },
    'next/link': MockLink,
    'next/image': ({ src, alt }) => React.createElement('img', { src, alt }),
    '@/components/ui/Dialog': MockDialog,
    '@/components/BeginnerGuideArticle': Article,
    '@/components/LearningSources': MockSources,
    '@/components/InteriorHeader': () => null,
    '@/components/BeginnerClimate': () => React.createElement('div', { 'data-climate': true }),
    '@/components/VaultBotanicalPortrait': () => null,
    '@/components/FlowerGardenPortrait': () => null,
    '@/lib/garden-learning': learning,
  }).default;
  return renderToStaticMarkup(React.createElement(View, { kind, userId: 'guest', onFlowerGarden: () => {}, onPlan: () => {}, onExplorePlants: () => {} }));
}
test('all six overview cards are isolated new-tab links, while the starting-path recommendation is a popup button', () => {
  const html = overview({ helper: true });
  assert.equal(learning.beginnerGuides.length, 6);
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer" aria-label="Step /g) || []).length, 6);
  for (const guide of learning.beginnerGuides) {
    assert.match(guide.id, /^[a-z0-9-]+$/);
    assert.ok(html.includes(`href="/beginners-guide/${guide.id}"`));
  }
  assert.match(html, /<button[^>]*>Read the space guide<\/button>/);
  assert.doesNotMatch(html, /role="dialog"/);
  assert.match(overview({ helper: true, selected: 'space' }), /role="dialog" aria-label="Choose a space you can care for"/);
  const source = read('components/GardenLearning.tsx');
  assert.match(source, /onClick=\{\(\)=>setActiveGuide\("space"\)\}>Read the space guide/);
  assert.match(source, /<BeginnerGuideArticle guide=\{selected\} userId=\{userId\} mode="dialog"/);
  assert.match(source, /section\.querySelector\("select"\)\?\.focus/); assert.match(source, /section\.scrollIntoView/);
  assert.match(source, /<BeginnerClimate /);
});

test('Beginner overview has no initial design button; the space popup owns its single invitation', () => {
  assert.doesNotMatch(overview(), /Open Plan &amp; Design|Design your space/);
  assert.doesNotMatch(overview({ helper: true }), /Open Plan &amp; Design|Design your space/);
  assert.equal((overview({ helper: true, selected: 'space' }).match(/Open Plan &amp; Design/g) || []).length, 1);
  assert.doesNotMatch(overview({ helper: true, selected: 'timing' }), /Open Plan &amp; Design|Design your space/);
  assert.match(overview({ kind: 'flowers' }), /Open Plan &amp; Design/);
});

test('overview completion invitation follows all six cards without moving into the initial hero', () => {
  for (const helper of [false, true]) {
    const html = overview({ helper });
    assert.equal((html.match(/>Start Your Garden<\/button>/g) || []).length, 1);
    assert.ok(html.indexOf('id="beginner-start-garden-heading"') > html.indexOf('href="/beginners-guide/care"'));
    assert.match(html, /Put the six steps into practice with a simple garden layout/);
  }
  assert.doesNotMatch(overview({ kind: 'flowers' }), /Start Your Garden/);
  assert.match(read('components/GardenLearning.tsx'), /onClick=\{onPlan\}>Start Your Garden/);
});

test('every dedicated guide supports a direct server request and metadata; unknown routes are rejected', async () => {
  const route = compile('app/beginners-guide/[guideId]/page.tsx', {
    'next/link': MockLink,
    'next/navigation': { notFound: () => { throw new Error('NOT_FOUND'); } },
    '@/components/BeginnerGuidePage': ({ guide }) => React.createElement('div', { 'data-guide': guide.id }, guide.title),
    '@/components/seasonal/SeasonProvider': ({ children }) => children,
    '@/lib/garden-learning': learning,
    '@/lib/seasons': { getSeason: () => 'spring' },
  });
  for (const guide of learning.beginnerGuides) {
    const props = { params: Promise.resolve({ guideId: guide.id }) };
    assert.equal((await route.generateMetadata(props)).title, `${guide.title} · Beginner’s Guide`);
    const html = renderToStaticMarkup(await route.default(props));
    assert.ok(html.includes(`data-guide="${guide.id}"`));
  }
  await assert.rejects(route.default({ params: Promise.resolve({ guideId: 'not-a-guide' }) }), /NOT_FOUND/);
  const source = read('app/beginners-guide/[guideId]/page.tsx');
  assert.match(source, /await params/); assert.doesNotMatch(source, /supabase|readGuest|userId|searchParams/);
});

function identity({ id = null, session = null, error = null } = {}) {
  let index = 0, callback, unsubscribed = false; const effects = [], updates = [], writes = [];
  const Page = compile('components/BeginnerGuidePage.tsx', {
    react: { ...React, useState: () => { const n = index++; return [n === 0 ? id : false, value => updates.push([n, value])]; }, useEffect: fn => effects.push(fn) },
    'next/link': MockLink,
    '@/components/BeginnerGuideArticle': 'article',
    '@/lib/supabase': { supabase: { auth: { getSession: async () => ({ data: { session }, error }), onAuthStateChange: fn => { callback = fn; return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } }; } } } },
  }, { localStorage: { setItem: (...args) => writes.push(args) } }).default;
  const tree = Page({ guide: learning.beginnerGuides[0] });
  return { tree, effects, updates, writes, notify: (...args) => callback(...args), unsubscribed: () => unsubscribed };
}
test('standalone reading resolves account identity, respects auth changes, and never writes by mounting', async () => {
  const signed = identity({ session: { user: { id: 'account-a' } } }); const cleanup = signed.effects[0](); await Promise.resolve();
  assert.deepEqual(signed.updates, [[0, 'account-a']]); assert.deepEqual(signed.writes, []);
  cleanup(); assert.equal(signed.unsubscribed(), true);
  const stale = identity({ session: { user: { id: 'old-account' } } }); stale.effects[0](); stale.notify('SIGNED_OUT', null); await Promise.resolve();
  assert.deepEqual(stale.updates, [[0, 'guest'], [1, false]]);
  const failure = identity({ error: new Error('Unavailable') }); failure.effects[0](); await Promise.resolve();
  assert.deepEqual(failure.updates, [[1, true]]); assert.deepEqual(failure.writes, []);
});
test('return links use fixed local destinations, and only an explicit guest return activates its existing workspace', () => {
  const guest = identity({ id: 'guest' }); assert.deepEqual(guest.writes, []);
  const nav = guest.tree.props.children[0]; assert.equal(nav.props.children.props.href, '/?view=beginners-guide');
  nav.props.children.props.onClick(); assert.deepEqual(guest.writes, [['garden-os-guest-active', 'true']]);
  const guestPlan = identity({ id: 'guest' });
  guestPlan.tree.props.children[1].props.onWorkspaceNavigate();
  assert.deepEqual(guestPlan.writes, [['garden-os-guest-active', 'true']]);
  const signed = identity({ id: 'account-a' }); signed.tree.props.children[0].props.children.props.onClick(); assert.deepEqual(signed.writes, []);
  for (const state of [{ id: null }, { id: null, error: new Error('Unavailable') }, { id: 'account-a' }]) {
    const nonGuest = identity(state);
    nonGuest.tree.props.children[1].props.onWorkspaceNavigate();
    assert.deepEqual(nonGuest.writes, [], 'Only a confirmed guest can be activated by the design action');
  }
  const source = read('components/BeginnerGuideArticle.tsx'); assert.match(source, /href="\/\?view=garden-layout"/);
  assert.doesNotMatch(source, /window\.open|searchParams|returnTo|localStorage/);
});

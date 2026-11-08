import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as navigation from '../lib/navigation.ts';

const require = createRequire(import.meta.url);
const source = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
function compile(input, mocks = {}) {
  const exports = {};
  const js = ts.transpileModule(input, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(js, { exports, require: id => id in mocks ? mocks[id] : id.startsWith('@/') ? {} : require(id) });
  return exports;
}
const ui = compile(source('components/ConservatoryUI.tsx').split('export function ConservatoryTopbar')[0], {
  '@/lib/navigation': navigation,
  'next/image': ({ src, alt }) => React.createElement('img', { src, alt }),
});
const Sections = compile(source('components/GrowingCalendarNavigation.tsx'), {
  '@/lib/navigation': navigation,
  '@/components/ConservatoryUI': { LineIcon: ui.LineIcon },
}).default;

for (const guest of [false, true]) test(`grouping retains all routes and one sidebar parent for ${guest ? 'guest' : 'account'}`, () => {
  const sidebar = navigation.navigationDestinations(guest);
  assert.equal(sidebar.filter(page => page === 'Growing Calendar').length, 1);
  assert.ok(!sidebar.includes('Tasks'));
  assert.ok(!sidebar.includes('Journal'));
  assert.equal(sidebar.includes('Plant Vault'), !guest);
  for (const { page } of navigation.growingCalendarSections) {
    assert.ok(navigation.destinations.includes(page));
    assert.ok(navigation.isGrowingCalendarDestination(page));
    assert.equal(navigation.sidebarDestination(page), 'Growing Calendar');
    const html = renderToStaticMarkup(React.createElement(ui.ConservatoryNavigation, { guest, page, navigate: () => {}, onSignOut: () => {} }));
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
    assert.match(html, /aria-current="page"[^>]*><svg[\s\S]*?<span>Calendar<\/span>/);
    assert.doesNotMatch(html, /<span>(Tasks|Garden Journal)<\/span>/);
  }
  assert.equal(navigation.sidebarDestination('Flower Garden'), 'My Gardens');
  for (const page of sidebar.filter(page => page !== 'Growing Calendar')) {
    assert.equal(navigation.sidebarDestination(page), page);
    assert.equal(navigation.isGrowingCalendarDestination(page), false);
  }
});

for (const { page } of navigation.growingCalendarSections) test(`${page} shows all three keyboard-native section buttons with one current page`, () => {
  const called = [];
  const tree = Sections({ page, navigate: next => called.push(next) });
  assert.equal(tree.props['aria-label'], 'Calendar sections');
  const buttons = React.Children.toArray(tree.props.children);
  assert.deepEqual(buttons.map(button => button.props.children[1]), ['Calendar', 'Tasks', 'Garden Journal']);
  assert.equal(buttons.filter(button => button.props['aria-current'] === 'page').length, 1);
  for (const button of buttons) {
    assert.equal(button.type, 'button');
    assert.equal(button.props.type, 'button');
    button.props.onClick();
  }
  assert.deepEqual(called, ['Growing Calendar', 'Tasks', 'Journal']);
  const html = renderToStaticMarkup(tree);
  assert.equal((html.match(/aria-hidden="true"/g) || []).length, 3);
});

test('main sidebar Calendar always opens Calendar rather than the last subsection', () => {
  for (const page of ['Tasks', 'Journal']) {
    let next;
    const tree = ui.ConservatoryNavigation({ page, navigate: value => next = value, onSignOut: () => {} });
    const nav = React.Children.toArray(tree.props.children).find(child => child.type === 'nav');
    const button = React.Children.toArray(nav.props.children).find(child => child.props['aria-current'] === 'page');
    button.props.onClick();
    assert.equal(next, 'Growing Calendar');
  }
});

test('saved calendar, tasks and journal URLs still open their existing components in either account mode', () => {
  const workspace = source('components/GardenWorkspace.tsx');
  const readPage = workspace.match(/function readPageFromUrl\(guest = false\): Destination \{[\s\S]*?\n\}/)[0];
  const pageView = workspace.match(/function pageView\(page: Destination\) \{[\s\S]*?\n\}/)[0];
  const js = ts.transpileModule(pageView + '\n' + readPage, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const guest of [false, true]) for (const [view, expected] of [['calendar', 'Growing Calendar'], ['tasks', 'Tasks'], ['journal', 'Journal']]) {
    const context = { destinations: navigation.destinations, guest, window: { location: { search: '?view=' + view } }, URLSearchParams };
    assert.equal(vm.runInNewContext(js + '\nreadPageFromUrl(guest)', context), expected);
  }
  assert.match(workspace, /isGrowingCalendarDestination\(page\) && <GrowingCalendarNavigation page=\{page\} navigate=\{navigate\}/);
  assert.match(workspace, /page === "Tasks" && \([\s\S]*?<TasksPage/);
  assert.match(workspace, /page === "Journal" && \([\s\S]*?<JournalPage/);
  assert.match(workspace, /calendarOpen && \([\s\S]*?<GrowingCalendar/);
  assert.match(workspace, /window\.addEventListener\("popstate", restorePage\)/);
});

test('Calendar focus does not scroll the shared navigation out of view', () => {
  const calendar = source('components/GrowingCalendar.tsx');
  assert.match(calendar, /headingRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.doesNotMatch(calendar, /headingRef\.current\?\.scrollIntoView/);
});

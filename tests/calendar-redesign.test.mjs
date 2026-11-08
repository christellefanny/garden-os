import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as calendar from '../lib/growing-calendar.ts';
import * as focus from '../lib/calendar-focus.ts';
const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../components/GrowingCalendar.tsx', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const plant = { id: 'basil', name: 'Basil', variety: 'Genovese', category: 'Herb', statuses: ['Have Seeds'], source: 'Test fixture', year: '2026', notes: '' };
const saved = { lastFrost: '05-15', firstFrost: '10-15', plants: {}, tasks: { 'custom|saved': { title: 'Keep these instructions', minutes: 10 } }, reminders: [{ id: 'custom|saved', plantId: 'basil', title: 'Check leaves', date: calendar.localDay() }], weekly: { enabled: false } };
function harness(plants = [plant], calendarOptions = saved) {
  const records = new Map([['garden-os-plant-vault-guest', JSON.stringify(plants)], ['garden-os-calendar-guest', JSON.stringify(calendarOptions)]]);
  const localStorage = { getItem: key => records.get(key) || null, setItem: (key, value) => records.set(key, value) };
  const states = []; let cursor = 0;
  const hooks = { ...React, useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useMemo: fn => fn(), useEffect: () => {}, useRef: () => ({ current: null }) };
  const mocks = {
    react: hooks,
    '@/lib/growing-calendar': { ...calendar, loadCalendarOptions: () => JSON.parse(records.get('garden-os-calendar-guest')) },
    '@/lib/calendar-focus': focus,
    '@/components/InteriorHeader': { default: 'InteriorHeader', InteriorStats: 'InteriorStats', __esModule: true },
  };
  const exports = {};
  vm.runInNewContext(js, { exports, localStorage, require: id => id in mocks ? mocks[id] : id.startsWith('@/components/') ? { __esModule: true, default: id.split('/').at(-1) } : require(id) });
  return { render() { cursor = 0; return exports.default({ userId: 'guest', gardens: [], onAddPlant: () => {} }); }, records, localStorage, read: () => JSON.parse(records.get('garden-os-calendar-guest')) };
}
function all(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  return [...(predicate(node) ? [node] : []), ...React.Children.toArray(node.props?.children).flatMap(child => all(child, predicate))];
}
const byClass = (tree, name) => all(tree, n => n.props?.className?.split(' ').includes(name))[0];
const text = node => typeof node === 'string' || typeof node === 'number' ? String(node) : React.Children.toArray(node?.props?.children).map(text).join('');
const button = (tree, label) => all(tree, n => n.type === 'button' && text(n) === label)[0];
const input = (tree, label) => all(tree, n => n.props?.['aria-label'] === label)[0];

test('Calendar and Today & this week share one panel with the reminder action only in the month toolbar', () => {
  const app = harness(), tree = app.render(), overview = byClass(tree, 'calendar-overview-card'), toolbar = byClass(tree, 'calendar-toolbar');
  assert.equal(all(overview, n => n.type === 'InteriorHeader')[0].props.title, 'Calendar');
  assert.equal(all(overview, n => n.props?.id === 'calendar-focus-title').length, 1);
  assert.equal(all(overview, n => n.type === 'button').length, 0);
  assert.ok(button(toolbar, 'Add reminder'));
  assert.equal(all(tree, n => n.type === 'button' && text(n).includes('Plants & planting dates')).length, 0);
  assert.ok(input(toolbar, 'Calendar month'));
});

test('one expandable planning overview retains frost editing, inclusion, and indoor/outdoor choices without changing reminders, tasks, or vault', () => {
  const app = harness(), vault = app.records.get('garden-os-plant-vault-guest');
  let tree = app.render(); const planning = byClass(tree, 'calendar-planning');
  assert.equal(planning.type, 'details'); assert.equal(text(all(planning, n => n.type === 'summary')[0]), 'Planning overview & frost dates');
  assert.equal(all(tree, n => n.type === 'Dialog' && n.props.title.includes('planning')).length, 0);
  input(planning, 'Spring frost planning date').props.onChange({ target: { value: '2027-05-20' } });
  tree = app.render(); input(tree, 'Fall frost planning date').props.onChange({ target: { value: '2027-10-10' } });
  tree = app.render(); all(byClass(tree, 'calendar-planning'), n => n.type === 'input' && n.props.type === 'checkbox')[0].props.onChange({ target: { checked: false } });
  tree = app.render(); input(tree, 'Growing setting for Basil Genovese').props.onChange({ target: { value: 'indoor' } });
  assert.deepEqual(app.read(), { ...saved, lastFrost: '05-20', firstFrost: '10-10', plants: { basil: { included: false, mode: 'indoor' } } });
  assert.equal(app.records.get('garden-os-plant-vault-guest'), vault);
  tree = app.render(); assert.equal(input(tree, 'Spring frost planning date').props.value.slice(5), '05-20');
  assert.equal(input(tree, 'Growing setting for Basil Genovese').props.value, 'indoor');
});

test('moved Add reminder opens and closes the existing plant-reminder dialog and passes the existing save callback', () => {
  const app = harness(); button(app.render(), 'Add reminder').props.onClick();
  let tree = app.render(), dialog = all(tree, n => n.type === 'Dialog' && n.props.title === 'Add reminder')[0];
  assert.ok(dialog);
  const reminders = all(dialog, n => n.type === 'PlantReminders')[0];
  assert.equal(reminders.props.plant.id, 'basil');
  assert.equal(reminders.props.onSave({ ...app.read(), reminders: [...saved.reminders, { id: 'custom|new', plantId: 'basil', title: 'New reminder', date: calendar.localDay() }] }), true);
  assert.equal(app.read().reminders.length, 2); assert.deepEqual(app.read().tasks, saved.tasks);
  dialog.props.onClose(); tree = app.render();
  assert.equal(all(tree, n => n.type === 'Dialog' && n.props.title === 'Add reminder').length, 0);
  button(tree, 'Add reminder').props.onClick();
  assert.equal(all(app.render(), n => n.type === 'Dialog' && n.props.title === 'Add reminder').length, 1);
});

test('month/year switching and interrupted week view preserve the existing selected month', () => {
  const app = harness(); input(app.render(), 'Calendar month').props.onChange({ target: { value: '2028-03' } });
  let tree = app.render(); assert.equal(input(tree, 'Calendar month').props.value, '2028-03');
  assert.equal(all(tree, n => n.type === 'BotanicalCalendar')[0].props.month, '2028-03');
  assert.equal(input(tree, 'Spring frost planning date').props.value, '2028-05-15');
  button(tree, 'This Week').props.onClick(); tree = app.render();
  const dialog = all(tree, n => n.type === 'Dialog' && n.props.title === 'This week’s tasks')[0]; assert.ok(dialog);
  dialog.props.onClose(); tree = app.render();
  assert.equal(input(tree, 'Calendar month').props.value, '2028-03');
  assert.equal(button(tree, 'Monthly Calendar').props['aria-pressed'], true);
});

test('empty calendars keep the onboarding task and plant paths after consolidation', () => {
  const app = harness([]), tree = app.render();
  assert.equal(all(tree, n => n.props?.id === 'calendar-start-title').length, 1);
  assert.equal(all(tree, n => n.type === 'AddTaskButton').length, 1);
  assert.ok(button(tree, 'Create your first garden'));
  button(tree, 'Add reminder').props.onClick();
  assert.match(text(all(app.render(), n => n.type === 'Dialog' && n.props.title === 'Add reminder')[0]), /Plant reminders need a saved plant/);
});

test('failed planning writes preserve stored data and expose the save error inside the overview', () => {
  const app = harness(), before = app.records.get('garden-os-calendar-guest');
  app.localStorage.setItem = () => { throw new Error('Storage unavailable'); };
  input(app.render(), 'Spring frost planning date').props.onChange({ target: { value: '2027-04-01' } });
  assert.equal(app.records.get('garden-os-calendar-guest'), before);
  assert.match(text(all(byClass(app.render(), 'calendar-planning'), n => n.props?.role === 'status')[0]), /Could not save calendar changes/);
});


test('Next steps is a closed-by-default native disclosure that keeps all original task content', () => {
  const app = harness(), tree = app.render(), details = byClass(tree, 'calendar-focus');
  assert.equal(details.type, 'details');
  assert.equal(details.props.open, undefined);
  const summary = React.Children.toArray(details.props.children)[0];
  assert.equal(summary.type, 'summary');
  assert.match(text(summary), /^Next steps/);
  assert.ok(byClass(details, 'calendar-focus-content'));
  assert.equal(all(details, n => n.props?.id === 'calendar-focus-title').length, 1);
  assert.equal(all(details, n => n.type === 'CalendarTaskCards').length > 0, true);
});

test('collapsed counts use the visible pending task groups and label earlier work separately', () => {
  const today = calendar.localDay();
  const dates = [today, calendar.shiftDay(today, 2), calendar.shiftDay(today, -1), today, today, calendar.shiftDay(today, 7)];
  const reminders = dates.map((date, i) => ({ id: `custom|count-${i}`, plantId: 'basil', title: `Task ${i}`, date }));
  const options = { ...saved, plants: { basil: { included: false } }, reminders, tasks: { 'custom|count-3': { status: 'done' }, 'custom|count-4': { status: 'skipped' } } };
  const app = harness([plant], options), tree = app.render();
  const summary = all(byClass(tree, 'calendar-focus'), n => n.type === 'summary')[0];
  assert.equal(text(byClass(summary, 'calendar-focus-count')), '2 tasks this week· 1 earlier');
  // Completed, skipped, and later-than-this-week tasks are not counted as next steps.
  assert.equal(all(tree, n => n.type === 'CalendarTaskCards').flatMap(n => n.props.tasks).filter(t => dates.includes(t.date)).length, 3);
  assert.deepEqual(app.read(), options);
});

test('next-step count updates after completion and uses correct singular and zero labels', () => {
  const options = { ...saved, plants: { basil: { included: false } }, reminders: [{ id: 'custom|one', plantId: 'basil', title: 'One task', date: calendar.localDay() }], tasks: {} };
  const app = harness([plant], options);
  const countText = tree => text(byClass(all(byClass(tree, 'calendar-focus'), n => n.type === 'summary')[0], 'calendar-focus-count'));
  assert.equal(countText(app.render()), '1 task this week');
  button(app.render(), 'Add reminder').props.onClick();
  const reminderEditor = all(app.render(), n => n.type === 'PlantReminders')[0];
  reminderEditor.props.onSave({ ...app.read(), tasks: { 'custom|one': { status: 'done' } } });
  assert.equal(countText(app.render()), '0 tasks this week');
  assert.equal(app.read().reminders.length, 1);
});

test('Next steps uses the same unmodified native disclosure marker as Planning overview', () => {
  const tree = harness().render();
  for (const className of ['calendar-focus', 'calendar-planning']) {
    const details = byClass(tree, className), summary = all(details, n => n.type === 'summary')[0];
    assert.equal(details.type, 'details');
    assert.equal(all(summary, n => n.type === 'svg').length, 0);
  }
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const summaryStyle = css.match(/\.conservatory-calendar \.calendar-disclosure-summary \{([^}]+)\}/)[1];
  assert.match(summaryStyle, /display:list-item;/);
  assert.match(summaryStyle, /font-size:14px;line-height:20px;font-weight:600;/);
  assert.doesNotMatch(css, /calendar-focus-chevron|calendar-focus>summary::(?:-webkit-details-marker|marker)/);
  assert.doesNotMatch(summaryStyle, /list-style:none/);
  assert.ok(byClass(tree, 'calendar-focus-count'), 'task counts stay in the compact summary');
});


test('both disclosure rows share the exact same marker inset and label layout at desktop and mobile sizes', () => {
  const tree = harness().render();
  for (const className of ['calendar-focus', 'calendar-planning']) {
    const summary = all(byClass(tree, className), n => n.type === 'summary')[0];
    assert.equal(summary.props.className, 'calendar-disclosure-summary');
    const content = React.Children.toArray(summary.props.children)[0];
    assert.equal(content.props.className, 'calendar-disclosure-summary-content');
    const label = React.Children.toArray(content.props.children)[0];
    assert.equal(label.props.className, 'calendar-disclosure-label');
  }
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const sharedStyle = css.match(/\.conservatory-calendar \.calendar-disclosure-summary \{([^}]+)\}/)[1];
  assert.match(sharedStyle, /padding:16px 20px;/);
  assert.match(css, /@media\(max-width:700px\)[^\n]*\.conservatory-calendar \.calendar-disclosure-summary\{padding-inline:16px\}/);
  assert.doesNotMatch(css, /\.calendar-(focus|planning)>summary\s*\{/);
});

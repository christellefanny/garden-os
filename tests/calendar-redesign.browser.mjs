// Isolated local fixtures only. No production services, accounts, or notifications.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { isolateBrowserContext } from './helpers/isolated-browser.mjs';
import { localDay, shiftDay } from '../lib/growing-calendar.ts';
const port = 3062, fixturePort = 54342;
const origin = `http://127.0.0.1:${port}`;
const fixtureSource = readFileSync(new URL('./fixtures/supabase.mjs', import.meta.url), 'utf8').replace('server.listen(54321,', `server.listen(${fixturePort},`);
const fixture = spawn(process.execPath, ['--input-type=module', '-e', fixtureSource], { stdio: 'ignore' });
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${fixturePort}`, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'garden-os-local-preview' }, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '', browser;
server.stdout.on('data', d => logs += d); server.stderr.on('data', d => logs += d);
const out = process.env.PREVIEW_DIR || '/tmp/calendar-redesign-preview';
mkdirSync(out, { recursive: true });
const today = localDay(), upcoming = shiftDay(today, 2), year = today.slice(0, 4);
const samplePlant = { id: 'preview-basil', name: 'Basil', variety: 'Genovese', category: 'Herb', statuses: ['Have Seeds'], source: 'Local test fixture', year, notes: '' };
try {
  let ready = false;
  for (let n = 0; n < 160; n++) { try { if ((await fetch(origin, { signal: AbortSignal.timeout(1500) })).ok) { ready = true; break; } } catch {} await new Promise(r => setTimeout(r, 250)); }
  assert.ok(ready, logs);
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  for (const guest of [true, false]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    await isolateBrowserContext(context);
    await context.route('**/api/weekly-email', route => route.fulfill({ json: { ready: true, email: 'garden@example.test', confirmed: true, version: 0, preferences: null } }));
    const user = guest ? 'guest' : 'a0a0a0a0-0000-4000-8000-000000000001';
    const options = { lastFrost: '05-15', firstFrost: '10-15', plants: { 'preview-basil': { included: false, mode: 'outdoor' } }, tasks: {}, reminders: [
      { id: 'custom|soil', plantId: 'preview-basil', title: 'Check soil moisture', date: today },
      { id: 'custom|packet', plantId: 'preview-basil', title: 'Review seed packet notes', date: upcoming },
    ] };
    await context.addInitScript(({ user, guest, samplePlant, options }) => {
      if (guest) { localStorage.setItem('garden-os-guest-active', 'true'); localStorage.setItem('garden-os-guest-warning-seen', 'true'); }
      if (!localStorage.getItem('preview-seeded')) {
        localStorage.setItem(`garden-os-plant-vault-${user}`, JSON.stringify([samplePlant]));
        localStorage.setItem(`garden-os-calendar-${user}`, JSON.stringify(options));
        localStorage.setItem('preview-seeded', 'true');
      }
    }, { user, guest, samplePlant, options });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/?view=calendar');
    if (!guest) {
      if (!(await page.getByLabel('Email', { exact: true }).isVisible())) await page.getByRole('button', { name: 'Already have an account?', exact: true }).click();
      await page.getByLabel('Email', { exact: true }).fill('garden@example.test');
      await page.getByLabel('Password', { exact: true }).fill('fixture-password');
      await page.getByRole('button', { name: 'Open my garden', exact: true }).click();
    }
    await page.getByRole('heading', { name: 'Calendar', exact: true }).waitFor();
    const sidebar = page.getByRole('navigation', { name: 'Garden Atelier navigation' });
    const sections = page.getByRole('navigation', { name: 'Calendar sections' });
    const overview = page.locator('.calendar-overview-card'), planning = page.locator('.calendar-planning');
    const toolbar = page.locator('.calendar-toolbar'), add = toolbar.getByRole('button', { name: 'Add reminder', exact: true });
    assert.equal(await overview.getByRole('heading', { name: 'Today & this week', includeHidden: true }).count(), 1);
    const nextSteps = overview.locator('.calendar-focus'), nextSummary = nextSteps.locator(':scope > summary');
    assert.equal(await nextSteps.getAttribute('open'), null);
    const markerStyles = async () => page.evaluate(() => ['.calendar-focus>summary', '.calendar-planning>summary'].map(selector => {
      const el = document.querySelector(selector), css = getComputedStyle(el), marker = getComputedStyle(el, '::marker');
      return { display: css.display, listStyleType: css.listStyleType, fontSize: marker.fontSize, fontWeight: marker.fontWeight, color: marker.color };
    }));
    const assertDisclosureAlignment = async width => {
      const boxes = await page.evaluate(() => ['.calendar-focus>summary', '.calendar-planning>summary'].map(selector => {
        const el = document.querySelector(selector), label = el.querySelector('.calendar-disclosure-label');
        const row = el.getBoundingClientRect(), text = label.getBoundingClientRect(), css = getComputedStyle(el);
        return { arrowLeft: row.left + parseFloat(css.paddingLeft), labelLeft: text.left, paddingTop: css.paddingTop, lineHeight: css.lineHeight };
      }));
      assert.ok(Math.abs(boxes[0].arrowLeft - boxes[1].arrowLeft) < 0.5, `arrow alignment at ${width}`);
      assert.ok(Math.abs(boxes[0].labelLeft - boxes[1].labelLeft) < 0.5, `label alignment at ${width}`);
      assert.equal(boxes[0].paddingTop, boxes[1].paddingTop);
      assert.equal(boxes[0].lineHeight, boxes[1].lineHeight);
    };
    const closedMarkers = await markerStyles(); assert.deepEqual(closedMarkers[0], closedMarkers[1], 'matching native markers when closed');
    await assertDisclosureAlignment(1440);
    await nextSummary.click(); await planning.locator('summary').click();
    const openMarkers = await markerStyles(); assert.deepEqual(openMarkers[0], openMarkers[1], 'matching native markers when open');
    await nextSummary.click(); await planning.locator('summary').click();
    assert.equal(await nextSteps.locator('.calendar-focus-count').innerText(), '2 tasks this week');
    assert.ok((await nextSummary.boundingBox()).height <= 56, 'closed next steps should be one compact row on desktop');
    await nextSummary.focus(); await page.keyboard.press('Enter');
    await overview.getByRole('heading', { name: 'Today & this week' }).waitFor();
    await nextSummary.focus(); await page.keyboard.press('Space');
    assert.equal(await nextSteps.getAttribute('open'), null);
    await nextSummary.click();
    assert.equal(await overview.getByRole('button', { name: 'Add reminder' }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Plants & planting dates' }).count(), 0);
    assert.equal(await sidebar.getByRole('button', { name: 'Calendar', exact: true }).getAttribute('aria-current'), 'page');
    const positions = await toolbar.evaluate(el => {
      const month = el.querySelector('input').getBoundingClientRect(), add = el.querySelector('.calendar-add-reminder').getBoundingClientRect();
      return { monthRight: month.right, addLeft: add.left, topDifference: Math.abs(month.top - add.top) };
    });
    assert.ok(positions.addLeft > positions.monthRight && positions.topDifference < 10, JSON.stringify(positions));
    // Task access and editing still work from the merged overview.
    await overview.getByRole('button', { name: 'Check soil moisture', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Mark done', exact: true }).click();
    assert.equal(await nextSteps.locator('.calendar-focus-count').innerText(), '1 task this week');
    await page.getByRole('dialog').getByRole('button', { name: 'Undo', exact: true }).click();
    assert.equal(await nextSteps.locator('.calendar-focus-count').innerText(), '2 tasks this week');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    // Existing settings now live in one keyboard-operable disclosure.
    await planning.locator('summary').focus(); await page.keyboard.press('Enter');
    await planning.getByLabel('Spring frost planning date', { exact: true }).fill(`${year}-05-20`);
    await planning.getByLabel('Fall frost planning date', { exact: true }).fill(`${year}-10-10`);
    await planning.getByRole('checkbox', { name: 'Basil · Genovese', exact: true }).check();
    await planning.getByLabel('Growing setting for Basil Genovese').selectOption('indoor');
    let saved = await page.evaluate(user => JSON.parse(localStorage.getItem(`garden-os-calendar-${user}`)), user);
    assert.equal(saved.lastFrost, '05-20'); assert.equal(saved.firstFrost, '10-10');
    assert.deepEqual(saved.plants['preview-basil'], { included: true, mode: 'indoor' });
    assert.equal(saved.reminders.length, 2);
    await page.reload(); await page.getByRole('heading', { name: 'Calendar', exact: true }).waitFor();
    await planning.locator('summary').click();
    assert.equal(await planning.getByLabel('Spring frost planning date', { exact: true }).inputValue(), `${year}-05-20`);
    assert.equal(await planning.getByLabel('Growing setting for Basil Genovese').inputValue(), 'indoor');
    await planning.getByRole('checkbox', { name: 'Basil · Genovese', exact: true }).uncheck();
    // Planner controls remain usable at narrow widths without losing labels.
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `planning overflow ${width}`);
      assert.ok(await planning.getByLabel('Spring frost planning date', { exact: true }).isVisible());
      if (width === 1440 && guest) await planning.screenshot({ path: `${out}/calendar-planning-desktop.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    await planning.locator('summary').click();
    // Reminder creation, dismissal, repeated opening, and reload preserve data.
    await add.click(); await page.getByRole('dialog', { name: 'Add reminder', exact: true }).waitFor();
    await page.keyboard.press('Escape'); await add.click();
    let dialog = page.getByRole('dialog', { name: 'Add reminder', exact: true });
    await dialog.getByLabel('Remind me to', { exact: true }).fill('Check new basil leaves');
    await dialog.getByLabel('Reminder date', { exact: true }).fill(upcoming);
    await dialog.getByRole('button', { name: 'Add reminder', exact: true }).click();
    await dialog.getByText('Reminder saved. Phone delivery requires reminders enabled on this device.').waitFor();
    await page.keyboard.press('Escape');
    saved = await page.evaluate(user => JSON.parse(localStorage.getItem(`garden-os-calendar-${user}`)), user);
    assert.equal(saved.reminders.length, 3); assert.equal(saved.reminders.filter(r => r.title === 'Check new basil leaves').length, 1);
    await page.reload(); await nextSummary.click(); await overview.getByRole('button', { name: 'Check new basil leaves', exact: true }).waitFor();
    await page.getByRole('button', { name: 'This Week', exact: true }).click();
    await page.getByRole('dialog').waitFor(); await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'Monthly Calendar', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByLabel('Calendar month', { exact: true }).fill(`${Number(year) + 1}-03`);
    assert.equal(await page.getByLabel('Calendar month', { exact: true }).inputValue(), `${Number(year) + 1}-03`);
    await page.getByLabel('Calendar month', { exact: true }).fill(today.slice(0, 7));
    await sections.getByRole('button', { name: 'Tasks', exact: true }).click();
    await page.goBack(); await page.getByRole('heading', { name: 'Calendar', exact: true }).waitFor();
    await page.goForward(); assert.equal(new URL(page.url()).searchParams.get('view'), 'tasks');
    await sidebar.getByRole('button', { name: 'Calendar', exact: true }).click();
    const historyLength = await page.evaluate(() => history.length);
    await sidebar.getByRole('button', { name: 'Calendar', exact: true }).click();
    assert.equal(await page.evaluate(() => history.length), historyLength);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `calendar overflow ${width}`);
      assert.ok(await add.isVisible());
      await assertDisclosureAlignment(width);
      assert.equal(await nextSteps.getAttribute('open'), null);
      if (width === 1440) assert.ok((await nextSummary.boundingBox()).height <= 56);
      await nextSummary.click();
      assert.ok(await overview.getByRole('heading', { name: 'Today & this week' }).isVisible());
      await assertDisclosureAlignment(width);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `expanded next steps overflow ${width}`);
      await nextSummary.click();
      if (guest && width === 1440) {
        await page.locator('.conservatory-calendar').screenshot({ path: `${out}/calendar-desktop.png` });
        await overview.screenshot({ path: `${out}/calendar-overview-desktop.png` });
        await toolbar.screenshot({ path: `${out}/calendar-toolbar-desktop.png` });
      }
      if (guest && width === 390) await page.locator('.conservatory-calendar').screenshot({ path: `${out}/calendar-mobile.png` });
      if (guest && [1440, 390].includes(width)) {
        await page.locator('.calendar-focus > summary').screenshot({ path: `${out}/next-steps-${width}.png` });
        await planning.locator('summary').screenshot({ path: `${out}/planning-summary-${width}.png` });
        await nextSummary.click();
        await overview.screenshot({ path: `${out}/next-steps-expanded-${width}.png` });
        await nextSummary.click();
      }
    }
    for (const season of ['spring', 'summer', 'fall', 'winter']) {
      await page.getByLabel('Change seasonal theme').selectOption(season);
      const axe = await new AxeBuilder({ page }).include('.calendar-overview-card').include('.calendar-planning').include('.calendar-toolbar').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], season + ' accessibility');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${guest ? 'guest' : 'account'}: merged overview, right-aligned reminder, saved planning controls, reminder create/reopen/reload, task completion/undo, month switching, navigation history, five widths, four seasonal accessibility checks.`);
    await context.close();
  }
} catch (error) { console.error(error); console.error(logs.slice(-3500)); process.exitCode = 1; }
finally { await browser?.close(); server.kill('SIGTERM'); fixture.kill('SIGTERM'); }

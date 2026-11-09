/**
 * Isolated, actual-app vegetable-soil browser QA. This script starts no servers.
 * Run against a LOCAL production build made with dummy Supabase settings:
 *   BASE_URL=http://127.0.0.1:3000 OUTPUT_DIR=/tmp/soil-browser \
 *     node tests/vegetable-soil.browser.mjs
 * Optional: PLAYWRIGHT_CHROMIUM_EXECUTABLE, HEADLESS=0, BROWSER_TIMEOUT_MS.
 * Retry selected scenarios with TEST_FILTER="PlantPlanner|Public beginner".
 * Scenario filtering uses a case-insensitive regular expression and fresh state.
 * Requires Node 22.18+ (native TypeScript stripping), Playwright and axe-core.
 * Every auth/data/API request is fulfilled in memory. External requests and all
 * unrecognized writes are blocked; no production credentials or providers used.
 */
import { chromium } from 'playwright';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { vegetableSoilProfiles, getVegetableSoilProfile } from '../lib/vegetable-soil.ts';
import { plantCatalog } from '../lib/plant-picker.ts';

const origin = new URL(process.env.BASE_URL || 'http://127.0.0.1:3000');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'BASE_URL must be localhost; remote/prod targets are deliberately rejected.');
assert.ok(['http:', 'https:'].includes(origin.protocol));
const baseURL = origin.origin;
const out = path.resolve(process.env.OUTPUT_DIR || process.env.OUT_DIR || 'docs/previews/vegetable-soil');
const timeout = Number(process.env.BROWSER_TIMEOUT_MS || 15000);
const widths = [1440, 390, 320];
const filter = process.env.TEST_FILTER ? new RegExp(process.env.TEST_FILTER, 'i') : null;
const userId = 'a0a0a0a0-0000-4000-8000-000000000001';
const date = '2026-11-08T12:00:00.000Z';
const crops = plantCatalog.filter(plant => plant.category === 'Vegetable');
assert.equal(crops.length, 26, 'The browser matrix must cover all 26 catalog vegetables.');
assert.equal(vegetableSoilProfiles.length, 26);
const fixtureVault = [
  ['tomato', 'Tomato', 'Roma', 'Vegetable'],
  ['lettuce', 'Lettuce', 'Buttercrunch', 'Vegetable'],
  ['unknown', 'Mystery vegetable', '', 'Vegetable'],
  ['flower', 'Tomato', 'Decorative flower fixture', 'Flower'],
  ['basil', 'Basil', 'Genovese', 'Herb'],
  ['alias', 'Tomatoes', 'Alias fixture', 'Vegetable'],
].map(([id, name, variety, category]) => ({ id: `soil-${id}`, name, variety, category, statuses: ['Growing Now'], source: 'Isolated browser fixture', year: '2026', notes: '' }));
const fixtureGarden = { id: 'soil-garden', user_id: userId, name: 'Soil test garden', year: 2026, location: null, hardiness_zone: null, created_at: date };
const planted = (id, name, category = 'Vegetable') => ({ id, name, category, variety: '', quantity: 1, spacing: 18, planted: '', status: 'Growing' });
const fixtureSpaces = [
  ['bed', 'Soil raised bed', 'Raised Bed'],
  ['ground', 'Soil ground bed', 'In-ground Bed'],
  ['pot-a', 'Soil pot A', 'Container'],
  ['pot-b', 'Soil pot B', 'Container'],
  ['bag', 'Soil grow bag', 'Grow Bag'],
  ['legacy-bag', 'Soil legacy bag', 'Growing Bag'],
  ['unknown', 'Soil greenhouse', 'Greenhouse'],
  ['hydro', 'Soil hydroponic', 'Hydroponic'],
].map(([id, name, type]) => ({
  id: `soil-${id}`, garden_id: fixtureGarden.id, name, type, length_feet: 8, width_feet: 4, depth_feet: 1,
  diameter_inches: 30, sun_exposure: 'Full sun', irrigation: null, soil_type: 'Fixture note, not a soil measurement', updated_at: date,
  notes: JSON.stringify({ garden_os: 1, raisedBedBase: id === 'bed' ? 'open-soil' : undefined, notes: '', plants: id === 'bed' ? [planted('existing-unknown', 'Mystery vegetable')] : [], entries: [] }),
}));
const report = {
  startedAt: new Date().toISOString(), baseURL, outputDirectory: out,
  isolation: { localOnly: true, serviceWorkersBlocked: true, externalNetworkBlocked: true, mockAuthAndData: true, serverStartedByScript: false },
  coverage: { viewportWidths: widths, catalogCrops: crops.map(crop => crop.name), pickerChecks: [], note: 'Guest Plant Vault is intentionally unavailable; guest coverage uses actual spaces and public guides, with a regression check of the Vault gate.' },
  scenarios: [], screenshots: [], accessibility: { featureRegressions: [], unrelatedExisting: [], reviewNeeded: [], scans: [], classification: 'Unrelated findings are reproduced on the same screen with all soil cards hidden. This is an in-page non-feature baseline, not a claim to have run an earlier git revision.' },
  pageErrors: [], consoleErrors: [], blockedRequests: [], mockedWrites: [], unexpectedLocalRequests: [], failures: [],
};
let browser;
const contexts = new Set();
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clone = value => structuredClone(value);
const soil = page => page.locator('[data-soil-guidance]:visible');
const dialog = page => page.getByRole('dialog');
const recordError = error => ({ name: error.name, message: error.message, stack: error.stack });
const violations = results => results.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, help: v.help, helpUrl: v.helpUrl, nodes: v.nodes.map(n => ({ target: n.target, html: n.html, failureSummary: n.failureSummary })) }));
const violationKey = (v, node) => `${v.id}:${JSON.stringify(node.target)}`;

async function saveReport() {
  report.finishedAt = new Date().toISOString();
  report.summary = {
    passed: report.scenarios.filter(s => s.status === 'passed').length,
    failed: report.scenarios.filter(s => s.status === 'failed').length,
    pickerChecks: report.coverage.pickerChecks.length,
    featureAccessibilityRegressions: report.accessibility.featureRegressions.length,
    unrelatedAccessibilityFindings: report.accessibility.unrelatedExisting.length,
    accessibilityReviewNeeded: report.accessibility.reviewNeeded.length,
    pageErrors: report.pageErrors.length,
    unexpectedLocalRequests: report.unexpectedLocalRequests.length,
  };
  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
async function screenshot(page, name, target) {
  const file = `${slug(name)}.jpg`;
  if (target && await target.count()) {
    await target.first().scrollIntoViewIfNeeded();
    await target.first().screenshot({ path: path.join(out, file), animations: 'disabled', type: 'jpeg', quality: 70, timeout });
  } else {
    await page.screenshot({ path: path.join(out, file), animations: 'disabled', type: 'jpeg', quality: 70, fullPage: false, timeout });
  }
  report.screenshots.push({ name, file, url: page.url(), width: page.viewportSize()?.width });
}

async function setup(mode, scenarioName) {
  const context = await browser.newContext({ baseURL, viewport: { width: widths[0], height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block', locale: 'en-US', timezoneId: 'UTC' });
  contexts.add(context);
  context.setDefaultTimeout(timeout);
  context.setDefaultNavigationTimeout(timeout * 2);
  const state = { gardens: [clone(fixtureGarden)], spaces: clone(fixtureSpaces), records: new Map([[`garden-os-plant-vault-${userId}`, { key: `garden-os-plant-vault-${userId}`, value: clone(fixtureVault), version: 1 }]]), writes: [] };
  const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'garden@example.test', email_confirmed_at: date, created_at: date, app_metadata: { provider: 'email' }, user_metadata: {} };
  const accessToken = [Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: userId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url'), 'fixture-not-a-real-signature'].join('.');
  const session = { access_token: accessToken, token_type: 'bearer', expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: 'fixture-refresh-not-a-real-credential', user };
  const fulfill = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS' }, body: status === 204 ? '' : JSON.stringify(body) });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    const auth = url.pathname.startsWith('/auth/v1/'), rest = url.pathname.startsWith('/rest/v1/');
    if ((auth || rest) && method === 'OPTIONS') return fulfill(route, null, 204);
    if (auth) {
      if (url.pathname === '/auth/v1/token') return fulfill(route, session);
      if (url.pathname === '/auth/v1/user') return fulfill(route, user);
      if (url.pathname === '/auth/v1/logout') return fulfill(route, null, 204);
      return fulfill(route, { error: 'Unimplemented mock auth request' }, 400);
    }
    if (url.origin === baseURL && method === 'GET' && url.pathname === '/api/reminders/config') return fulfill(route, { ready: false, publicKey: null });
    if (url.origin === baseURL && method === 'GET' && url.pathname === '/api/weekly-email') return fulfill(route, { ready: false, testSender: false, email: 'garden@example.test', confirmed: true, version: 0, preferences: null });
    if (url.origin === baseURL && url.pathname === '/api/state') {
      if (method === 'GET') return fulfill(route, { records: [...state.records.values()] });
      if (method === 'PUT') {
        const body = request.postDataJSON(), existing = state.records.get(body.key);
        if ((existing?.version || 0) !== body.version) return fulfill(route, { error: 'Mock version mismatch' }, 409);
        const record = { key: body.key, value: body.value, version: (existing?.version || 0) + 1 };
        state.records.set(body.key, record);
        state.writes.push({ method, path: url.pathname, key: body.key });
        report.mockedWrites.push({ scenario: scenarioName, method, path: url.pathname, key: body.key });
        return fulfill(route, { record });
      }
    }
    if (rest) {
      const table = url.pathname.split('/').pop();
      const list = table === 'gardens' ? state.gardens : table === 'growing_spaces' ? state.spaces : null;
      if (!list) return fulfill(route, { error: `No mock for ${table}` }, 404);
      const matches = row => [...url.searchParams].every(([key, value]) => {
        if (['select', 'order', 'limit'].includes(key)) return true;
        if (value.startsWith('eq.')) return String(row[key]) === value.slice(3);
        if (value.startsWith('in.')) return value.slice(4, -1).split(',').includes(String(row[key]));
        return true;
      });
      const found = list.filter(matches);
      const object = (request.headers().accept || '').includes('object+json');
      if (method === 'GET') return fulfill(route, object ? found[0] ?? null : found);
      if (method === 'PATCH') {
        const body = request.postDataJSON();
        found.forEach(row => Object.assign(row, body, { updated_at: new Date().toISOString() }));
        state.writes.push({ method, path: url.pathname, ids: found.map(row => row.id) });
        report.mockedWrites.push({ scenario: scenarioName, method, path: url.pathname, ids: found.map(row => row.id) });
        return fulfill(route, object ? found[0] ?? null : found);
      }
      // This suite never needs real inserts/deletes. Unexpected fixture mutations fail closed.
      report.unexpectedLocalRequests.push({ scenario: scenarioName, method, path: url.pathname, reason: 'Unexpected mock mutation' });
      return fulfill(route, { error: 'Mutation not allowed by this test' }, 405);
    }
    if (url.origin !== baseURL) {
      report.blockedRequests.push({ scenario: scenarioName, method, url: `${url.origin}${url.pathname}` });
      return route.abort('blockedbyclient');
    }
    if (url.pathname.startsWith('/api/')) {
      // Even a same-origin API can contact external providers server-side.
      report.unexpectedLocalRequests.push({ scenario: scenarioName, method, path: url.pathname, reason: 'Unmocked API blocked before server execution' });
      return fulfill(route, { error: 'External services disabled in isolated browser QA.' }, 503);
    }
    if (url.pathname.startsWith('/_vercel/')) return fulfill(route, {}, 200);
    if (!['GET', 'HEAD'].includes(method)) {
      report.unexpectedLocalRequests.push({ scenario: scenarioName, method, path: url.pathname, reason: 'Unrecognized write blocked' });
      return fulfill(route, { error: 'Unexpected write blocked' }, 405);
    }
    if (url.pathname === '/_next/image' && /^(?:https?:)?\/\//.test(url.searchParams.get('url') || '')) {
      report.blockedRequests.push({ scenario: scenarioName, method, url: '/_next/image', reason: 'External image optimization blocked' });
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  await context.routeWebSocket('**/*', ws => { report.blockedRequests.push({ scenario: scenarioName, method: 'WEBSOCKET', url: ws.url() }); ws.close(); });
  await context.addInitScript(({ mode, vault, gardens, spaces, userId }) => {
    if (!sessionStorage.getItem('soil-fixture-seeded')) {
      localStorage.clear();
      localStorage.setItem('garden-os-guest-warning-seen', 'true');
      if (mode === 'guest') {
        localStorage.setItem('garden-os-guest-active', 'true');
        localStorage.setItem('garden-os-guest-data', JSON.stringify({ gardens, spaces }));
      }
      if (mode !== 'public') localStorage.setItem(`garden-os-plant-vault-${mode === 'guest' ? 'guest' : userId}`, JSON.stringify(vault));
      sessionStorage.setItem('soil-fixture-seeded', 'true');
    }
    // No location or notification prompt should ever be necessary to read soil advice.
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (_ok, error) => error?.({ code: 1, message: 'Fixture: geolocation disabled' }), watchPosition: () => 0, clearWatch: () => {} } });
  }, { mode, vault: fixtureVault, gardens: state.gardens, spaces: state.spaces, userId });
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push({ scenario: scenarioName, ...recordError(error) }));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ scenario: scenarioName, text: message.text() }); });
  if (mode === 'account') {
    await page.goto('/');
    if (!(await page.getByLabel('Email', { exact: true }).isVisible())) await page.getByRole('button', { name: 'Already have an account?', exact: true }).click();
    await page.getByLabel('Email', { exact: true }).fill('garden@example.test');
    await page.getByLabel('Password', { exact: true }).fill('fixture-password');
    await page.getByRole('button', { name: 'Open my garden', exact: true }).click();
    await page.locator('.modern-dashboard').waitFor();
  }
  return { context, page, state, mode };
}

async function runScenario(name, mode, handler) {
  if (filter && !filter.test(name)) return;
  const entry = { name, mode, startedAt: new Date().toISOString(), status: 'running' };
  report.scenarios.push(entry);
  let fixture;
  console.log(`RUN ${name}`);
  try {
    fixture = await setup(mode, name);
    await handler(fixture);
    entry.status = 'passed';
    console.log(`PASS ${name}`);
  } catch (error) {
    entry.status = 'failed';
    entry.error = recordError(error);
    report.failures.push({ scenario: name, ...recordError(error) });
    console.error(`FAIL ${name}: ${error.message}`);
    if (fixture) {
      await screenshot(fixture.page, `${name}-failure`).catch(() => {});
      await writeFile(path.join(out, `${slug(name)}-failure.html`), await fixture.page.content()).catch(() => {});
    }
  } finally {
    entry.finishedAt = new Date().toISOString();
    if (fixture) { await fixture.context.close(); contexts.delete(fixture.context); }
    await saveReport();
  }
}
async function garden(page) {
  await page.goto(`/?view=my-gardens&garden=${fixtureGarden.id}`);
  await page.getByRole('button', { name: 'Soil raised bed', exact: true }).waitFor();
}
async function openSpace(page, id, add = true) {
  if (await dialog(page).count()) await dialog(page).getByRole('button', { name: 'Close dialog', exact: true }).click();
  const space = fixtureSpaces.find(item => item.id === `soil-${id}`);
  await page.getByRole('button', { name: space.name, exact: true }).click();
  await dialog(page).getByRole('heading', { name: space.name, exact: true }).waitFor();
  if (add) await dialog(page).getByRole('button', { name: '+ Add Plant', exact: true }).click();
}
async function snapshotData({ page, state, mode }) {
  return { vault: await page.evaluate(id => localStorage.getItem(`garden-os-plant-vault-${id}`), mode === 'guest' ? 'guest' : userId), guest: await page.evaluate(() => localStorage.getItem('garden-os-guest-data')), spaces: clone(state.spaces), writes: state.writes.length };
}
async function persistedSpaces({ page, state, mode }) {
  return mode === 'guest' ? page.evaluate(() => JSON.parse(localStorage.getItem('garden-os-guest-data')).spaces) : clone(state.spaces);
}
async function assertRows(card, profile, method) {
  const expected = method === 'full' ? [profile.bed, profile.container, profile.moisture] : method ? [profile[method], profile.moisture] : [];
  await expect(card.locator('dd')).toHaveText(expected);
  await expect(card).toHaveAttribute('data-soil-guidance', profile.id);
}
async function assertSources(card, profile) {
  const links = card.locator('a');
  await expect(links).toHaveCount(profile.sources.length);
  for (let i = 0; i < profile.sources.length; i++) {
    await expect(links.nth(i)).toHaveAttribute('href', profile.sources[i].url);
    await expect(links.nth(i)).toHaveAttribute('target', '_blank');
    const rel = await links.nth(i).getAttribute('rel');
    assert.ok(rel.split(/\s+/).includes('noopener') && rel.split(/\s+/).includes('noreferrer'));
    await expect(links.nth(i)).toHaveAccessibleName(`${profile.sources[i].title} (opens in a new tab)`);
  }
}
async function assertMethod(card, method) {
  await expect(card.getByRole('button', { name: 'Garden bed', exact: true })).toHaveAttribute('aria-pressed', String(method === 'bed'));
  await expect(card.getByRole('button', { name: 'Container', exact: true })).toHaveAttribute('aria-pressed', String(method === 'container'));
  const controls = await card.getByRole('button').evaluateAll(buttons => buttons.map(button => ({ type: button.type, controls: button.getAttribute('aria-controls'), targetExists: !!document.getElementById(button.getAttribute('aria-controls')) })));
  assert.ok(controls.every(control => control.type === 'button' && control.controls && control.targetExists));
}
async function openDetails(card) {
  const details = card.locator('details'), summary = details.locator('summary');
  await expect(details).not.toHaveAttribute('open', '');
  await summary.focus();
  await summary.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  const profileId = await card.getAttribute('data-soil-guidance');
  const profile = vegetableSoilProfiles.find(profile => profile.id === profileId);
  if (profile?.ph) await expect(card.getByText('This preferred range is guidance, not a measurement of your soil.', { exact: true })).toBeVisible();
  else await expect(card).toContainText('We haven’t listed a verified soil pH range');
  return summary;
}
async function assertGeometry(page, card) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Page horizontal overflow at ${page.viewportSize().width}`);
  for (const scope of [card, dialog(page)]) {
    if (!await scope.count()) continue;
    const measurements = await scope.evaluateAll(elements => elements.map(el => ({ width: el.clientWidth, scroll: el.scrollWidth, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right, viewport: innerWidth })));
    for (const measurement of measurements) {
      assert.ok(measurement.scroll <= measurement.width + 1, `Internal horizontal overflow: ${JSON.stringify(measurement)}`);
      assert.ok(measurement.left >= -1 && measurement.right <= measurement.viewport + 1, `Outside viewport: ${JSON.stringify(measurement)}`);
    }
  }
  const controls = await card.locator('button, summary').evaluateAll(elements => elements.map(el => ({ text: el.textContent, height: el.getBoundingClientRect().height })));
  assert.ok(controls.every(control => control.height >= 44), `Soil controls require 44px touch height: ${JSON.stringify(controls)}`);
}
async function checkA11y(page, name) {
  const options = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
  const feature = violations(await options().include('[data-soil-guidance]').analyze());
  const full = violations(await options().analyze());
  const scan = { name, width: page.viewportSize().width, feature, full, baselineWithoutSoil: [] };
  report.accessibility.scans.push(scan);
  for (const violation of feature) report.accessibility.featureRegressions.push({ scan: name, width: scan.width, ...violation });
  // Temporarily hide only the new feature for a safe same-screen non-feature baseline.
  if (full.length) {
    await page.locator('[data-soil-guidance]').evaluateAll(elements => elements.forEach(el => { el.dataset.soilQaStyle = el.getAttribute('style') ?? '__none__'; el.style.setProperty('display', 'none', 'important'); }));
    try { scan.baselineWithoutSoil = violations(await options().analyze()); }
    finally {
      await page.locator('[data-soil-guidance]').evaluateAll(elements => elements.forEach(el => { const old = el.dataset.soilQaStyle; if (old === '__none__') el.removeAttribute('style'); else el.setAttribute('style', old); delete el.dataset.soilQaStyle; }));
    }
    const featureKeys = new Set(feature.flatMap(v => v.nodes.map(node => violationKey(v, node))));
    const baselineKeys = new Set(scan.baselineWithoutSoil.flatMap(v => v.nodes.map(node => violationKey(v, node))));
    for (const violation of full) for (const node of violation.nodes) {
      const key = violationKey(violation, node);
      if (featureKeys.has(key)) continue;
      const item = { scan: name, width: scan.width, id: violation.id, impact: violation.impact, help: violation.help, helpUrl: violation.helpUrl, node };
      if (baselineKeys.has(key)) report.accessibility.unrelatedExisting.push(item);
      else report.accessibility.reviewNeeded.push(item);
    }
  }
  // Continue other scenarios to collect the complete report; final exit status fails on feature violations.
}
async function responsive(page, name, card = soil(page), { axe = true } = {}) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await card.first().scrollIntoViewIfNeeded();
    await assertGeometry(page, card);
    await screenshot(page, `${name}-${width}-viewport`);
    await screenshot(page, `${name}-${width}-card`, card);
    if (axe) await checkA11y(page, `${name}-${width}`);
  }
}
async function keyboardMethods(page, card) {
  const bed = card.getByRole('button', { name: 'Garden bed', exact: true }), container = card.getByRole('button', { name: 'Container', exact: true });
  await bed.focus();
  await page.keyboard.press('Enter');
  await assertMethod(card, 'bed');
  await page.keyboard.press('Tab');
  await expect(container).toBeFocused();
  await page.keyboard.press('Space');
  await assertMethod(card, 'container');
  await page.keyboard.press('Tab');
  await expect(card.locator('summary')).toBeFocused();
  const outline = await card.locator('summary').evaluate(el => ({ style: getComputedStyle(el).outlineStyle, width: parseFloat(getComputedStyle(el).outlineWidth) }));
  assert.ok(outline.style !== 'none' && outline.width >= 2, `Missing visible keyboard focus: ${JSON.stringify(outline)}`);
  await page.keyboard.press('Enter');
  await expect(card.locator('details')).toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(card.locator('details')).not.toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(card.locator('a').first()).toBeFocused();
}

await mkdir(out, { recursive: true });
try {
  const response = await fetch(baseURL, { signal: AbortSignal.timeout(timeout) });
  assert.ok(response.ok, `Local app is not ready: HTTP ${response.status}`);
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, headless: process.env.HEADLESS !== '0', args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-background-networking', '--disable-component-update', '--no-default-browser-check'] });

  await runScenario('Account Plant Vault details', 'account', async fixture => {
    const { page } = fixture;
    await page.goto('/?view=plant-vault');
    await page.getByRole('heading', { name: 'Plant Vault', exact: true }).waitFor();
    assert.equal(await soil(page).count(), 0, 'Vault list must not grow duplicate detail cards.');
    const before = await snapshotData(fixture);
    const opener = page.getByRole('button', { name: 'Open Tomato Roma', exact: true });
    await opener.focus();
    await opener.press('Enter');
    await assertRows(soil(page), getVegetableSoilProfile('Tomato'), 'full');
    await assertSources(soil(page), getVegetableSoilProfile('Tomato'));
    await expect(soil(page).getByRole('button')).toHaveCount(0);
    const summary = await openDetails(soil(page));
    await expect(soil(page).getByText('Preferred soil pH: 6.0–6.8', { exact: true })).toBeVisible();
    await responsive(page, 'vault-tomato-expanded');
    await summary.focus();
    await summary.press('Space');
    await expect(soil(page).locator('details')).not.toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expect(opener).toBeFocused();
    await opener.click();
    await expect(soil(page).locator('details')).not.toHaveAttribute('open', '');
    await dialog(page).getByRole('button', { name: 'Close dialog', exact: true }).click();
    for (const plant of fixtureVault.slice(1)) {
      await page.getByRole('button', { name: `Open ${plant.name}${plant.variety ? ' ' + plant.variety : ''}`, exact: true }).click();
      const profile = getVegetableSoilProfile(plant.name, plant.category);
      if (profile) { await assertRows(soil(page), profile, 'full'); await assertSources(soil(page), profile); }
      else if (plant.category === 'Vegetable') {
        await expect(soil(page)).toContainText('We don’t have verified soil guidance for Mystery vegetable yet.');
        await expect(soil(page).locator('details, button, dt, a')).toHaveCount(0);
        await responsive(page, 'vault-unsupported');
      } else await expect(soil(page)).toHaveCount(0);
      await dialog(page).getByRole('button', { name: 'Close dialog', exact: true }).click();
    }
    assert.deepEqual(await snapshotData(fixture), before, 'Reading/toggling soil advice must not change garden or Vault records.');
  });

  await runScenario('Guest Vault boundary', 'guest', async ({ page, state }) => {
    await page.goto('/?view=plant-vault');
    await page.locator('.modern-dashboard').waitFor();
    await expect(page.getByRole('heading', { name: 'Plant Vault', exact: true })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Garden Atelier navigation' }).getByRole('button', { name: 'Plant Vault', exact: true })).toHaveCount(0);
    assert.equal(state.writes.length, 0);
  });

  for (const mode of ['account', 'guest']) {
    await runScenario(`${mode} SpacePanel all 26 crops and save edit`, mode, async fixture => {
      const { page } = fixture;
      await garden(page);
      await openSpace(page, 'bed');
      const chooser = dialog(page).getByLabel('Choose a plant', { exact: true });
      const before = await snapshotData(fixture);
      await expect(soil(page)).toHaveCount(0);
      await dialog(page).getByLabel('Quantity', { exact: true }).fill('3');
      for (const width of widths) {
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
        for (const crop of crops) {
          await chooser.selectOption(crop.id);
          const profile = getVegetableSoilProfile(crop.name);
          await assertRows(soil(page), profile, 'bed');
          await assertMethod(soil(page), 'bed');
          await expect(soil(page).locator('details')).not.toHaveAttribute('open', '');
          await soil(page).getByRole('button', { name: 'Container', exact: true }).click();
          await assertRows(soil(page), profile, 'container');
          await assertMethod(soil(page), 'container');
          await assertSources(soil(page), profile);
          await openDetails(soil(page));
          if (profile.ph) await expect(soil(page).getByText(`Preferred soil pH: ${profile.ph.min.toFixed(1)}–${profile.ph.max.toFixed(1)}`, { exact: true })).toBeVisible();
          else {
            await expect(soil(page)).toContainText('We haven’t listed a verified soil pH range');
            await expect(soil(page)).not.toContainText('Preferred soil pH:');
          }
          await expect(dialog(page).getByLabel('Quantity', { exact: true })).toHaveValue('3');
          await assertGeometry(page, soil(page));
          report.coverage.pickerChecks.push({ mode, width, crop: crop.name, profile: profile.id, bed: true, container: true, ph: true, sources: true, stateReset: true });
        }
      }
      assert.deepEqual(await snapshotData(fixture), before, 'Picker previews and method changes must not submit or save.');
      await chooser.selectOption('catalog:Tomato');
      await keyboardMethods(page, soil(page));
      await responsive(page, `${mode}-space-tomato`);
      const formValues = await dialog(page).locator('form').first().evaluate(form => Object.fromEntries(new FormData(form)));
      await soil(page).getByRole('button', { name: 'Garden bed', exact: true }).click();
      assert.deepEqual(await dialog(page).locator('form').first().evaluate(form => Object.fromEntries(new FormData(form))), formValues, 'Read-only guidance must not edit form fields.');
      await dialog(page).getByLabel('Variety (optional)', { exact: true }).fill('Browser QA');
      await dialog(page).getByRole('button', { name: 'Save Plant', exact: true }).click();
      await dialog(page).getByText('Plant saved.', { exact: true }).waitFor();
      let stored = (await persistedSpaces(fixture)).find(space => space.id === 'soil-bed');
      let saved = JSON.parse(stored.notes).plants.find(plant => plant.name === 'Tomato');
      assert.equal(saved.quantity, 3); assert.equal(saved.category, 'Vegetable'); assert.equal(saved.variety, 'Browser QA'); assert.ok(saved.vaultPlantId);
      const identity = saved.id, vaultIdentity = saved.vaultPlantId;
      await dialog(page).getByRole('button', { name: 'Edit Tomato', exact: true }).click();
      await assertRows(soil(page), getVegetableSoilProfile('Tomato'), 'bed');
      await assertMethod(soil(page), 'bed');
      await expect(soil(page).locator('details')).not.toHaveAttribute('open', '');
      await dialog(page).getByLabel('Quantity', { exact: true }).fill('2');
      await soil(page).getByRole('button', { name: 'Container', exact: true }).click();
      await dialog(page).getByRole('button', { name: 'Save Plant', exact: true }).click();
      await dialog(page).getByRole('button', { name: 'Edit Tomato', exact: true }).waitFor();
      await expect(dialog(page).locator('.space-plant-form')).toHaveCount(0);
      stored = (await persistedSpaces(fixture)).find(space => space.id === 'soil-bed');
      saved = JSON.parse(stored.notes).plants.find(plant => plant.id === identity);
      assert.equal(saved.quantity, 2); assert.equal(saved.vaultPlantId, vaultIdentity);
      await page.reload();
      await page.getByRole('button', { name: 'Soil raised bed', exact: true }).waitFor();
      await openSpace(page, 'bed', false);
      await dialog(page).getByRole('button', { name: 'Edit Tomato', exact: true }).click();
      await expect(dialog(page).getByLabel('Quantity', { exact: true })).toHaveValue('2');
      await assertMethod(soil(page), 'bed');
      if (mode === 'guest') assert.equal(fixture.state.writes.length, 0, 'Guest saves must stay in local fixture storage.');
    });

    await runScenario(`${mode} space contexts hydroponic and unsupported`, mode, async fixture => {
      const { page } = fixture;
      await garden(page);
      const before = await snapshotData(fixture);
      for (const [id, method] of [['ground', 'bed'], ['pot-a', 'container'], ['pot-b', 'container'], ['bag', 'container'], ['legacy-bag', 'container'], ['unknown', null]]) {
        await openSpace(page, id);
        await dialog(page).getByLabel('Choose a plant', { exact: true }).selectOption('catalog:Tomato');
        await assertMethod(soil(page), method);
        await assertRows(soil(page), getVegetableSoilProfile('Tomato'), method);
        if (!method) {
          await expect(soil(page)).toContainText('Choose a growing method');
          await responsive(page, `${mode}-unknown-space-context`);
          await soil(page).getByRole('button', { name: 'Container', exact: true }).click();
          await assertRows(soil(page), getVegetableSoilProfile('Tomato'), 'container');
        }
      }
      await openSpace(page, 'hydro');
      await dialog(page).getByLabel('Choose a plant', { exact: true }).selectOption('catalog:Tomato');
      await expect(soil(page)).toContainText('do not apply to a hydroponic nutrient solution');
      await expect(soil(page).locator('dt, details, button')).toHaveCount(0);
      await expect(soil(page)).not.toContainText('Preferred soil pH:');
      await expect(soil(page)).not.toContainText(getVegetableSoilProfile('Tomato').moisture);
      await responsive(page, `${mode}-hydroponic`);
      await openSpace(page, 'bed', false);
      await dialog(page).getByRole('button', { name: 'Edit Mystery vegetable', exact: true }).click();
      await expect(soil(page)).toContainText('You can still save your plant.');
      await expect(soil(page).locator('dt, details, button, a')).toHaveCount(0);
      // Rename removes an old category when it no longer matches the plant.
      await dialog(page).getByLabel('Plant name', { exact: true }).fill('Basil');
      await expect(soil(page)).toHaveCount(0);
      await dialog(page).getByLabel('Plant name', { exact: true }).fill('Carrot flower');
      await expect(soil(page)).toHaveCount(0);
      await dialog(page).getByLabel('Plant name', { exact: true }).fill('Tomato');
      await assertRows(soil(page), getVegetableSoilProfile('Tomato'), 'bed');
      await dialog(page).getByLabel('Plant name', { exact: true }).fill('   ');
      await expect(soil(page)).toHaveCount(0);
      await dialog(page).getByLabel('Choose a plant', { exact: true }).selectOption('vault:soil-unknown');
      await expect(soil(page)).toContainText('We don’t have verified soil guidance');
      await dialog(page).getByLabel('Choose a plant', { exact: true }).selectOption('vault:soil-flower');
      await expect(soil(page)).toHaveCount(0);
      assert.deepEqual(await snapshotData(fixture), before, 'Context/unsupported checks are strictly read-only.');
      // The unsupported crop remains saveable, including edits, with its identity intact.
      await dialog(page).getByRole('button', { name: 'Cancel', exact: true }).click();
      await dialog(page).getByRole('button', { name: 'Edit Mystery vegetable', exact: true }).click();
      await dialog(page).getByLabel('Quantity', { exact: true }).fill('2');
      await dialog(page).getByRole('button', { name: 'Save Plant', exact: true }).click();
      await expect(dialog(page).locator('.space-plant-form')).toHaveCount(0);
      const saved = JSON.parse((await persistedSpaces(fixture)).find(space => space.id === 'soil-bed').notes).plants.find(plant => plant.id === 'existing-unknown');
      assert.equal(saved.name, 'Mystery vegetable'); assert.equal(saved.category, 'Vegetable'); assert.equal(saved.quantity, 2);
    });

    await runScenario(`${mode} PlantPlanner context resets`, mode, async fixture => {
      const { page } = fixture;
      await garden(page);
      const before = await snapshotData(fixture);
      await page.getByRole('button', { name: 'Plant planner', exact: true }).click();
      const crop = dialog(page).getByLabel('Crop', { exact: true }), space = dialog(page).getByLabel('Growing space', { exact: true }), shape = dialog(page).getByLabel('Space shape', { exact: true });
      await expect(soil(page)).toHaveCount(0);
      assert.equal(await space.locator('option[value="soil-hydro"]').count(), 0, 'Hydroponic setups must stay excluded from soil capacity planning.');
      await crop.selectOption('Tomato');
      await assertMethod(soil(page), 'bed');
      await soil(page).getByRole('button', { name: 'Container', exact: true }).click();
      await openDetails(soil(page));
      await crop.selectOption('Lettuce');
      await assertMethod(soil(page), 'bed');
      await expect(soil(page).locator('details')).not.toHaveAttribute('open', '');
      await crop.selectOption('Tomato');
      await space.selectOption('soil-pot-a');
      await assertMethod(soil(page), 'container');
      await soil(page).getByRole('button', { name: 'Garden bed', exact: true }).click();
      await openDetails(soil(page));
      await space.selectOption('soil-pot-b');
      await assertMethod(soil(page), 'container');
      await expect(soil(page).locator('details')).not.toHaveAttribute('open', '');
      await space.selectOption('soil-bed');
      await assertMethod(soil(page), 'bed');
      await space.selectOption('soil-unknown');
      await assertMethod(soil(page), null);
      await expect(soil(page)).toContainText('Choose a growing method');
      await expect(soil(page).locator('dd')).toHaveCount(0);
      await shape.selectOption('Round container or bag');
      await expect(space).toHaveValue('');
      await assertMethod(soil(page), 'container');
      await shape.selectOption('Rectangular bed');
      await assertMethod(soil(page), 'bed');
      for (const value of ['Strawberry', 'Herbs', '']) { await crop.selectOption(value); await expect(soil(page)).toHaveCount(0); }
      await crop.selectOption('Hot Pepper');
      await expect(soil(page)).toHaveCount(0); // Ambiguous pepper label is intentionally not guessed.
      await crop.selectOption('Tomato');
      await keyboardMethods(page, soil(page));
      await responsive(page, `${mode}-planner`);
      assert.deepEqual(await snapshotData(fixture), before, 'Planner exploration must not create plants or change stored records.');
      await space.selectOption('soil-pot-a');
      await dialog(page).getByRole('button', { name: 'Add a plant to Soil pot A', exact: true }).click();
      await expect(dialog(page).getByLabel('Plant name', { exact: true })).toHaveValue('Tomato');
      await assertMethod(soil(page), 'container');
      await expect(soil(page).locator('details')).not.toHaveAttribute('open', '');
      assert.deepEqual(await snapshotData(fixture), before, 'Planner handoff must not save before Save Plant.');
    });
  }

  await runScenario('Soil contrast across all seasonal themes', 'guest', async fixture => {
    const { page } = fixture;
    await garden(page);
    report.coverage.seasonalThemes = [];
    for (const season of ['spring', 'summer', 'fall', 'winter']) {
      // Use the real theme picker before opening the modal, whose backdrop makes it inert.
      if (await dialog(page).count()) await dialog(page).getByRole('button', { name: 'Close dialog', exact: true }).click();
      await page.getByLabel('Change seasonal theme').selectOption(season);
      await expect(page.locator('html')).toHaveAttribute('data-season', season);
      await openSpace(page, 'pot-a');
      await dialog(page).getByLabel('Choose a plant', { exact: true }).selectOption('catalog:Tomato');
      const card = soil(page);
      await keyboardMethods(page, card);
      await openDetails(card);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
        await card.scrollIntoViewIfNeeded();
        await assertGeometry(page, card);
        await checkA11y(page, `seasonal-${season}-${width}`);
        const focusChecks = [];
        // Axe checks title, body, sources and both button states; inspect keyboard outlines explicitly.
        await page.keyboard.press('Tab');
        for (const target of [card.getByRole('button', { name: 'Garden bed', exact: true }), card.getByRole('button', { name: 'Container', exact: true }), card.locator('summary'), card.locator('a').first()]) {
          await target.focus();
          const focus = await target.evaluate(el => {
            const ctx = document.createElement('canvas').getContext('2d');
            const rgba = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
            const luminance = color => rgba(color).slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, i) => sum + value * [.2126, .7152, .0722][i], 0);
            const contrast = (first, second) => { const values = [luminance(first), luminance(second)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); };
            const style = getComputedStyle(el), cardStyle = getComputedStyle(el.closest('[data-soil-guidance]'));
            const ownBackground = rgba(style.backgroundColor)[3] ? style.backgroundColor : cardStyle.backgroundColor;
            return { text: el.textContent.trim(), keyboardFocus: el.matches(':focus-visible'), outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth), outlineColor: style.outlineColor, background: cardStyle.backgroundColor, contrastAgainstCard: contrast(style.outlineColor, cardStyle.backgroundColor), contrastAgainstControl: contrast(style.outlineColor, ownBackground) };
          });
          assert.ok(focus.keyboardFocus && focus.outlineStyle !== 'none' && focus.outlineWidth >= 2, `Missing keyboard focus in ${season}/${width}: ${JSON.stringify(focus)}`);
          assert.ok(focus.contrastAgainstCard >= 3 && focus.contrastAgainstControl >= 3, `Low focus contrast in ${season}/${width}: ${JSON.stringify(focus)}`);
          focusChecks.push(focus);
        }
        report.coverage.seasonalThemes.push({ season, width, focusChecks });
        // Two lightweight viewport captures; detailed scans remain available for all eight combinations.
        if (season === 'fall') { await card.locator('summary').scrollIntoViewIfNeeded(); await screenshot(page, `seasonal-fall-focus-${width}`); }
      }
    }
  });

  await runScenario('Public beginner vegetable cards', 'public', async fixture => {
    const { page, state } = fixture;
    await page.goto('/beginners-guide/planting');
    const picks = page.getByRole('region', { name: 'A few good plants to start with', exact: true });
    await picks.waitFor();
    await expect(page.getByLabel('Email', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(picks.locator('details[data-plant]')).toHaveCount(10);
    const expected = [['leaf-lettuce', 'Leaf lettuce'], ['spring-radish', 'Spring radish'], ['bush-snap-bean', 'Bush snap bean'], ['slicing-tomato', 'Slicing tomato'], ['sweet-bell-pepper', 'Sweet bell pepper']];
    for (const [id, name] of expected) {
      const outer = picks.locator(`details[data-plant="${id}"]`), summary = outer.locator(':scope > summary');
      await summary.focus(); await summary.press('Enter');
      await expect(outer).toHaveAttribute('open', '');
      const card = outer.locator('[data-soil-guidance]');
      await assertRows(card, getVegetableSoilProfile(name), 'full');
      await assertSources(card, getVegetableSoilProfile(name));
      await expect(card.locator('h4')).toContainText(`Soil & drainage for ${name}`);
      await expect(card.getByRole('button')).toHaveCount(0);
      await openDetails(card);
      await expect(outer).toHaveAttribute('open', '');
      await expect(dialog(page)).toHaveCount(0);
    }
    assert.equal(await picks.locator('[data-soil-guidance]').count(), 5);
    for (const id of ['sweet-basil', 'french-marigold', 'bush-nasturtium', 'sweet-alyssum', 'compact-zinnia']) assert.equal(await picks.locator(`[data-plant="${id}"] [data-soil-guidance]`).count(), 0);
    const ids = await picks.locator('[data-soil-guidance] [id]').evaluateAll(elements => elements.map(element => element.id));
    assert.equal(ids.length, new Set(ids).size, 'All simultaneous soil cards need unique labels/control targets.');
    for (const width of widths) {
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      await assertGeometry(page, soil(page));
      await checkA11y(page, `public-beginner-${width}`);
      await screenshot(page, `public-beginner-${width}-tomato`, picks.locator('[data-plant="slicing-tomato"]'));
      await screenshot(page, `public-beginner-${width}-viewport`);
    }
    const local = await page.evaluate(() => ({ active: localStorage.getItem('garden-os-guest-active'), garden: localStorage.getItem('garden-os-guest-data'), vaults: Object.keys(localStorage).filter(key => key.startsWith('garden-os-plant-vault-')) }));
    assert.deepEqual(local, { active: null, garden: null, vaults: [] }, 'Public reading must not create a guest garden or Vault.');
    assert.equal(state.writes.length, 0);
  });

  await runScenario('Beginner popup nested disclosures', 'guest', async ({ page }) => {
    await page.goto('/?view=beginners-guide');
    await page.getByRole('heading', { name: 'Beginner’s Guide', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Help me start', exact: true }).click();
    await page.getByRole('button', { name: 'Show my next steps', exact: true }).click();
    await page.getByRole('button', { name: 'Read the space guide', exact: true }).click();
    // Reach the planting article through the real popup's next-step controls.
    for (let step = 0; step < 6 && !await dialog(page).locator('[data-plant="slicing-tomato"]').count(); step++) await dialog(page).getByRole('button', { name: 'Next guide →', exact: true }).click();
    const tomato = dialog(page).locator('[data-plant="slicing-tomato"]');
    await tomato.waitFor();
    await tomato.locator(':scope > summary').focus();
    await page.keyboard.press('Enter');
    await expect(tomato.locator('[data-soil-guidance] h5')).toContainText('Soil & drainage for Slicing tomato');
    await openDetails(tomato.locator('[data-soil-guidance]'));
    await expect(dialog(page)).toHaveCount(1);
    await responsive(page, 'beginner-popup', tomato.locator('[data-soil-guidance]'));
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
  });
} catch (error) {
  report.failures.push({ scenario: 'Suite setup', ...recordError(error) });
  console.error(error);
} finally {
  for (const context of contexts) await context.close().catch(() => {});
  await browser?.close();
  await saveReport();
  const failed = report.failures.length || report.pageErrors.length || report.accessibility.featureRegressions.length || report.accessibility.reviewNeeded.length || report.unexpectedLocalRequests.length;
  console.log(JSON.stringify({ result: failed ? 'FAIL' : 'PASS', ...report.summary, report: path.join(out, 'report.json') }, null, 2));
  if (failed) process.exitCode = 1;
}

/**
 * Actual-app isolated soil guide QA. No servers started by this script.
 * BASE_URL=http://127.0.0.1:3033 CHROMIUM_PATH=/path/to/chrome \
 *   OUTPUT_DIR=/tmp/growing-space-soil-browser node tests/growing-space-soil.browser.mjs
 * Node 22.18+, Playwright, @playwright/test and @axe-core/playwright required.
 * Localhost only. Synthetic auth/data/photo; all unknown API, write, external,
 * image-proxy and websocket requests blocked. No production credentials.
 * Authoring checks only until run in the authorized browser QA environment.
 * TEST_FILTER optionally selects scenario names. Helpers adapted from vegetable-soil.browser.mjs.
 */
import { chromium } from 'playwright';
import { expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { vegetableSoilProfiles, getVegetableSoilProfile } from '../lib/vegetable-soil.ts';
import { soilMaterials, soilGuides } from '../lib/growing-space-soil.ts';
import { plantCatalog } from '../lib/plant-picker.ts';

const origin = new URL(process.env.BASE_URL || 'http://127.0.0.1:3000');
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname), 'BASE_URL must be localhost; remote/prod targets are deliberately rejected.');
assert.ok(['http:', 'https:'].includes(origin.protocol));
const baseURL = origin.origin;
const out = path.resolve(process.env.OUTPUT_DIR || process.env.OUT_DIR || '/tmp/growing-space-soil-browser');
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
  notes: JSON.stringify({ garden_os: 1, photoUrl: '/icon.svg', sourceLegacyId: 'synthetic-legacy', sourceLayoutId: 'synthetic-layout', fixtureExtra: {keep: true}, notes: '', plants: id === 'bed' ? [planted('existing-unknown', 'Mystery vegetable')] : [], entries: [] }),
}));
const report = {
  startedAt: new Date().toISOString(), baseURL, outputDirectory: out,
  isolation: { localOnly: true, serviceWorkersBlocked: true, externalNetworkBlocked: true, mockAuthAndData: true, serverStartedByScript: false },
  coverage: { viewportWidths: widths, catalogCrops: crops.map(crop => crop.name), pickerChecks: [], note: 'Synthetic account state only. No real accounts, production providers, or guest-mode scenarios are used in this suite.' },
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


async function assertRows(card, profile, method) {
  const expected = method === 'full' ? [profile.bed, profile.container, profile.moisture] : method ? [profile[method], profile.moisture] : [];
  await expect(card.locator('dd')).toHaveText(expected);
  await expect(card).toHaveAttribute('data-soil-guidance', profile.id);
}

async function assertMethod(card, method) {
  await expect(card.getByRole('button', { name: 'Garden bed', exact: true })).toHaveAttribute('aria-pressed', String(method === 'bed'));
  await expect(card.getByRole('button', { name: 'Container', exact: true })).toHaveAttribute('aria-pressed', String(method === 'container'));
  const controls = await card.getByRole('button').evaluateAll(buttons => buttons.map(button => ({ type: button.type, controls: button.getAttribute('aria-controls'), targetExists: !!document.getElementById(button.getAttribute('aria-controls')) })));
  assert.ok(controls.every(control => control.type === 'button' && control.controls && control.targetExists));
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
  const controls = await card.locator('button:visible, summary:visible').evaluateAll(elements => elements.map(el => ({ text: el.textContent, height: el.getBoundingClientRect().height })));
  assert.ok(controls.every(control => control.height >= 44), `Soil controls require 44px touch height: ${JSON.stringify(controls)}`);
}
async function checkA11y(page, name) {
  const options = () => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']);
  const feature = violations(await options().include('[data-growing-space-soil-guide]').analyze());
  const full = violations(await options().analyze());
  const scan = { name, width: page.viewportSize().width, feature, full, baselineWithoutSoil: [] };
  report.accessibility.scans.push(scan);
  for (const violation of feature) report.accessibility.featureRegressions.push({ scan: name, width: scan.width, ...violation });
  // Temporarily hide only the new feature for a safe same-screen non-feature baseline.
  if (full.length) {
    await page.locator('[data-growing-space-soil-guide]').evaluateAll(elements => elements.forEach(el => { el.dataset.soilQaStyle = el.getAttribute('style') ?? '__none__'; el.style.setProperty('display', 'none', 'important'); }));
    try { scan.baselineWithoutSoil = violations(await options().analyze()); }
    finally {
      await page.locator('[data-growing-space-soil-guide]').evaluateAll(elements => elements.forEach(el => { const old = el.dataset.soilQaStyle; if (old === '__none__') el.removeAttribute('style'); else el.setAttribute('style', old); delete el.dataset.soilQaStyle; }));
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


const guide = page => page.locator('[data-growing-space-soil-guide]');
const guideButton = page => page.getByRole('button', { name: 'Help me choose soil & materials →', exact: true });
async function edit(page, id='bed') {
  await openSpace(page,id,false);
  await dialog(page).getByRole('button',{name:'Edit space details',exact:true}).click();
  await dialog(page).getByLabel('Name',{exact:true}).waitFor();
}
async function openGuide(page) {
  await guideButton(page).click();
  await expect(guide(page)).toBeVisible();
  await expect(guide(page).getByRole('heading',{name:'Soil that suits your space.',exact:true})).toBeFocused();
  await expect(dialog(page)).toHaveCount(1);
  await expect(guide(page).locator('a[download]')).toHaveCount(0);
  await expect(guide(page).getByRole('button',{name:/download|print|pdf/i})).toHaveCount(0);
}
await mkdir(out,{recursive:true});
try {
  const response=await fetch(baseURL,{signal:AbortSignal.timeout(timeout)});
  assert.ok(response.ok,`Local app is not ready: HTTP ${response.status}`);
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--no-default-browser-check']});
  await runScenario('Draft fields photo unknown context and repeated guide exits', 'account', async ({page,state})=>{
    await garden(page); await edit(page);
    const fields={name:'Unsaved garden corner',length:'9',width:'3',depth:'2',irrigation:'Unsaved drip plan',soil:'Unsaved medium',notes:'Keep these unsaved notes.'};
    for(const [name,value] of Object.entries(fields)) await dialog(page).locator(`[name="${name}"]`).fill(value);
    await dialog(page).getByLabel('Sun exposure',{exact:true}).selectOption('Part sun');
    await expect(dialog(page).getByRole('radio',{name:'Not sure yet',exact:true})).toBeChecked();
    await dialog(page).locator('input[type=file]').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
    for(const width of widths){
      await page.setViewportSize({width,height:900});
      await assertGeometry(page,dialog(page));
      const setupViolations=violations(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).include('dialog').analyze());
      report.accessibility.scans.push({name:`setup-${width}`,width,feature:setupViolations,full:setupViolations,baselineWithoutSoil:[]});
      assert.deepEqual(setupViolations,[],`Setup dialog accessibility at ${width}`);
      await screenshot(page,`setup-${width}`);
      for(const exit of ['Back','Close','Escape']){
        await openGuide(page);
        await expect(guide(page).locator('input[type=radio]:checked')).toHaveCount(0);
        await expect(guide(page)).toContainText('Choose a growing setup above');
        await guide(page).locator('input[value=container]').check();
        await assertGeometry(page,guide(page));
        if(exit==='Back'){
          await checkA11y(page,`guide-${width}`);
          await screenshot(page,`guide-${width}`);
          await guide(page).getByRole('button',{name:'← Back to growing-space setup',exact:true}).first().click();
        } else if(exit==='Close') await dialog(page).getByRole('button',{name:'Close dialog',exact:true}).click();
        else await page.keyboard.press('Escape');
        await expect(guide(page)).toHaveCount(0);
        await expect(guideButton(page)).toBeFocused();
        for(const [name,value] of Object.entries(fields)) await expect(dialog(page).locator(`[name="${name}"]`)).toHaveValue(value);
        await expect(dialog(page).getByLabel('Sun exposure',{exact:true})).toHaveValue('Part sun');
        await expect(dialog(page).getByRole('radio',{name:'Not sure yet',exact:true})).toBeChecked();
        assert.equal(await dialog(page).locator('input[type=file]').evaluate(el=>el.files[0].name),'synthetic.png');
        await expect(dialog(page)).toContainText('1 picture(s) selected');
        assert.equal(state.writes.length,0);
      }
    }
  });
  await runScenario('All contexts materials 26 crops and context reset', 'account',async({page,state})=>{
    await garden(page); await edit(page); await openGuide(page);
    for(const [id,definition] of Object.entries(soilGuides)){
      await guide(page).locator(`input[value="${id}"]`).check();
      await expect(guide(page)).toContainText(definition.title);
    }
    const ingredients=guide(page).locator('details').filter({has:page.locator('summary',{hasText:'Explore soil ingredients'})}).first();
    await ingredients.locator(':scope > summary').focus(); await page.keyboard.press('Enter');
    await expect(ingredients).toHaveAttribute('open','');
    for(const material of soilMaterials){
      const item=ingredients.locator('details').filter({has:page.locator('summary strong',{hasText:material.name})});
      await item.locator('summary').click();
      await expect(item).toContainText(material.helps);
      await expect(item).toContainText(material.caution);
      await expect(item.locator('a')).toHaveCount(material.sources.length);
    }
    await guide(page).locator('summary').filter({hasText:'Growing a particular plant?'}).click();
    await expect(guide(page).getByLabel('Vegetable',{exact:true}).locator('option')).toHaveCount(27);
    await guide(page).locator('input[value=container]').check();
    for(const profile of vegetableSoilProfiles){
      await guide(page).getByLabel('Vegetable',{exact:true}).selectOption(profile.name);
      await assertRows(soil(page),profile,'container');
      report.coverage.pickerChecks.push(profile.name);
    }
    await guide(page).getByLabel('Vegetable',{exact:true}).selectOption('Tomato');
    await guide(page).locator('input[value=ground]').check();
    await assertMethod(soil(page),'bed');
    await soil(page).getByRole('button',{name:'Container',exact:true}).click();
    await soil(page).locator('summary').click();
    await expect(soil(page).locator('details')).toHaveAttribute('open','');
    await guide(page).locator('input[value=raised]').check();
    await assertMethod(soil(page),'bed');
    await assertRows(soil(page),getVegetableSoilProfile('Tomato'),'bed');
    await expect(soil(page).locator('details')).not.toHaveAttribute('open','');
    for(const width of widths){
      await page.setViewportSize({width,height:900});
      await assertGeometry(page,guide(page));
      await checkA11y(page,`expanded-${width}`);
      await screenshot(page,`expanded-${width}`,guide(page));
    }
    assert.equal(state.writes.length,0);
  });
  for(const [base,method,context] of [['open-soil','bed','raised'],['closed-base','container','container']]){
    await runScenario(`Saved ${base} re-edit SpacePanel and PlantPlanner`,'account',async({page,state})=>{
      await garden(page); await edit(page);
      const before=JSON.parse(state.spaces.find(row=>row.id==='soil-bed').notes);
      await dialog(page).locator(`input[name=raisedBedBase][value="${base}"]`).check();
      await openGuide(page);
      await expect(guide(page).locator(`input[value="${context}"]`)).toBeChecked();
      // A read-only alternate context must not change the actual saved base.
      await guide(page).locator('input[value=ground]').check();
      await page.keyboard.press('Escape');
      await expect(dialog(page).locator(`input[name=raisedBedBase][value="${base}"]`)).toBeChecked();
      await dialog(page).getByRole('button',{name:'Save Growing Space',exact:true}).click();
      await expect(dialog(page).getByRole('heading',{name:'Edit Growing Space',exact:true})).toHaveCount(0);
      await page.reload(); await garden(page); await edit(page);
      await expect(dialog(page).locator(`input[name=raisedBedBase][value="${base}"]`)).toBeChecked();
      const after=JSON.parse(state.spaces.find(row=>row.id==='soil-bed').notes);
      assert.equal(after.raisedBedBase,base);
      delete after.raisedBedBase;
      assert.deepEqual(after,before,'All existing details must survive saving the base');
      await dialog(page).getByRole('button',{name:'Close dialog',exact:true}).click();
      await openSpace(page,'bed');
      await dialog(page).getByLabel('Choose a plant',{exact:true}).selectOption('catalog:Tomato');
      await assertMethod(soil(page),method); await assertRows(soil(page),getVegetableSoilProfile('Tomato'),method);
      await dialog(page).getByRole('button',{name:'Close dialog',exact:true}).click();
      await page.getByRole('button',{name:'Plant planner',exact:true}).click();
      await dialog(page).getByLabel('Crop',{exact:true}).selectOption('Tomato');
      await dialog(page).getByLabel('Growing space',{exact:true}).selectOption('soil-bed');
      await assertMethod(soil(page),method); await assertRows(soil(page),getVegetableSoilProfile('Tomato'),method);
    });
  }
  await runScenario('Existing space types and new unsaved space use the right guide','account',async({page,state})=>{
    await garden(page);
    for(const [id,expected] of [['ground','ground'],['pot-a','container'],['bag','container'],['legacy-bag','container'],['unknown',null]]){
      await edit(page,id); await openGuide(page);
      if(expected) await expect(guide(page).locator(`input[value="${expected}"]`)).toBeChecked();
      else await expect(guide(page).locator('input[type=radio]:checked')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await dialog(page).getByRole('button',{name:'Close dialog',exact:true}).click();
    }
    await page.getByRole('button',{name:'+ Add Growing Space',exact:true}).click();
    await dialog(page).getByLabel('Name',{exact:true}).fill('New unsaved space');
    await openGuide(page);
    await page.keyboard.press('Escape');
    await expect(dialog(page).getByLabel('Name',{exact:true})).toHaveValue('New unsaved space');
    assert.equal(state.writes.length,0);
  });
  await runScenario('Setup and guide contrast across seasonal themes','account',async({page,state})=>{
    await garden(page); await edit(page);
    await page.setViewportSize({width:390,height:900});
    for(const season of ['spring','summer','fall','winter']){
      await page.evaluate(value=>{document.documentElement.dataset.season=value;},season);
      const setup=violations(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).include('dialog').analyze());
      assert.deepEqual(setup,[],`Setup accessibility in ${season}`);
      await openGuide(page); await guide(page).locator('input[value=container]').check();
      await checkA11y(page,`theme-${season}`);
      await page.keyboard.press('Escape');
    }
    assert.equal(state.writes.length,0);
  });
  await runScenario('Hydroponics show warning rather than soil instructions','account',async({page,state})=>{
    await garden(page); await edit(page,'hydro');
    await expect(guideButton(page)).toHaveCount(0);
    await expect(dialog(page).getByLabel('Soil or growing medium (optional)',{exact:true})).toBeVisible();
    await dialog(page).getByRole('button',{name:'Close dialog',exact:true}).click();
    await openSpace(page,'hydro');
    await dialog(page).getByLabel('Choose a plant',{exact:true}).selectOption('catalog:Tomato');
    await expect(soil(page)).toContainText('do not apply to a hydroponic nutrient solution');
    await expect(soil(page).locator('dt, details, button')).toHaveCount(0);
    await expect(soil(page)).not.toContainText('Preferred soil pH:');
    await expect(soil(page)).not.toContainText(getVegetableSoilProfile('Tomato').moisture);
    assert.equal(state.writes.length,0);
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

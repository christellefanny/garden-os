// Browser verification against a local app and synthetic guest data only.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { navigateGarden } from './helpers/navigate.mjs';

const origin = 'http://127.0.0.1:3054';
const layoutKey = 'garden-os-custom-layouts-v1-guest-planning';
const mode = process.env.GARDEN_TEST_PRODUCTION ? ['start'] : ['dev', '--webpack'];
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...mode, '--hostname', '127.0.0.1', '--port', '3054'], {
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'guest-dashboard-fixture' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
server.stdout.on('data', chunk => { log += chunk; });
server.stderr.on('data', chunk => { log += chunk; });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      if ((await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok) { ready = true; break; }
    } catch {}
    if (server.exitCode !== null) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Local app is ready');
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); });
  const heading = name => page.getByRole('heading', { name, exact: true });
  const button = name => page.getByRole('button', { name, exact: true });
  const readLayouts = () => page.evaluate(key => localStorage.getItem(key), layoutKey);
  const assertNoLayoutPreview = async () => {
    assert.equal(await heading('My Garden Layout').count(), 0);
    assert.equal(await heading('Imagine your dream garden').count(), 0);
  };

  await page.goto(origin);
  await button('Try it as a guest').click();
  await heading('Keep your garden safe').waitFor();
  const firstHomePanel = page.locator('.modern-dashboard > :first-child');
  const guestNotice = page.getByRole('region', { name: 'Guest storage' });
  assert.match(await firstHomePanel.locator('h1').textContent(), /Welcome to\s*Garden Atelier/);
  assert.equal(await page.locator('.modern-dashboard > .atelier-welcome-banner + .guest-storage-notice').count(), 1);
  const navigation = page.getByRole('navigation', { name: 'Garden Atelier navigation' });
  assert.ok((await navigation.boundingBox()).y < (await firstHomePanel.boundingBox()).y);
  await guestNotice.getByRole('button', { name: 'Save to an account', exact: true }).waitFor();
  await button('Continue as guest').click();
  await heading('What to Plant Now').waitFor();
  await button('Find my growing zone').waitFor();
  const order = await page.evaluate(() => [...document.querySelector('.modern-dashboard').children].slice(0, 3).map(element => ({ className: element.className, label: element.getAttribute('aria-label') })));
  assert.match(order[0].className, /atelier-welcome-banner/);
  assert.equal(order[1].label, 'Your first garden steps');
  assert.equal(order[2].className, 'atelier-planting-lead');
  assert.equal(await page.locator('.modern-dashboard > .atelier-planting-lead + .home-workspace-tools').count(), 1);
  assert.equal(await page.locator('.home-workspace-tools .guest-storage-notice').count(), 1);
  assert.equal(await page.getByRole('textbox', { name: 'Search my garden' }).count(), 0);
  await page.getByRole('combobox', { name: 'Change seasonal theme' }).waitFor();
  await button('Account settings').waitFor();
  if (process.env.GARDEN_HOME_TOP_SCREENSHOT) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: process.env.GARDEN_HOME_TOP_SCREENSHOT, style: '.floating-add-task { visibility: hidden !important; }' });
  }
  assert.equal(await page.locator('.atelier-welcome-banner').getByText('A little planning. A lot of growing.', { exact: true }).count(), 1);
  assert.equal(await page.locator('.atelier-welcome-note').count(), 0);
  await assertNoLayoutPreview();
  assert.equal(await heading('This Week').count(), 0);
  assert.equal(await heading('Recent Observations').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const assertLayout = async () => {
    const rects = await page.evaluate(() => [...document.querySelector('.modern-dashboard').children].slice(0, 3).map(element => {
      const rect = element.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height };
    }));
    assert.ok(rects[0].height <= 325, 'The hero stays compact');
    assert.ok(rects[0].bottom <= rects[1].top && rects[1].bottom <= rects[2].top, 'Sections do not overlap and are in visual order');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  };
  const section = page.getByRole('region', { name: 'What to Plant Now', exact: true });
  const rows = section.getByRole('button', { name: /^Explore / });
  const assertCompactPlants = async () => {
    assert.equal(await rows.count(), 3);
    for (const row of await rows.all()) {
      const box = await row.boundingBox();
      assert.ok(box.height >= 44 && box.height <= 72, 'Plant button is compact and touch friendly');
      assert.equal(await row.locator('img[alt=""]').count(), 1);
      assert.equal(await row.locator('strong').count(), 1);
      assert.equal(await row.locator('small').count(), 0);
      assert.equal(await row.locator('span[aria-hidden="true"]').textContent(), '›');
      assert.doesNotMatch(await row.textContent(), /Check local timing|Vegetable|Flower|Herb/);
    }
    const first = rows.first();
    const name = await first.locator('strong').textContent();
    await first.click();
    const dialog = page.getByRole('dialog', { name, exact: true });
    await dialog.getByRole('heading', { name: 'Is there still time?', exact: true }).waitFor();
    await dialog.getByText('Check local timing', { exact: true }).waitFor();
    await dialog.getByText(/^(Vegetable|Flower|Herb)$/).waitFor();
    await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
  };
  await assertLayout();
  await assertCompactPlants();
  await section.scrollIntoViewIfNeeded();
  if (process.env.GARDEN_PLANTING_SECTION_SCREENSHOT) {
    await section.screenshot({ path: process.env.GARDEN_PLANTING_SECTION_SCREENSHOT, style: ".floating-add-task { visibility: hidden !important; }" });
  }
  if (process.env.GARDEN_GUEST_HOME_SCREENSHOT) {
    await page.locator('.modern-dashboard').screenshot({ path: process.env.GARDEN_GUEST_HOME_SCREENSHOT });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await assertLayout();
  await assertCompactPlants();
  if (process.env.GARDEN_GUEST_HOME_DESKTOP_SCREENSHOT) {
    await page.locator('.modern-dashboard').screenshot({ path: process.env.GARDEN_GUEST_HOME_DESKTOP_SCREENSHOT });
  }
  await page.setViewportSize({ width: 390, height: 844 });

  await navigateGarden(page, 'Calendar');
  await heading('Calendar').waitFor();
  assert.equal(await page.locator('.conservatory-content .modern-topbar').count(), 1);
  assert.equal(await page.locator('.home-workspace-tools').count(), 0);
  assert.equal(await page.locator('.modern-dashboard .guest-storage-notice').count(), 0);
  assert.equal(await guestNotice.count(), 1);
  await button('Add reminder').waitFor();
  assert.equal(await page.getByRole('region', { name: 'Weekly garden emails' }).count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

  await navigateGarden(page, 'Home');
  await page.locator('.floating-add-task').click();
  await page.getByLabel('Task', { exact: true }).fill('Water the seedlings');
  await button('Save task').click();
  await page.locator('.week-card').getByText('Water the seedlings', { exact: true }).waitFor();
  await heading('This Week').waitFor();
  assert.equal(await heading('Recent Observations').count(), 0);
  await page.getByRole('checkbox', { name: 'Complete Water the seedlings' }).click();
  await heading('This Week').waitFor({ state: 'hidden' });

  await navigateGarden(page, 'Garden Journal');
  await button('Add observation').click();
  await page.getByLabel('Observation', { exact: true }).fill('First seedlings are up.');
  await button('Save observation').click();
  await page.getByText('First seedlings are up.', { exact: true }).waitFor();
  await navigateGarden(page, 'Home');
  await heading('Recent Observations').waitFor();
  await page.getByText('First seedlings are up.', { exact: true }).waitFor();
  assert.equal(await heading('This Week').count(), 0);

  await navigateGarden(page, 'Plan & Design');
  await button('New Layout').click();
  await button('Use an inspiration layout').click();
  await heading('Choose an inspiration layout').waitFor();
  for (const name of ['Four-bed vegetable garden', 'Compact courtyard garden', 'A garden for bouquets']) {
    await heading(name).waitFor();
  }
  const customize = page.getByRole('button', { name: /Customize four-bed vegetable garden/ });
  await customize.click();
  await page.getByRole('dialog', { name: 'Customize four-bed vegetable garden' }).waitFor();
  assert.equal(await readLayouts(), null);
  await button('Close dialog').click();
  await navigateGarden(page, 'Home');
  await heading('What to Plant Now').waitFor();
  await assertNoLayoutPreview();

  await navigateGarden(page, 'Plan & Design');
  await button('New Layout').click();
  await button('Use an inspiration layout').click();
  await customize.click();
  await page.getByLabel('Layout name', { exact: true }).fill('My saved vegetable plan');
  await button('Create my editable copy').click();
  await heading('My saved vegetable plan').waitFor();
  const saved = await readLayouts();
  assert.equal(JSON.parse(saved)[0].name, 'My saved vegetable plan');
  await navigateGarden(page, 'Home');
  await heading('My Garden Layout').waitFor();
  await page.getByText('My saved vegetable plan', { exact: false }).waitFor();
  await page.reload();
  await heading('My Garden Layout').waitFor();
  await heading('Recent Observations').waitFor();
  assert.equal(await readLayouts(), saved);
  assert.deepEqual(errors, []);
  console.log('PASS 390px: fresh guest Home and Calendar, task and observation visibility, all three templates, no saved example on browse, actual layout and note preserved after reload');
} catch (error) {
  console.error(log.slice(-5000));
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

// Local sign-out verification with a fake account and non-persistent fixture.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { navigateGarden } from './helpers/navigate.mjs';

const origin = 'http://127.0.0.1:3055';
const fixture = spawn(process.execPath, ['tests/fixtures/supabase.mjs'], { stdio: 'ignore' });
const mode = process.env.GARDEN_TEST_PRODUCTION ? ['start'] : ['dev', '--webpack'];
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...mode, '--hostname', '127.0.0.1', '--port', '3055'], {
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'garden-os-local-preview' },
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
  const button = (name, scope = page) => scope.getByRole('button', { name, exact: true });
  let logouts = 0;
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/auth/v1/logout') logouts++;
  });
  await page.goto(origin);
  await button('Already have an account?').click();
  await page.getByLabel('Email', { exact: true }).fill('garden@example.test');
  await page.getByLabel('Password', { exact: true }).fill('fixture-password');
  await button('Open my garden').click();

  const footer = page.locator('.modern-dashboard > footer:last-child');
  const signOut = button('Sign out', footer);
  await signOut.waitFor();
  assert.equal(await page.locator('.modern-dashboard > .atelier-welcome-banner:first-child').count(), 1);
  assert.equal(await page.locator('.modern-dashboard .home-workspace-tools .modern-topbar').count(), 1);
  assert.equal(await page.getByRole('region', { name: 'Guest storage' }).count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const search = page.getByRole('textbox', { name: 'Search my garden' });
  await search.waitFor();
  const heading = name => page.getByRole('heading', { name, exact: true });
  const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const checkGuide = async () => {
    await navigateGarden(page, 'Beginner’s Guide');
    await heading('Beginner’s Guide').waitFor();
    const guideTask = page.locator('.beginner-guide-task').getByRole('button', { name: '+ Add task', exact: true });
    assert.equal(await page.locator('.floating-add-task').count(), 0);
    await guideTask.click();
    const taskDialog = page.getByRole('dialog', { name: 'Add a task' });
    await taskDialog.waitFor();
    await page.keyboard.press('Escape');
    await taskDialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.activeElement?.matches('.beginner-guide-task .add-task-button'));
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await noOverflow();
      assert.ok((await guideTask.boundingBox()).height >= 44);
    }
    const contrastViolations = async () => (await new AxeBuilder({ page }).include('.beginner-guide-task button').withRules(['color-contrast']).analyze()).violations;
    assert.deepEqual(await contrastViolations(), [], 'Focused Add task text contrast');
    await guideTask.blur();
    assert.deepEqual(await contrastViolations(), [], 'Unfocused Add task text contrast');
    if (process.env.GARDEN_INLINE_TASK_SCREENSHOT) {
      await guideTask.blur();
      await guideTask.scrollIntoViewIfNeeded();
      await page.screenshot({ path: process.env.GARDEN_INLINE_TASK_SCREENSHOT });
    }
    await guideTask.click();
    await taskDialog.getByLabel('Task', { exact: true }).fill('Fixture guide task');
    await taskDialog.getByRole('button', { name: 'Save task', exact: true }).click();
    await taskDialog.waitFor({ state: 'hidden' });
    await page.locator('.beginner-guide-task').getByRole('status').getByText('Task saved. Find it in Tasks and Calendar.').waitFor();
    await button('Sketch a layout').click();
    await page.waitForURL(/view=garden-layout/);
    await page.locator('.floating-add-task').waitFor();
  };
  await checkGuide();
  await navigateGarden(page, 'Settings');
  await button('Sign out', page.locator('.settings-card').filter({ has: page.getByRole('heading', { name: 'Garden account' }) })).waitFor();
  await navigateGarden(page, 'Home');
  await signOut.click();
  await button('Try it as a guest').waitFor();
  assert.equal(logouts, 1, 'Home sign out calls the existing logout path');
  await page.reload();
  await button('Try it as a guest').click();
  await button('Continue as guest').click();
  await page.getByRole('heading', { name: 'What to Plant Now', exact: true }).waitFor();
  assert.equal(await page.locator('.modern-dashboard > footer').count(), 0);
  assert.equal(await search.count(), 0);
  if (process.env.GARDEN_HOME_FIRST_STEPS_SCREENSHOT) {
    await page.getByRole('region', { name: 'Your first garden steps' }).screenshot({
      path: process.env.GARDEN_HOME_FIRST_STEPS_SCREENSHOT,
      style: '.floating-add-task { visibility: hidden !important; }',
    });
  }
  await button('Create my garden →').click();
  const gardenForm = page.getByRole('dialog', { name: 'Create your garden' });
  await gardenForm.waitFor();
  await page.keyboard.press('Escape');
  await gardenForm.waitFor({ state: 'hidden' });
  await checkGuide();
  await navigateGarden(page, 'Home');
  await page.evaluate(() => {
    const saved = { id: 'synthetic-garden', name: 'Synthetic garden', year: 2026, location: null, hardiness_zone: null };
    const other = { ...saved, id: 'synthetic-empty', name: 'Empty garden' };
    const space = { id: 'synthetic-bed', garden_id: saved.id, name: 'Test tomato bed', notes: '', type: 'bed' };
    localStorage.setItem('garden-os-guest-data', JSON.stringify({ gardens: [saved, other], spaces: [space] }));
    localStorage.setItem('garden-os-active-garden-guest', saved.id);
  });
  await page.reload();
  await search.waitFor();
  await search.fill('tomato');
  await page.getByRole('button', { name: /Test tomato bed/ }).waitFor();
  await navigateGarden(page, 'My Gardens');
  await heading('My Gardens').waitFor();
  assert.equal(await search.inputValue(), '');
  await page.getByRole('button', { name: /Empty garden/ }).click();
  await heading('Empty garden').waitFor();
  assert.equal(await search.count(), 0);
  await noOverflow();
  console.log('PASS 390px: signed-in Home footer signs out via fixture, Settings remains unchanged, and guest/search/guide task navigation verified');
} catch (error) {
  console.error(log.slice(-5000));
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  fixture.kill('SIGTERM');
}

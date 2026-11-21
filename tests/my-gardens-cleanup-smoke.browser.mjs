// Local fixture only. Never signs into a real account or writes to production.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { isolateBrowserContext } from './helpers/isolated-browser.mjs';
import { navigateGarden } from './helpers/navigate.mjs';

const origin = 'http://127.0.0.1:3057';
const fixture = spawn(process.execPath, ['tests/fixtures/supabase.mjs'], { stdio: 'ignore' });
const mode = process.env.GARDEN_TEST_PRODUCTION ? ['start'] : ['dev', '--webpack'];
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...mode, '--hostname', '127.0.0.1', '--port', '3057'], {
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
  await isolateBrowserContext(context);
  const page = await context.newPage();
  const button = (name, scope = page) => scope.getByRole('button', { name, exact: true });
  const heading = name => page.getByRole('heading', { name, exact: true });
  const nav = page.getByRole('navigation', { name: 'Garden Atelier navigation' });
  const steps = page.getByRole('region', { name: 'Your first garden steps' });
  const entry = page.getByRole('region', { name: 'Inspiration Board' });
  const visitCollection = async () => {
    await steps.waitFor();
    await navigateGarden(page, 'My Gardens');
    await heading('My Gardens').waitFor();
    await button('+ New Garden').waitFor();
    assert.equal(await steps.count(), 0);
    assert.equal(await button('Inspiration Board', nav).count(), 0);
    const link = button('Open Inspiration Board →', entry);
    await link.waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    return link;
  };

  await page.goto(origin);
  await button('Already have an account?').click();
  await page.getByLabel('Email', { exact: true }).fill('garden@example.test');
  await page.getByLabel('Password', { exact: true }).fill('fixture-password');
  await button('Open my garden').click();
  await (await visitCollection()).click();
  await heading('Inspiration Board').waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Inspiration Board');
  assert.equal(await button('My Gardens', nav).getAttribute('aria-current'), 'page');
  await button('← Back to My Gardens').click();
  await heading('My Gardens').waitFor();
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'My Gardens');
  await navigateGarden(page, 'Beginner’s Guide');
  await heading('Beginner’s Guide').waitFor();
  await button('Help me start').waitFor();

  await navigateGarden(page, 'Home');
  await button('Sign out', page.locator('.modern-dashboard footer')).click();
  await button('Try it as a guest').click();
  await button('Continue as guest').click();
  const openInspiration = await visitCollection();
  await page.getByText('Your first garden starts here', { exact: true }).waitFor();
  if (process.env.GARDEN_COLLECTION_SCREENSHOT) await entry.screenshot({ path: process.env.GARDEN_COLLECTION_SCREENSHOT });
  await button('+ New Garden').click();
  await page.getByRole('dialog', { name: 'Create your garden' }).waitFor();
  await page.keyboard.press('Escape');
  await openInspiration.click();
  await heading('Inspiration Board').waitFor();
  assert.match(page.url(), /view=garden-inspiration/);
  await button('+ Create a board').click();
  await page.getByRole('textbox', { name: 'Board name' }).fill('My patio ideas');
  await button('Create board').click();
  await button('← Back to My Gardens').click();
  await heading('My Gardens').waitFor();
  assert.equal(await page.evaluate(() => window.scrollY), 0);
  for (const view of ['garden-inspiration', 'vision-board']) {
    await page.goto(origin + '/?view=' + view);
    await heading('Inspiration Board').waitFor();
    await button('My Gardens', nav).waitFor();
    assert.equal(await button('My Gardens', nav).getAttribute('aria-current'), 'page');
    await button('Browse collections').click();
    await button('Edit board name My patio ideas').waitFor();
  }
  console.log('PASS 390px: account/guest My Gardens navigation, Home and Guide preserved, guest New Garden opens, legacy link and saved board work');
} catch (error) {
  console.error(log.slice(-5000));
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  fixture.kill('SIGTERM');
}

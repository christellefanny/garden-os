// Local sign-out verification with a fake account and non-persistent fixture.
import { chromium } from 'playwright';
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
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
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
  console.log('PASS 390px: signed-in Home footer signs out via fixture, Settings remains unchanged, and guest Home has no sign-out button');
} catch (error) {
  console.error(log.slice(-5000));
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  fixture.kill('SIGTERM');
}

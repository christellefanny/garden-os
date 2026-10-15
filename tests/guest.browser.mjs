import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
const fixture = spawn(process.execPath, ['tests/fixtures/supabase.mjs']);
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1'], { env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'garden-os-local-preview' }, stdio: 'ignore' });
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch('http://127.0.0.1:3000')).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const cloudWrites = [];
  page.on('request', r => { if (r.method() !== 'GET' && /rest\/v1|api\/state/.test(r.url())) cloudWrites.push(r.url()); });
  await page.goto('http://127.0.0.1:3000');
  await page.getByRole('button', { name: 'Continue as guest', exact: true }).click();
  await page.getByRole('heading', { name: 'Keep your garden safe' }).waitFor();
  await page.getByRole('button', { name: 'Continue as guest', exact: true }).click();
  await page.getByRole('button', { name: 'My Gardens', exact: true }).click();
  await page.getByLabel('Garden Name', { exact: true }).fill('Guest vegetable garden');
  await page.getByRole('button', { name: 'Save Garden', exact: true }).click();
  await page.getByRole('button', { name: '+ Add Growing Space' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Guest tomato bed');
  await page.getByLabel('Length (feet)', { exact: true }).fill('4');
  await page.getByLabel('Width (feet)', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Save Growing Space', exact: true }).click();
  await page.getByRole('heading', { name: 'Guest tomato bed', exact: true }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Guest tomato bed', exact: true }).waitFor();
  assert.equal(await page.getByRole('heading', { name: 'Keep your garden safe' }).count(), 0);
  assert.equal(cloudWrites.length, 0, 'guests must never write to authenticated storage');
  await page.evaluate(() => {
    localStorage.setItem('garden-os-plant-vault-guest', JSON.stringify([{ id: 'guest-plant', name: 'Tomato', variety: 'Roma', category: 'Vegetable', statuses: ['Have Seeds'], source: '', year: '2027', notes: '' }]));
    localStorage.setItem('garden-os-calendar-guest', JSON.stringify({ lastFrost: '05-15', firstFrost: '10-15', plants: {}, tasks: { 'guest-task': { status: 'done' } } }));
  });
  let interrupted = false;
  await page.route('**/api/state', async route => {
    if (route.request().method() === 'PUT' && !interrupted) {
      interrupted = true;
      return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
    }
    return route.continue();
  });
  await page.getByRole('button', { name: 'Save to an account', exact: true }).click();
  await page.getByRole('button', { name: 'Already growing with us? Sign in' }).click();
  await page.getByLabel('Email', { exact: true }).fill('garden@example.test');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Open my garden', exact: true }).click();
  await page.getByRole('button', { name: 'Retry account save', exact: true }).waitFor();
  assert.ok(await page.evaluate(() => localStorage.getItem('garden-os-guest-data')));
  await page.getByRole('button', { name: 'Retry account save', exact: true }).click();
  await page.getByRole('button', { name: 'My Gardens', exact: true }).waitFor();
  await page.getByRole('button', { name: 'My Gardens', exact: true }).click();
  const state = await (await fetch('http://127.0.0.1:54321/control/state')).json();
  assert.ok(state.gardens.some(g => g.name === 'Guest vegetable garden'));
  assert.equal(state.spaces.filter(s => s.name === 'Guest tomato bed').length, 1);
  assert.equal(state.gardens.filter(g => g.name === 'Guest vegetable garden').length, 1);
  assert.ok(state.syncedState.some(s => s.key.includes('plant-vault') && s.value.some(p => p.id === 'guest-plant')));
  assert.ok(state.syncedState.some(s => s.key.includes('calendar') && s.value.tasks['guest-task'].status === 'done'));
  assert.ok(await page.evaluate(() => localStorage.getItem('garden-os-guest-data')), 'recovery copy remains');
  console.log('PASS guest creates garden and space without account, reloads, then transfers to account while preserving recovery copy');
} finally { await browser?.close(); server.kill(); fixture.kill(); }

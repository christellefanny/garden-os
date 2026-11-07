/* Local fixtures only. Covers real navigation and preservation of saved work. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import { navigateGarden } from './helpers/navigate.mjs';

const origin = 'http://127.0.0.1:3058';
const fixture = spawn(process.execPath, ['tests/fixtures/supabase.mjs'], { stdio: 'ignore' });
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3058'], {
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'garden-os-local-preview' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '', browser;
server.stdout.on('data', data => logs += data);
server.stderr.on('data', data => logs += data);
const sections = page => page.getByRole('navigation', { name: 'Growing Calendar sections' });
const sidebar = page => page.getByRole('navigation', { name: 'Garden Atelier navigation' });
async function verifyCurrent(page, label, view) {
  assert.equal(new URL(page.url()).searchParams.get('view'), view);
  assert.equal(await sections(page).getByRole('button', { name: label, exact: true }).getAttribute('aria-current'), 'page');
  assert.equal(await sidebar(page).getByRole('button', { name: 'Growing Calendar', exact: true }).getAttribute('aria-current'), 'page');
  assert.equal(await sidebar(page).getByRole('button', { name: 'Tasks', exact: true }).count(), 0);
  assert.equal(await sidebar(page).getByRole('button', { name: 'Garden Journal', exact: true }).count(), 0);
  assert.equal(await sections(page).getByRole('button').count(), 3);
}
try {
  for (let n = 0; n < 120; n++) {
    try { if ((await fetch(origin, { signal: AbortSignal.timeout(1500) })).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process', '--no-zygote'] });
  for (const guest of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    if (guest) await context.addInitScript(() => {
      localStorage.setItem('garden-os-guest-active', 'true');
      localStorage.setItem('garden-os-guest-warning-seen', 'true');
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin);
    if (!guest) {
      if (!(await page.getByLabel('Email', { exact: true }).isVisible())) await page.getByRole('button', { name: 'Already have an account?', exact: true }).click();
      await page.getByLabel('Email', { exact: true }).fill('garden@example.test');
      await page.getByLabel('Password', { exact: true }).fill('fixture-password');
      await page.getByRole('button', { name: 'Open my garden', exact: true }).click();
    }
    await sidebar(page).waitFor();
    assert.equal(await sections(page).count(), 0);
    await navigateGarden(page, 'Growing Calendar');
    await verifyCurrent(page, 'Calendar', 'calendar');
    await sections(page).getByRole('button', { name: 'Calendar', exact: true }).focus();
    await page.keyboard.press('Tab');
    assert.equal(await sections(page).getByRole('button', { name: 'Tasks', exact: true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Enter');
    await verifyCurrent(page, 'Tasks', 'tasks');
    await navigateGarden(page, 'Garden Journal');
    await verifyCurrent(page, 'Garden Journal', 'journal');
    await page.goBack(); await verifyCurrent(page, 'Tasks', 'tasks');
    await page.goForward(); await verifyCurrent(page, 'Garden Journal', 'journal');
    await navigateGarden(page, 'Growing Calendar');
    await verifyCurrent(page, 'Calendar', 'calendar');
    assert.ok(await sections(page).evaluate(el => el.getBoundingClientRect().top >= 0));
    const historyLength = await page.evaluate(() => history.length);
    await navigateGarden(page, 'Growing Calendar');
    assert.equal(await page.evaluate(() => history.length), historyLength);
    for (const [view, label] of [['calendar', 'Calendar'], ['tasks', 'Tasks'], ['journal', 'Garden Journal']]) {
      await page.goto(origin + '/?view=' + view);
      await sections(page).waitFor(); await verifyCurrent(page, label, view);
      await page.reload(); await sections(page).waitFor(); await verifyCurrent(page, label, view);
    }
    await navigateGarden(page, 'Tasks');
    await page.locator('.floating-add-task').click();
    await page.getByRole('dialog').getByLabel('Task', { exact: true }).fill('Navigation regression task');
    await page.getByRole('button', { name: 'Save task', exact: true }).click();
    await page.getByText('Navigation regression task', { exact: true }).first().waitFor();
    await navigateGarden(page, 'Garden Journal');
    await page.getByRole('button', { name: 'Add observation', exact: true }).click();
    await page.getByRole('dialog').getByLabel('Observation', { exact: true }).fill('Navigation regression observation');
    await page.getByRole('button', { name: 'Save observation', exact: true }).click();
    await page.getByText('Navigation regression observation', { exact: true }).waitFor();
    await navigateGarden(page, 'Tasks');
    await page.reload(); await page.getByText('Navigation regression task', { exact: true }).first().waitFor();
    await navigateGarden(page, 'Garden Journal');
    await page.reload(); await page.getByText('Navigation regression observation', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Add observation', exact: true }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(), 0);
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [label, view] of [['Calendar', 'calendar'], ['Tasks', 'tasks'], ['Garden Journal', 'journal']]) {
        await sections(page).getByRole('button', { name: label, exact: true }).click();
        await verifyCurrent(page, label, view);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, label + ' at ' + width);
        const contained = await sections(page).evaluate(nav => {
          const navBounds = nav.getBoundingClientRect();
          return [...nav.querySelectorAll('button')].every(button => {
            const bounds = button.getBoundingClientRect();
            const label = [...button.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            const range = document.createRange(); range.selectNodeContents(label);
            const text = range.getBoundingClientRect();
            return bounds.left >= navBounds.left && bounds.right <= navBounds.right && text.left >= bounds.left && text.right <= bounds.right;
          });
        });
        assert.ok(contained, label + ' button and label bounds at ' + width);
      }
    }
    for (const season of ['spring', 'summer', 'fall', 'winter']) {
      await page.getByLabel('Change seasonal theme').selectOption(season);
      const axe = await new AxeBuilder({ page }).include('.growing-hub-navigation').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations.map(item => item.id), [], season + ' navigation accessibility');
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PASS: guest/account grouping, direct URLs, reload, default entry, repeated clicks, Back/Forward, keyboard, saved tasks/journal, modal dismissal, five widths with label bounds, four seasonal accessibility checks.');
} catch (error) { console.error(error); console.error(logs.slice(-2500)); process.exitCode = 1; }
finally { await browser?.close(); server.kill('SIGTERM'); fixture.kill('SIGTERM'); }

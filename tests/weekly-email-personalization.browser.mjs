/* Isolated local UI/API test. No real account, subscription or mail provider is used. */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";

const origin = "http://127.0.0.1:3012";
const fixtureOrigin = "http://127.0.0.1:54321";
const user = "a0a0a0a0-0000-4000-8000-000000000001";
const key = `garden-os-weekly-email-${user}`;
const fixture = spawn(process.execPath, ["tests/fixtures/supabase.mjs"], { stdio: "pipe" });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3012"], {
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: fixtureOrigin, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "garden-os-local-preview",
    RESEND_API_KEY: "fixture-no-mail", GARDEN_EMAIL_FROM: "Garden <fixture@example.test>", SUPABASE_SERVICE_ROLE_KEY: "fixture", CRON_SECRET: "fixture", VERCEL_ENV: "preview" },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
for (const child of [fixture, server]) {
  child.stdout?.on("data", chunk => serverLog += chunk);
  child.stderr?.on("data", chunk => serverLog += chunk);
}
let browser;
const state = async () => (await (await fetch(fixtureOrigin + "/control/state")).json()).syncedState.find(row => row.key === key);
try {
  for (let attempt = 0; attempt < 160; attempt++) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.equal((await fetch(origin)).status, 200, "Isolated app started");
  browser = await chromium.launch({ executablePath: process.env.GARDEN_TEST_BROWSER || "/usr/bin/chromium", args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let saves = 0, previews = 0;
  page.on("request", request => { if (request.url() === origin + "/api/weekly-email" && request.method() === "POST") saves++; });
  // UI preview checks are mocked before the network boundary. Rendering is
  // verified separately in the unit test with a mocked mail provider.
  await page.route("**/api/weekly-email/test", async route => {
    previews++;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, recipient: "garden@example.test" }) });
  });
  await page.goto(origin);
  if (!(await page.getByLabel("Email", { exact: true }).isVisible())) await page.getByRole("button", { name: "Already have an account?", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Open my garden", exact: true }).click();
  await page.locator(".modern-dashboard").waitFor();
  const nav = page.getByRole("navigation", { name: "Garden Atelier navigation" });
  await nav.getByRole("button", { name: "Growing Calendar", exact: true }).click();
  const card = page.getByRole("region", { name: "Weekly garden emails" });
  await card.waitFor();
  assert.equal(await page.locator("#weekly-email").count(), 1, "One signup entry point, not a duplicate below the briefing");
  assert.equal(await page.locator("#weekly-brief #weekly-email").count(), 0);
  assert.equal(await card.evaluate(el => el.nextElementSibling?.classList.contains("calendar-toolbar")), true, "Signup is directly above calendar controls");
  await page.getByRole("button", { name: "Subscribe by email", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Email subscription" });
  const firstName = dialog.getByRole("textbox", { name: "First name", exact: true });
  await firstName.waitFor();
  assert.equal(await firstName.getAttribute("autocomplete"), "given-name");
  assert.equal(await firstName.getAttribute("maxlength"), "80");
  await dialog.getByLabel("Deliver to").fill("garden@example.test");
  await dialog.getByLabel("Send my weekly garden priorities by email").check();
  await dialog.getByRole("button", { name: "Save subscription", exact: true }).click();
  assert.equal(await firstName.evaluate(el => el.validity.valueMissing), true);
  assert.equal(saves, 0, "Blank name is blocked before saving an enabled subscription");
  await firstName.fill("   ");
  await dialog.getByRole("button", { name: "Save subscription", exact: true }).click();
  await dialog.getByText("Enter your first name (up to 80 characters).", { exact: true }).waitFor();
  assert.equal(await state(), undefined, "Whitespace validation leaves preferences untouched");
  await firstName.fill("  Élodie  ");
  await dialog.getByRole("button", { name: "Save subscription", exact: true }).click();
  await dialog.waitFor({ state: "detached" });
  assert.equal((await state()).value.firstName, "Élodie");
  assert.equal((await state()).value.day, 1);
  const open = async () => { await page.getByRole("button", { name: "Manage subscription", exact: true }).click(); await firstName.waitFor(); };
  await open();
  assert.equal(await firstName.inputValue(), "Élodie");
  await firstName.fill("Unsaved");
  assert.equal(await dialog.getByRole("button", { name: "Send me a preview", exact: true }).isDisabled(), true);
  const savedCount = saves;
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  assert.equal(saves, savedCount, "Close does not save name edits");
  await open();
  assert.equal(await firstName.inputValue(), "Élodie");
  await firstName.fill("Still unsaved");
  await page.keyboard.press("Escape");
  await open();
  assert.equal(await firstName.inputValue(), "Élodie");
  await dialog.getByRole("button", { name: "Send me a preview", exact: true }).click();
  await dialog.getByText(/Preview accepted for garden@example.test/).waitFor();
  assert.equal(previews, 1);
  assert.equal((await state()).value.firstName, "Élodie");
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.reload();
  await open();
  assert.equal(await firstName.inputValue(), "Élodie", "Saved first name survives reload");
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await nav.getByRole("button", { name: "Home", exact: true }).click();
  await page.goBack();
  await card.waitFor();
  assert.equal(await page.getByRole("dialog").count(), 0, "History return does not resurrect dismissed form");
  await mkdir("docs/previews/email-personalization", { recursive: true });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await card.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Calendar does not overflow at ${width}px`);
    const box = await card.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width, "Subscription card fits viewport");
    if (width === 1440 || width === 390) await page.screenshot({ path: `docs/previews/email-personalization/calendar-${width}.png` });
    await open();
    assert.equal(await dialog.evaluate(el => el.scrollWidth > el.clientWidth), false, `Form does not overflow at ${width}px`);
    assert.equal(await firstName.inputValue(), "Élodie");
    if (width === 1440 || width === 390) {
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      assert.deepEqual(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], `Form accessibility at ${width}px`);
      await page.screenshot({ path: `docs/previews/email-personalization/form-${width}.png` });
    }
    await dialog.getByRole("button", { name: "Close dialog" }).click();
  }
  // Simulate an older subscriber with no firstName, without changing a real account.
  const current = await state();
  const { firstName: omitted, ...oldPreferences } = current.value;
  assert.equal(omitted, "Élodie");
  const legacySaved = await fetch(fixtureOrigin + "/rest/v1/rpc/garden_os_save_state", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_key: key, p_value: oldPreferences, p_version: current.version }),
  });
  assert.equal(legacySaved.status, 200);
  await page.reload();
  await open();
  assert.equal(await firstName.inputValue(), "");
  assert.equal(await dialog.getByRole("button", { name: "Send me a preview", exact: true }).isDisabled(), false, "Legacy subscriber can preview without a name");
  await dialog.getByLabel("Send my weekly garden priorities by email").uncheck();
  await dialog.getByRole("button", { name: "Save subscription", exact: true }).click();
  await dialog.waitFor({ state: "detached" });
  assert.equal((await state()).value.enabled, false, "Opting out never requires adding a name");
  assert.equal((await state()).value.firstName, undefined);
  assert.deepEqual(errors, []);
  console.log("PASS: signup beside calendar, required first-name validation, persisted Unicode name, preview save guard, close/Escape/history/reload flows, nameless legacy opt-out, 320/390/768/1440 layouts and desktop/mobile accessibility. No live accounts or emails used.");
} catch (error) {
  console.error(error);
  console.error(serverLog.slice(-3500));
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
  fixture.kill("SIGTERM");
}

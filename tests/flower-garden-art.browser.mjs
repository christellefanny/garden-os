// Local-only representative garden fixtures. Never connects to production data.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const fixture = spawn(process.execPath, ["tests/fixtures/supabase.mjs"], { stdio: "ignore" });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3041"], { stdio: "ignore" });
let browser;
try {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch("http://127.0.0.1:3041", { signal: AbortSignal.timeout(1500) })).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    const plants = [["Dianthus", "Paint the Town Magenta"], ["Astilbe", ""], ["Hydrangea", "Pink"], ["Dahlia", "Approved image"]].map(([name, variety], i) => ({ name, variety, id: `flower-qa-${i}`, category: "Flower", statuses: ["Have Plant"], source: "Isolated fixture", year: "", notes: "", ...(i === 3 ? { photoUrl: "http://127.0.0.1:3041/email/dahlia.jpg" } : {}) }));
    localStorage.setItem("garden-os-plant-vault-a0a0a0a0-0000-4000-8000-000000000001", JSON.stringify(plants));
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:3041");
  await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Open my garden", exact: true }).click();
  await page.getByRole("navigation").getByRole("button", { name: "Flower Garden", exact: true }).click();
  await page.getByRole("button", { name: /My flowers.*4 flowers/ }).click();
  assert.equal(await page.locator("article").count(), 4);
  assert.equal(await page.getByRole("img", { name: /^Botanical illustration of / }).count(), 3);
  assert.equal(await page.getByRole("img", { name: "Approved image Dahlia", exact: true }).getAttribute("src"), "http://127.0.0.1:3041/email/dahlia.jpg");
  for (const article of await page.locator("article").all()) {
    await article.scrollIntoViewIfNeeded();
    await article.locator("img").evaluate(async img => { await img.decode(); });
  }
  await mkdir("docs/previews/flower-garden-botanical", { recursive: true });
  await page.screenshot({ path: "docs/previews/flower-garden-botanical/my-flowers-desktop.webp", fullPage: true });
  await page.getByRole("button", { name: /Back to Flower Garden/ }).click();
  await page.getByRole("button", { name: /^Cut Flowers/ }).click();
  const gallery = page.locator('[aria-label="Cut Flower Encyclopedia"]');
  assert.equal(await gallery.locator("article").count(), 30);
  for (const art of await gallery.locator('[role="img"]').all()) {
    await art.scrollIntoViewIfNeeded();
    await art.locator("img").evaluate(async img => { await img.decode(); });
  }
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.getByRole("heading", { name: /Cut Flower Encyclopedia/ }).evaluate(el => el.scrollIntoView({ block: "start" }));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `docs/previews/flower-garden-botanical/cut-flowers-${width}.webp` });
  }
  await page.getByRole("button", { name: /Back to Flower Garden/ }).click();
  await page.getByRole("button", { name: /My flowers.*4 flowers/ }).click();
  assert.equal(await page.locator("article").count(), 4);
  assert.deepEqual(errors, []);
  console.log("PASS: My flowers uses Plant Vault botanical art, saved image precedence, 30 distinct loaded encyclopedia portraits, navigation, and widths 1440/768/390/320.");
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

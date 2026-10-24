// Isolated visual QA: representative records only, no production data or writes.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { vaultBotanicalSubjects } from "../lib/vault-botanical-art.ts";

const fixture = spawn(process.execPath, ["tests/fixtures/supabase.mjs"], { stdio: "ignore" });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3039"], { stdio: "ignore" });
let browser;
try {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch("http://127.0.0.1:3039", { signal: AbortSignal.timeout(1500) })).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const records = vaultBotanicalSubjects.map((p, i) => ({ ...p, id: `qa-${i}`, category: "Other", statuses: ["Have Seeds", "Wishlist"], source: "Isolated QA", year: "", notes: "" }));
  records.push({ id: "qa-custom", name: "Approved custom", variety: "", category: "Other", statuses: ["Have Seeds", "Wishlist"], source: "Isolated QA", year: "", notes: "", photoUrl: "http://127.0.0.1:3039/email/tomato.jpg" });
  await context.addInitScript(records => { localStorage.setItem("garden-os-plant-vault-a0a0a0a0-0000-4000-8000-000000000001", JSON.stringify(records)); }, records);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:3039");
  await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Open my garden", exact: true }).click();
  await page.getByRole("navigation").getByRole("button", { name: "Plant Vault", exact: true }).click();
  await page.getByRole("heading", { name: "Plant Vault", exact: true }).waitFor();
  assert.equal(await page.getByRole("article").count(), records.length);
  assert.equal(await page.getByRole("article").getByRole("img", { name: /^Botanical illustration of / }).count(), vaultBotanicalSubjects.length);
  const custom = page.getByRole("article").filter({ hasText: "Approved custom" });
  assert.equal(await custom.locator("img").getAttribute("src"), records.at(-1).photoUrl);
  for (const art of await page.locator("article [role=img]").all()) {
    await art.scrollIntoViewIfNeeded();
    await art.locator("img").evaluate(async img => { await img.decode(); });
  }
  await mkdir("docs/previews/vault-botanical", { recursive: true });
  const search = page.getByRole("textbox", { name: "Search Plant Vault", exact: true });
  for (const [width, query, file] of [[1440, "Pepper", "peppers-desktop"], [1440, "Lettuce", "lettuce-desktop"], [1440, "", "collection-desktop"], [768, "", "collection-tablet"], [390, "", "collection-mobile"], [320, "", "collection-small-mobile"]]) {
    await page.setViewportSize({ width, height: 1000 });
    await search.fill(query);
    await page.waitForTimeout(400);
    await search.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `docs/previews/vault-botanical/${file}.webp` });
  }
  await page.getByRole("button", { name: "Open Tomato Cherokee Purple", exact: true }).click();
  await page.getByRole("dialog").getByRole("img", { name: /Cherokee Purple/ }).waitFor();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Wishlist", exact: true }).click();
  assert.equal(await page.getByRole("article").count(), records.length);
  assert.deepEqual(errors, []);
  console.log(`PASS: ${vaultBotanicalSubjects.length} botanical mappings, eight loaded atlases, custom-image precedence, modal detail, wishlist, and responsive widths 1440/768/390/320.`);
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

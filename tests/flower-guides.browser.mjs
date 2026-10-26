// Isolated browser QA. No real accounts, mail, or production data.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";

const fixture = spawn(process.execPath, ["tests/fixtures/supabase.mjs"], { stdio: "ignore" });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3043"], { stdio: "ignore" });
let browser;
try {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch("http://127.0.0.1:3043", { signal: AbortSignal.timeout(1500) })).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:3043");
  await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Open my garden", exact: true }).click();
  await page.getByRole("navigation").getByRole("button", { name: "Flower Garden", exact: true }).click();
  const vaultBefore = await page.evaluate(() => localStorage.getItem("garden-os-plant-vault-a0a0a0a0-0000-4000-8000-000000000001"));
  await mkdir("docs/previews/flower-guides", { recursive: true });
  const cases = [["Seasonal planting", ".flower-seasonal-planning", 4, "seasonal"], ["Seed saving", ".flower-seed-saving", 6, "saving"], ["Flower care", ".flower-care-library", 12, "care"]];
  for (const [label, selector, count, file] of cases) {
    await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
    const root = page.locator(selector);
    assert.equal(await root.locator("article").count(), count);
    for (const img of await root.locator("img").all()) await img.evaluate(async img => { img.loading = "eager"; await img.decode(); });
    if (label === "Seasonal planting") {
      for (const [season, title] of [["spring", "Wake up the flower garden"], ["summer", "Keep the color coming"], ["fall", "Prepare for next spring"], ["winter", "Let the garden rest"]]) {
        await page.getByLabel("Change seasonal theme").selectOption(season);
        await root.getByRole("heading", { name: title, exact: true }).waitFor();
        assert.equal(await root.getByText("Season in view", { exact: true }).count(), 1);
      }
      await page.getByLabel("Change seasonal theme").selectOption("fall");
    }
    if (label === "Seed saving") {
      assert.equal(await root.getByRole("img", { name: /^Seed-saving illustration of / }).count(), 6);
      assert.match(await root.innerText(), /Named hybrids may not grow true to type/);
    }
    if (label === "Flower care") {
      await root.getByRole("button", { name: "Shade-friendly", exact: true }).click();
      assert.equal(await root.locator("article").count(), 4);
      await root.getByRole("heading", { name: "Hydrangea", exact: true }).waitFor();
      await root.getByRole("button", { name: "Sun-loving", exact: true }).click();
      assert.equal(await root.locator("article").count(), 9);
      assert.equal(await root.getByRole("heading", { name: "Hydrangea", exact: true }).count(), 0);
      await root.getByRole("button", { name: "All flowers", exact: true }).click();
    }
    const axe = await new AxeBuilder({ page }).include(selector).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    assert.deepEqual(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], `${label} accessibility`);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => scrollTo(0, 0));
      for (const img of await root.locator("img").all()) await img.evaluate(async img => { img.loading = "eager"; await img.decode(); });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${label} overflow at ${width}`);
      if (width === 1440 || width === 390) await page.screenshot({ path: `docs/previews/flower-guides/${file}-${width}.webp`, fullPage: true });
    }
    await page.getByRole("button", { name: /Back to Flower Garden/ }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  assert.equal(await page.evaluate(() => localStorage.getItem("garden-os-plant-vault-a0a0a0a0-0000-4000-8000-000000000001")), vaultBefore);
  assert.deepEqual(errors, []);
  console.log("PASS: all 22 guidance cards, 4 seasonal selections, 6 seed specimen illustrations, care filters, WCAG AA checks, three desktop/mobile screenshots, widths 1440/768/390/320, unchanged collection and no runtime errors.");
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

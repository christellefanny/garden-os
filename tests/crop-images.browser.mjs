/* Crop image QA uses four isolated fixture spaces; no production data. */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = spawn(process.execPath, [
  repo + "/tests/fixtures/supabase.mjs",
]);
const server = spawn(
  process.execPath,
  [
    repo + "/node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
  ],
  {
    cwd: repo,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "garden-os-local-preview",
    },
  },
);
let browser;
const errors = [];
server.stderr.on("data", (d) => errors.push(String(d)));
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:3000")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  const crops = [
    ["Peppers", "Serrano"],
    ["Lettuce", "Romaine"],
    ["Tomatoes", "Roma"],
    ["Onions", "Red"],
  ];
  const plants = crops.map(([name, variety], i) => ({
    id: "crop-" + i,
    name,
    variety,
    category: "Vegetable",
    statuses: ["Growing Now"],
    source: "Image QA fixture",
    year: "2026",
    notes: "",
  }));
  await fetch("http://127.0.0.1:54321/rest/v1/growing_spaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      plants.map((p, i) => ({
        id: "bed-" + i,
        garden_id: "garden-1",
        name: p.name + " bed",
        type: "Raised Bed",
        length_feet: 4,
        width_feet: 2,
        notes: JSON.stringify({
          garden_os: 1,
          notes: "",
          plants: [
            {
              id: "plant-" + i,
              vaultPlantId: p.id,
              name: p.name,
              variety: p.variety,
              quantity: 2,
              spacing: 12,
              planted: "2026-05-20",
              status: "Growing",
            },
          ],
          entries: [],
        }),
      })),
    ),
  });
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1536, height: 1024 },
  });
  await context.addInitScript(
    (plants) =>
      localStorage.setItem(
        "garden-os-plant-vault-a0a0a0a0-0000-4000-8000-000000000001",
        JSON.stringify(plants),
      ),
    plants,
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3000");
  await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page
    .getByRole("button", { name: "Open my garden", exact: true })
    .click();
  await page.locator(".modern-dashboard").waitFor();
  for (const destination of ["My Gardens", "Plant Vault"]) {
    await page
      .getByRole("button", { name: destination, exact: true })
      .first()
      .click();
    const selector =
      destination === "My Gardens"
        ? ".space-visual img"
        : ".vault-plant-card img";
    await page.locator(selector).first().waitFor();
    assert.equal(await page.locator(selector).count(), 4);
    for (const width of [1536, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const image of await page.locator(selector).all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((img) => img.decode());
        assert.ok(await image.evaluate((img) => img.naturalWidth > 0));
        assert.match(await image.getAttribute("src"), /crop-portraits-v2/);
      }
      await page.evaluate(() => scrollTo(0, 0));
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(axe.violations, [], JSON.stringify(axe.violations));
      await page.screenshot({
        path: `${repo}/docs/previews/crop-images-${destination === "My Gardens" ? "spaces" : "vault"}-${width === 1536 ? "desktop" : "mobile"}.png`,
        fullPage: true,
      });
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: peppers, lettuce, tomatoes and onions render decoded artwork in growing spaces and Vault on desktop/mobile; no overflow or WCAG violations; no production data changed.",
  );
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

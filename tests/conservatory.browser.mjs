/* Modern Conservatory end-to-end QA. All records are isolated fixtures, never production data. */
import { chromium } from "playwright";
import { spawn, spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const build = spawnSync("npm", ["run", "build"], {
  cwd: repo,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "garden-os-local-preview",
  },
  stdio: "inherit",
});
if (build.status !== 0) process.exit(build.status || 1);
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
(async () => {
  let browser;
  try {
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://127.0.0.1:3000")).ok) break;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    const plants = [
      "Tomato",
      "Bell Pepper",
      "Garlic",
      "Okra",
      "Lettuce",
      "Zinnia",
      "Cosmos",
      "Basil",
    ].map((name, i) => ({
      id: "vault-" + i,
      name,
      variety: name === "Tomato" ? "Roma" : name === "Garlic" ? "Music" : "",
      category: i < 5 ? "Vegetable" : i < 7 ? "Flower" : "Herb",
      statuses: ["Growing Now", "Have Seeds"],
      source: "QA fixture",
      year: "2026",
      notes: "",
    }));
    const beds = [
      "Flowers",
      "Herbs",
      "Garlic",
      "Green Peppers",
      "Okra",
      "Tomatoes (1)",
      "Tomatoes (2)",
      "Hot Peppers (1)",
      "Hot Peppers (2)",
    ];
    await fetch("http://127.0.0.1:54321/rest/v1/growing_spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        beds.map((name, i) => ({
          id: "space-" + i,
          garden_id: "garden-1",
          name,
          type: i < 2 ? "In-ground Bed" : "Raised Bed",
          length_feet: 4,
          width_feet: 2,
          notes: JSON.stringify({
            garden_os: 1,
            notes: "QA garden",
            plants:
              i > 1 && i < 7
                ? [
                    {
                      id: "p-" + i,
                      name: [
                        "Garlic",
                        "Bell Pepper",
                        "Okra",
                        "Tomato",
                        "Tomato",
                      ][i - 2],
                      variety: i === 5 ? "Roma" : "",
                      quantity: 4,
                      spacing: 12,
                      planted: "2026-05-20",
                      status: "Growing",
                    },
                  ]
                : [],
            entries:
              i === 5
                ? [
                    {
                      id: "log-1",
                      kind: "Harvest",
                      date: "2026-10-10",
                      text: "Picked ripe Roma tomatoes.",
                      quantity: 3.5,
                      unit: "lb",
                      plantId: "Roma tomato",
                    },
                    {
                      id: "log-2",
                      kind: "Note",
                      date: "2026-10-08",
                      text: "New flowers opening along the border.",
                    },
                  ]
                : [],
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
      (data) =>
        localStorage.getItem(
          "garden-os-plant-vault-a0a0a0a0-0000-4000-8000-000000000001",
        ) ||
        localStorage.setItem(
          "garden-os-plant-vault-a0a0a0a0-0000-4000-8000-000000000001",
          JSON.stringify(data),
        ),
      plants,
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:3000");
    await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
    await page.getByLabel("Password", { exact: true }).fill("fixture-password");
    await page
      .getByRole("button", { name: "Open my garden", exact: true })
      .click();
    await page.locator(".modern-dashboard").waitFor();
    await page.locator(".featured-grid").scrollIntoViewIfNeeded();
    await page.evaluate(async () => {
      await Promise.all(
        [...document.images].map((img) => img.decode().catch(() => {})),
      );
    });
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: repo + "/docs/previews/modern-desktop.png",
      fullPage: true,
    });
    for (const destination of [
      "My Gardens",
      "Plant Vault",
      "Garden Layout",
      "Growing Calendar",
      "Tasks",
      "Journal",
      "Settings",
      "Help",
      "Dashboard",
    ]) {
      await page
        .locator('nav[aria-label="Garden OS navigation"]')
        .getByRole("button", { name: destination, exact: true })
        .click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        destination,
      );
    }
    await page
      .locator('nav[aria-label="Garden OS navigation"]')
      .getByRole("button", { name: "My Gardens", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Tomatoes (1)", exact: true })
      .getByRole("button")
      .click();
    let dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "+ Add Plant", exact: true })
      .click();
    await dialog.getByLabel("Plant name", { exact: true }).fill("Garlic");
    await dialog.getByLabel("Variety (optional)").fill("Music");
    await dialog.getByLabel("Quantity", { exact: true }).fill("5");
    await dialog.getByLabel("Spacing (inches)").fill("5");
    await dialog
      .getByRole("button", { name: "Save Plant", exact: true })
      .click();
    await dialog.getByText("Plant saved.", { exact: true }).waitFor();
    await page.keyboard.press("Escape");
    await page
      .locator('nav[aria-label="Garden OS navigation"]')
      .getByRole("button", { name: "Journal", exact: true })
      .click();
    await page
      .getByLabel("Growing space", { exact: true })
      .selectOption("space-5");
    await page.getByLabel("Activity", { exact: true }).selectOption("Harvest");
    await page.getByLabel("Date", { exact: true }).fill("2026-10-11");
    await page
      .getByLabel("Harvest plant / variety", { exact: true })
      .fill("Roma tomato");
    await page
      .getByLabel("Harvest quantity (optional)", { exact: true })
      .fill("2");
    await page
      .getByLabel("Observation", { exact: true })
      .fill("Measured tomato harvest");
    await page
      .getByRole("button", { name: "Save journal entry", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Journal entry saved." })
      .waitFor();
    await page.getByText("5.5 lb", { exact: true }).waitFor();
    await page
      .locator('nav[aria-label="Garden OS navigation"]')
      .getByRole("button", { name: "Garden Layout", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Create a layout", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Layout name")
      .fill("Front Yard Plan");
    await page
      .getByRole("button", { name: "Create blank canvas", exact: true })
      .click();
    await page.getByRole("button", { name: "Add bed", exact: true }).click();
    await page.getByLabel("Item name", { exact: true }).fill("Tomato border");
    await page
      .getByLabel("Linked growing space", { exact: true })
      .selectOption("space-5");
    await page.getByLabel("Bed color", { exact: true }).fill("#739c71");
    await page.getByRole("button", { name: "Plan View", exact: true }).click();
    await page
      .locator('nav[aria-label="Garden OS navigation"]')
      .getByRole("button", { name: "Growing Calendar", exact: true })
      .click();
    await page
      .getByText("Choose plants and adjust planning dates", { exact: true })
      .click();
    const frost = page.getByLabel("Spring frost planning date", {
      exact: true,
    });
    await frost.fill((await frost.inputValue()).slice(0, 4) + "-05-20");
    const remoteKey =
      "garden-os-plant-vault-a0a0a0a0-0000-4000-8000-000000000001";
    for (let i = 0; i < 50; i++) {
      const current = await (
        await fetch("http://127.0.0.1:54321/control/state")
      ).json();
      if (
        current.syncedState.some((r) => r.key === remoteKey) &&
        current.syncedState.some((r) => r.key.includes("custom-layouts")) &&
        current.syncedState.some(
          (r) => r.key.includes("calendar-") && r.value.lastFrost === "05-20",
        )
      )
        break;
      await new Promise((r) => setTimeout(r, 100));
    }
    const second = await browser.newContext({
      viewport: { width: 1200, height: 900 },
    });
    const phone = await second.newPage();
    await phone.goto("http://127.0.0.1:3000");
    await phone
      .getByLabel("Email", { exact: true })
      .fill("garden@example.test");
    await phone
      .getByLabel("Password", { exact: true })
      .fill("fixture-password");
    await phone
      .getByRole("button", { name: "Open my garden", exact: true })
      .click();
    await phone.locator(".modern-dashboard").waitFor();
    await phone
      .locator('nav[aria-label="Garden OS navigation"]')
      .getByRole("button", { name: "Plant Vault", exact: true })
      .click();
    await phone
      .getByRole("button", { name: "Open Garlic Music", exact: true })
      .waitFor();
    assert.equal(
      await phone
        .getByRole("button", { name: "Open Garlic Music", exact: true })
        .count(),
      1,
    );
    await phone
      .locator('nav[aria-label="Garden OS navigation"]')
      .getByRole("button", { name: "Garden Layout", exact: true })
      .click();
    await phone
      .locator('nav[aria-label="Saved garden layouts"]')
      .getByRole("button", { name: "Front Yard Plan", exact: true })
      .waitFor();
    await phone
      .getByRole("button", { name: "Select Tomato border", exact: true })
      .click();
    await phone
      .locator("aside")
      .filter({
        has: phone.getByRole("heading", { name: "Item details", exact: true }),
      })
      .getByText("Roma", { exact: false })
      .waitFor();
    await phone
      .locator('nav[aria-label="Garden OS navigation"]')
      .getByRole("button", { name: "Growing Calendar", exact: true })
      .click();
    await phone
      .getByText("Choose plants and adjust planning dates", { exact: true })
      .click();
    assert.equal(
      (
        await phone
          .getByLabel("Spring frost planning date", { exact: true })
          .inputValue()
      ).slice(5),
      "05-20",
    );
    await second.close();
    await page
      .locator('nav[aria-label="Garden OS navigation"]')
      .getByRole("button", { name: "Garden Layout", exact: true })
      .click();
    await page
      .locator('nav[aria-label="Saved garden layouts"]')
      .getByRole("button", { name: "Original nine-bed layout", exact: true })
      .click();

    await page
      .locator('nav[aria-label="Garden OS navigation"]')
      .getByRole("button", { name: "Dashboard", exact: true })
      .click();
    await page.locator(".featured-grid").scrollIntoViewIfNeeded();
    await page.evaluate(async () =>
      Promise.all(
        [...document.images].map((img) => img.decode().catch(() => {})),
      ),
    );
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: repo + "/docs/previews/modern-desktop.png",
      fullPage: true,
    });
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: repo + "/docs/previews/modern-mobile.png",
      fullPage: true,
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const mobileAudit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      mobileAudit.violations.map((v) => v.id),
      [],
    );
    for(const width of [320,390,768]){await page.setViewportSize({width,height:900});for(const destination of ['My Gardens','Plant Vault','Garden Layout','Growing Calendar','Tasks','Journal','Settings','Help','Dashboard']){await page.locator('nav[aria-label="Garden OS navigation"]').getByRole('button',{name:destination,exact:true}).click();if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)){console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,100),right:el.getBoundingClientRect().right})).slice(0,12)));}assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${destination} ${width}`);}}
    assert.deepEqual(errors, []);
    console.log(
      "PASS all navigation, actual fixture data and desktop/mobile overflow.",
    );
  } finally {
    await browser?.close();
    server.kill();
    fixture.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

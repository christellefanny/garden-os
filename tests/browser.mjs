/* Isolated integration test: it always builds against the fixture URL. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { spawn, spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import fs from "node:fs";
const repo = path.resolve(__dirname, "..");
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "garden-os-local-preview",
};
const result = spawnSync("npm", ["run", "build"], {
  cwd: repo,
  env,
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status || 1);
const fixture = spawn(
  process.execPath,
  [path.join(__dirname, "fixtures/supabase.mjs")],
  { stdio: "pipe" },
);
const server = spawn(
  process.execPath,
  [
    path.join(repo, "node_modules/next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
  ],
  { cwd: repo, env, stdio: "pipe" },
);
server.stderr.on("data", (d) => console.error(d.toString()));
let browser;
(async () => {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:3000")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    executablePath: process.env.GARDEN_TEST_BROWSER || undefined,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    timezoneId: "America/Chicago",
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3000");
  await page
    .getByRole("heading", { name: "Welcome to your garden." })
    .waitFor();
  fs.mkdirSync(path.join(repo, "docs/previews"), { recursive: true });
  await page.screenshot({
    path: path.join(repo, "docs/previews/welcome-desktop.png"),
    fullPage: true,
  });
  await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page
    .getByRole("button", { name: "Open my garden", exact: true })
    .click();
  await page
    .getByRole("button", { name: "+ Add Growing Space", exact: true })
    .waitFor();
  assert.equal(
    await page.locator("article").count(),
    0,
    "No fictional starter spaces",
  );
  await page
    .getByRole("button", { name: "+ Add Growing Space", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("Tomato Bed");
  await dialog.getByLabel("Length (feet)", { exact: true }).fill("6");
  await dialog.getByLabel("Width (feet)", { exact: true }).fill("3");
  await dialog
    .getByLabel("Notes", { exact: true })
    .fill("Sunny bed beside the fence.");
  await dialog
    .getByRole("button", { name: "Save Growing Space", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Open Space", exact: false }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "+ Add Plant", exact: true })
    .click();
  await dialog.getByLabel("Plant name", { exact: true }).fill("Tomato");
  await dialog.getByLabel("Variety (optional)").fill("Cherokee Purple");
  await dialog.getByLabel("Quantity", { exact: true }).fill("4");
  await dialog.getByLabel("Spacing (inches)").fill("24");
  await dialog.getByRole("button", { name: "Save Plant", exact: true }).click();
  await dialog.getByText("Plant saved.", { exact: true }).waitFor();
  await dialog.getByLabel("Activity", { exact: true }).selectOption("Harvest");
  await dialog
    .getByLabel("What happened?", { exact: true })
    .fill("Picked 2 lb of tomatoes.");
  await dialog
    .getByRole("button", { name: "Save Activity", exact: true })
    .click();
  await dialog.getByText("Activity saved.", { exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await dialog.count(), 0);
  assert.equal(await page.getByText("89%", { exact: true }).count(), 1);
  await page.reload();
  await page
    .getByRole("heading", { name: "Tomato Bed", exact: true })
    .waitFor();
  assert.equal(
    await page.getByText("Picked 2 lb of tomatoes.", { exact: true }).count(),
    1,
  );
  const seasons = ["spring", "summer", "fall", "winter"];
  for (const season of seasons) {
    await page.selectOption("#season-theme", season);
    await page.waitForFunction(
      (s) => document.documentElement.dataset.season === s,
      season,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      `${season} accessibility`,
    );
    await page.screenshot({
      path: path.join(repo, `docs/previews/${season}-desktop.png`),
      fullPage: true,
    });
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        `${season}: overflow at ${width}`,
      );
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.screenshot({
      path: path.join(repo, `docs/previews/${season}-mobile.png`),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
  await page.selectOption("#season-theme", "fall");
  await page.getByRole("button", { name: "Harvest", exact: true }).click();
  await page.getByRole("checkbox").first().check();
  await page.reload();
  await page.getByRole("button", { name: "Harvest", exact: true }).click();
  assert.equal(await page.getByRole("checkbox").first().isChecked(), true);
  await page
    .getByRole("button", { name: "Open Plant Planner", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  assert.equal(await dialog.getByText("8", { exact: true }).count(), 1);
  await dialog.getByLabel("Spacing (in)", { exact: true }).fill("0");
  assert.equal(await dialog.getByText("—", { exact: true }).count(), 1);
  await dialog
    .getByLabel("Space shape", { exact: true })
    .selectOption("Round container or bag");
  await dialog.getByLabel("Crop", { exact: true }).selectOption("Garlic");
  await dialog.getByLabel("Top diameter (in)", { exact: true }).fill("22");
  assert.equal(await dialog.getByText("15", { exact: true }).count(), 1);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open Space", exact: false }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Edit Tomato", exact: true })
    .click();
  await dialog.getByLabel("Status", { exact: true }).selectOption("Finished");
  await dialog.getByRole("button", { name: "Save Plant", exact: true }).click();
  await dialog.getByText("Plant saved.", { exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByText("0%", { exact: true }).count(), 1);
  // Failed mutation retains the form and never displays a false success.
  await page
    .getByRole("button", { name: "+ Add Growing Space", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("Not Saved");
  await dialog.getByLabel("Length (feet)").fill("4");
  await dialog.getByLabel("Width (feet)").fill("2");
  await fetch("http://127.0.0.1:54321/control/fail");
  await dialog
    .getByRole("button", { name: "Save Growing Space", exact: true })
    .click();
  await dialog.getByRole("alert").waitFor();
  assert.equal(
    await dialog.getByLabel("Name", { exact: true }).inputValue(),
    "Not Saved",
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page.getByRole("heading", { name: "Not Saved", exact: true }).count(),
    0,
  );
  // Archive keeps records, and restore returns them to active totals.
  await page.getByRole("button", { name: "Open Space", exact: false }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByText("Archive this space", { exact: true }).click();
  await dialog
    .getByRole("button", { name: "Archive Space", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await page.locator("article").count(), 0);
  await page.getByText("Archived spaces (1)", { exact: true }).click();
  await page
    .getByRole("button", { name: "Restore Tomato Bed", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Tomato Bed", exact: true })
    .waitFor();
  // Stale edit cannot overwrite newer data.
  await page.getByRole("button", { name: "Open Space", exact: false }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Edit space details", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("Stale Edit");
  await fetch("http://127.0.0.1:54321/control/stale");
  await dialog
    .getByRole("button", { name: "Save Growing Space", exact: true })
    .click();
  await dialog.getByRole("alert").waitFor();
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("heading", { name: "Stale Edit", exact: true })
      .count(),
    0,
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByText("Saved garden refreshed.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "New garden", exact: true }).click();
  await page.getByLabel("Garden Name", { exact: true }).fill("Indoor Garden");
  await page.getByRole("button", { name: "Save Garden", exact: true }).click();
  await page.getByText("Garden saved.", { exact: true }).waitFor();
  assert.equal(
    await page.locator("article").count(),
    0,
    "New garden has its own spaces",
  );
  const state = await (
    await fetch("http://127.0.0.1:54321/control/state")
  ).json();
  assert.equal(state.gardens.length, 2);
  assert.equal(state.spaces.length, 1);
  assert.equal(
    JSON.parse(state.spaces[0].notes).notes,
    "Sunny bed beside the fence.",
  );
  assert.equal(JSON.parse(state.spaces[0].notes).entries.length, 1);
  await page.evaluate(() => {
    localStorage.setItem(
      "garden-os-growing-spaces",
      JSON.stringify([
        {
          id: "legacy-garlic",
          name: "Legacy Garlic",
          type: "Growing Bag",
          size: "25 gal",
          plants: 15,
          crop: "Garlic",
        },
      ]),
    );
    window.dispatchEvent(new Event("storage"));
  });
  await page
    .getByRole("button", {
      name: "Review earlier browser spaces (1)",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Review and import", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await dialog.getByLabel("Diameter (inches)", { exact: true }).fill("22");
  await dialog
    .getByRole("button", { name: "Save Growing Space", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await page
    .getByRole("heading", { name: "Legacy Garlic", exact: true })
    .waitFor();
  const importedState = await (
    await fetch("http://127.0.0.1:54321/control/state")
  ).json();
  assert.equal(importedState.spaces.length, 2);
  assert.equal(
    JSON.parse(importedState.spaces[1].notes).plants[0].quantity,
    15,
  );
  assert.equal(
    JSON.parse(importedState.spaces[1].notes).sourceLegacyId,
    "legacy-garlic",
  );
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("garden-os-growing-spaces"))[0].plants,
    ),
    15,
    "Legacy browser data stays intact",
  );
  assert.deepEqual(errors, [], "No browser exceptions");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page
    .getByRole("heading", { name: "Welcome to your garden." })
    .waitFor();
  console.log(
    "PASS browser: sign-in/out, garden create/switch, space/plant/log persistence, capacities, planner, checklist persistence, archive/restore, failed/stale saves, mobile overflow, 4-season axe, no browser exceptions.",
  );
})()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
    server.kill();
    fixture.kill();
  });

/* Isolated blank-layout integration test. Uses a local Supabase fixture. */
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
import {spawn,spawnSync} from "node:child_process";
import assert from "node:assert/strict";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
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
    browser = await chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:3000");
    await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
    await page.getByLabel("Password", { exact: true }).fill("fixture-password");
    await page
      .getByRole("button", { name: "Open my garden", exact: true })
      .click();
    await page
      .locator("header")
      .getByRole("button", { name: "Growing Calendar", exact: true })
      .waitFor();
    await fetch("http://127.0.0.1:54321/rest/v1/growing_spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "test-space",
        garden_id: "garden-1",
        name: "Test Garlic",
        type: "Raised Bed",
        length_feet: 4,
        width_feet: 2,
        notes: JSON.stringify({
          garden_os: 1,
          notes: "",
          plants: [
            {
              id: "plant-1",
              name: "Garlic",
              variety: "Music",
              quantity: 6,
              spacing: 5,
              planted: "",
              status: "Growing",
            },
          ],
          entries: [],
        }),
      }),
    });
    await page.reload();
    await page
      .locator('nav[aria-label="Garden OS main features"]')
      .getByRole("button", { name: /Garden Layout/ })
      .click();
    await page
      .getByRole("button", { name: "Create a layout", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Layout name")
      .fill("2027 blank plan");
    await page
      .getByRole("button", { name: "Create blank canvas", exact: true })
      .click();
    const canvas = page.locator('[aria-label="Garden layout canvas"]');
    assert.equal(await canvas.getByRole("button").count(), 0);
    await page.getByRole("button", { name: "Add bed", exact: true }).click();
    await page.getByLabel("Item name", { exact: true }).fill("Garlic bed");
    await page.getByLabel("Garden color",{exact:true}).fill("#cde5ce");
    await page.getByLabel("Bed color",{exact:true}).fill("#e7bd67");
    const bed = page.getByRole("button", {
      name: "Select Garlic bed",
      exact: true,
    });
    await bed.scrollIntoViewIfNeeded();
    const bounds = await bed.boundingBox();
    await page.mouse.move(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      bounds.x + bounds.width / 2 + 40,
      bounds.y + bounds.height / 2 + 40,
      { steps: 5 },
    );
    await page.mouse.up();
    assert.ok(
      Number(await page.getByLabel("Left (%)", { exact: true }).inputValue()) >
        10,
    );
    const handle = page.getByRole("button", {
      name: "Resize Garlic bed",
      exact: true,
    });
    await handle.scrollIntoViewIfNeeded();
    const hb = await handle.boundingBox();
    await page.mouse.move(hb.x + 10, hb.y + 10);
    await page.mouse.down();
    await page.mouse.move(hb.x + 40, hb.y + 40, { steps: 5 });
    await page.mouse.up();
    assert.ok(
      Number(await page.getByLabel("Width (%)", { exact: true }).inputValue()) >
        20,
    );
    await bed.press("ArrowRight");
    await page
      .getByLabel("Linked growing space", { exact: true })
      .selectOption("test-space");
    await page
      .locator("aside")
      .getByText(" · Music", { exact: true })
      .waitFor();
    await page
      .locator("aside")
      .getByRole("button", { name: "Manage plants", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "Test Garlic", exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Add container", exact: true })
      .click();
    await page.getByRole("button", { name: "Add path", exact: true }).click();
    await page.getByRole("button", { name: "Add border", exact: true }).click();
    assert.equal(
      await canvas.getByRole("button", { name: /Select/ }).count(),
      4,
    );
    await page
      .getByRole("button", { name: "Back to original layout", exact: true })
      .click();
    assert.equal(
      await page
        .locator('nav[aria-label="Garden layout sections"] button')
        .count(),
      9,
    );
    await page
      .getByRole("button", { name: "Create a layout", exact: true })
      .click();
    assert.equal(
      await canvas.getByRole("button", { name: /Select/ }).count(),
      4,
    );
    await page.reload();
    await page
      .locator('nav[aria-label="Garden OS main features"]')
      .getByRole("button", { name: /Garden Layout/ })
      .click();
    await page
      .getByRole("button", { name: "Create a layout", exact: true })
      .click();
    assert.equal(
      await canvas.getByRole("button", { name: /Select/ }).count(),
      4,
    );
    assert.equal(await page.getByLabel("Garden color",{exact:true}).inputValue(),"#cde5ce");
    await page.getByRole("button",{name:"Select Garlic bed",exact:true}).click();
    assert.equal(await page.getByLabel("Bed color",{exact:true}).inputValue(),"#e7bd67");
    assert.equal(await page.getByRole("button",{name:"Select Garlic bed",exact:true}).evaluate(el=>getComputedStyle(el).color),"rgb(0, 0, 0)");
    await page
      .getByRole("button", { name: "Create layout", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Layout name")
      .fill("Winter ideas");
    await page
      .getByRole("button", { name: "Create blank canvas", exact: true })
      .click();
    assert.equal(await canvas.getByRole("button").count(), 0);
    await page
      .getByLabel("Saved layout", { exact: true })
      .selectOption({ label: "2027 blank plan" });
    assert.equal(
      await canvas.getByRole("button", { name: /Select/ }).count(),
      4,
    );
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS blank creation, drag, resize, keyboard, four item types, multiple layouts, persistence, original nine beds, mobile widths.",
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

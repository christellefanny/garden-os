/* End-to-end UI/API/database test. All garden and weather records are isolated fixtures. */
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
      NODE_OPTIONS: `--import=${repo}/tests/fixtures/weekly-sources.mjs`,
    },
  },
);
const errors = [];
server.stderr.on("data", (d) => errors.push(String(d)));
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch("http://127.0.0.1:3000")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(
    (await fetch("http://127.0.0.1:3000/api/weekly-brief")).status,
    401,
  );
  const user = "a0a0a0a0-0000-4000-8000-000000000001";
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const plants = ["Tomato", "Bell Pepper", "Garlic", "Lettuce", "Marigold"].map(
    (name, i) => ({
      id: "v" + i,
      name,
      variety: i === 0 ? "Roma" : "",
      category: i === 4 ? "Flower" : "Vegetable",
      statuses: i === 2 ? ["Have Seeds"] : ["Growing Now"],
      source: "QA fixture",
      year: "2026",
      notes: "",
    }),
  );
  const calendar = {
    lastFrost: "05-15",
    firstFrost: "10-15",
    plants: { v3: { mode: "indoor" } },
    tasks: {},
    reminders: [
      {
        id: "custom|fixture",
        plantId: "v0",
        title: "Check tomato supports",
        date: day,
      },
    ],
  };
  await fetch("http://127.0.0.1:54321/rest/v1/growing_spaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "bed-1",
      garden_id: "garden-1",
      name: "North vegetable bed",
      type: "Raised Bed",
      length_feet: 4,
      width_feet: 2,
      notes: JSON.stringify({
        garden_os: 1,
        notes: "",
        plants: [
          {
            id: "p1",
            vaultPlantId: "v0",
            name: "Tomato",
            variety: "Roma",
            quantity: 3,
            spacing: 24,
            planted: "2026-05-20",
            status: "Growing",
          },
        ],
        entries: [
          {
            id: "harvest-1",
            kind: "Harvest",
            date: day,
            text: "Ripe fruit",
            quantity: 2,
            unit: "lb",
            plantId: "Roma",
          },
        ],
      }),
    }),
  });
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1536, height: 1024 },
  });
  await context.addInitScript(
    ({ user, plants, calendar }) => {
      if (!localStorage.getItem(`garden-os-plant-vault-${user}`)) {
        localStorage.setItem(
          `garden-os-plant-vault-${user}`,
          JSON.stringify(plants),
        );
        localStorage.setItem(
          `garden-os-calendar-${user}`,
          JSON.stringify(calendar),
        );
      }
    },
    { user, plants, calendar },
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
  await page
    .getByRole("button", { name: "Growing Calendar", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Weekly settings", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Send a weekly phone briefing").check();
  await dialog.getByLabel("Delivery day", { exact: true }).selectOption("1");
  await dialog
    .getByRole("button", { name: "Save weekly settings", exact: true })
    .click();
  for (let i = 0; i < 60; i++) {
    const state = await (
      await fetch("http://127.0.0.1:54321/control/state")
    ).json();
    if (
      state.syncedState.some(
        (s) =>
          s.key === `garden-os-calendar-${user}` && s.value.weekly?.enabled,
      )
    )
      break;
    await new Promise((r) => setTimeout(r, 100));
  }
  await page
    .getByRole("button", { name: "Read this week’s briefing", exact: true })
    .click();
  await page.getByRole("article", { name: "Weekly garden briefing" }).waitFor();
  const report = page.getByRole("article", { name: "Weekly garden briefing" });
  assert.ok((await report.innerText()).includes("North vegetable bed"));
  assert.ok((await report.innerText()).includes("37°F"));
  assert.ok((await report.innerText()).includes("Tomato · Roma"));
  assert.ok((await report.innerText()).includes("Check tomato supports"));
  await report
    .getByRole("button", { name: "Mark complete", exact: true })
    .first()
    .click();
  assert.ok(!(await report.innerText()).includes("Check tomato supports"));
  await page
    .getByRole("button", { name: "Weekly settings", exact: true })
    .click();
  await dialog.getByLabel("Latitude", { exact: true }).fill("120");
  await dialog
    .getByRole("button", { name: "Save weekly settings", exact: true })
    .click();
  assert.ok(await dialog.isVisible());
  await dialog.getByLabel("Latitude", { exact: true }).fill("41.6");
  await dialog.getByLabel("Longitude", { exact: true }).fill("-88.2");
  await dialog
    .getByRole("button", { name: "Save weekly settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Read this week’s briefing", exact: true })
    .click();
  await report.waitFor();
  for (const width of [1536, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator("#weekly-brief").scrollIntoViewIfNeeded();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Overflow at ${width}`,
    );
    if (width === 1536 || width === 390) {
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        result.violations,
        [],
        JSON.stringify(result.violations),
      );
      await page.screenshot({
        path: `${repo}/docs/previews/weekly-brief-${width === 1536 ? "desktop" : "mobile"}.png`,
        fullPage: true,
      });
    }
  }
  await page.goto("http://127.0.0.1:3000/?view=calendar&brief=weekly");
  await page.getByRole("article", { name: "Weekly garden briefing" }).waitFor();
  await page
    .getByRole("button", { name: "Weekly settings", exact: true })
    .click();
  assert.equal(
    await dialog.getByLabel("Send a weekly phone briefing").isChecked(),
    true,
  );
  assert.equal(
    await dialog.getByLabel("Latitude", { exact: true }).inputValue(),
    "41.6",
  );
  const state = await (
    await fetch("http://127.0.0.1:54321/control/state")
  ).json();
  assert.equal(state.spaces.length, 1);
  assert.equal(state.gardens.length, 1);
  assert.ok(
    state.syncedState.find((s) => s.key === `garden-os-calendar-${user}`).value
      .tasks["custom|fixture"].status === "done",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: signed-in UI → weekly API → owner-scoped cloud data → fixture forecast/source checks → rendered briefing; settings/completion persistence; notification deep link; 320/390/768/1536 responsiveness; desktop/mobile Axe. No production records or phone subscriptions used.",
  );
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

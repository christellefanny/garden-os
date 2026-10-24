// Isolated saved-vault fixtures: never connects to production Supabase or sends mail.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
const fixture = spawn(process.execPath, ["tests/fixtures/supabase.mjs"], {
  stdio: "ignore",
});
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1"],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "garden-os-local-preview",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let log = "",
  browser;
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));
const user = "a0a0a0a0-0000-4000-8000-000000000001";
const plants = [
  {
    id: "lettuce",
    name: "Lettuce",
    variety: "Butterhead",
    category: "Vegetable",
    statuses: ["Growing Now"],
    notes: "selected for indoor growing",
    source: "Isolated QA fixture",
    year: "2027",
  },
  {
    id: "pepper",
    name: "Pepper",
    variety: "Bell",
    category: "Vegetable",
    statuses: ["Have Seeds"],
    notes: "",
    source: "Isolated QA fixture",
    year: "2027",
  },
  {
    id: "dahlia",
    name: "Dahlia",
    variety: "",
    category: "Flower",
    statuses: ["Have Seeds"],
    notes: "",
    source: "Isolated QA fixture",
    year: "2027",
  },
];
const calendar = {
  lastFrost: "05-15",
  firstFrost: "10-15",
  plants: {},
  tasks: {},
  reminders: [
    {
      id: "custom|lettuce",
      plantId: "lettuce",
      title: "Check seedling moisture",
      date: "2027-03-18",
      notes: "Only water if the root zone needs it.",
    },
    {
      id: "custom|pepper",
      plantId: "pepper",
      title: "Inspect seed tray",
      date: "2027-03-18",
    },
    {
      id: "custom|dahlia",
      plantId: "dahlia",
      title: "Review packet instructions",
      date: "2027-03-18",
    },
  ],
};
try {
  for (let n = 0; n < 100; n++) {
    try {
      if ((await fetch("http://127.0.0.1:3000")).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.equal(
    (await fetch("http://127.0.0.1:3000/api/weekly-email")).status,
    401,
  );
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--single-process",
      "--no-zygote",
    ],
  });
  const context = await browser.newContext({
    viewport: { width: 1536, height: 1100 },
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
  const page = await context.newPage(),
    errors = [];
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
  await page.locator(".botanical-calendar").waitFor();
  await page.getByLabel("Calendar month", { exact: true }).fill("2027-03");
  const day = page.locator('[data-date="2027-03-18"]');
  await day.click();
  assert.equal(await day.locator(".calendar-task-chip").count(), 2);
  assert.equal(await day.locator(".calendar-task-more").innerText(), "+1 more");
  assert.equal(await page.locator(".calendar-task-detail").count(), 3);
  assert.ok(
    (await page.locator(".calendar-task-detail .calendar-plant-art").count()) >=
      2,
  );
  await mkdir("docs/previews/botanical-calendar", { recursive: true });
  for (const [season, month, src] of [
    ["spring", "2027-03", "spring-lettuce.webp"],
    ["summer", "2027-07", "tomato.webp"],
    ["fall", "2027-10", "garlic.webp"],
    ["winter", "2027-12", "kale.webp"],
  ]) {
    await page.getByLabel("Calendar month", { exact: true }).fill(month);
    await page.locator(`.calendar-season-art[src*="${src}"]`).waitFor();
    await page
      .locator(".calendar-season-art")
      .evaluate((img) =>
        img.complete ? null : new Promise((resolve) => (img.onload = resolve)),
      );
    await page
      .locator(".botanical-calendar")
      .screenshot({ path: `docs/previews/botanical-calendar/${season}.webp` });
  }
  await page.getByLabel("Calendar month", { exact: true }).fill("2027-03");
  await day.click();
  await page.screenshot({
    path: "docs/previews/botanical-calendar/desktop.webp",
    fullPage: true,
  });
  await page
    .locator(".calendar-task-detail")
    .filter({ hasText: "Only water if" })
    .getByRole("button", { name: "Mark done", exact: true })
    .click();
  assert.equal(
    await page
      .locator('[data-date="2027-03-18"] .calendar-mobile-count')
      .textContent(),
    "2 tasks",
  );
  await page
    .getByRole("button", { name: "Weekly email settings", exact: true })
    .click();
  await page
    .getByText("Email delivery isn’t connected yet.", { exact: false })
    .waitFor();
  assert.ok(
    await page
      .getByRole("checkbox", {
        name: "Send my weekly garden priorities by email",
      })
      .isDisabled(),
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  let cloudSaved = false;
  for (let n = 0; n < 60; n++) {
    const state = await (
      await fetch("http://127.0.0.1:54321/control/state")
    ).json();
    if (
      state.syncedState.some(
        (s) =>
          s.key === `garden-os-calendar-${user}` &&
          s.value.tasks?.["custom|lettuce"]?.status === "done",
      )
    ) {
      cloudSaved = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(cloudSaved, true, "completion reached cloud state");
  await page.reload();
  await page
    .getByRole("button", { name: "Growing Calendar", exact: true })
    .first()
    .click();
  await page.getByLabel("Calendar month", { exact: true }).fill("2027-03");
  await page.locator('[data-date="2027-03-18"]').click();
  assert.equal(
    await page
      .locator(".calendar-task-detail")
      .filter({ hasText: "Completed" })
      .count(),
    1,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".botanical-calendar").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "docs/previews/botanical-calendar/mobile.webp",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  for (const width of [320, 768]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const axe = await new AxeBuilder({ page })
    .include(".conservatory-calendar")
    .analyze();
  assert.deepEqual(
    axe.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByLabel("Calendar month", { exact: true }).fill("2028-02");
  assert.equal(await page.locator(".calendar-date").count(), 29);
  await page.getByRole("button", { name: "Next month", exact: true }).click();
  assert.equal(
    await page.getByLabel("Calendar month", { exact: true }).inputValue(),
    "2028-03",
  );
  for (const name of [
    "My Gardens",
    "Plant Vault",
    "Tasks",
    "Garden Journal",
    "Growing Calendar",
  ]) {
    await page.getByRole("button", { name, exact: true }).first().click();
    await page.locator(".interior-page").first().waitFor();
  }
  const guestContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const guest = await guestContext.newPage();
  await guest.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("garden-os-guest-active", "true");
    localStorage.setItem("garden-os-guest-warning-seen", "true");
  });
  await guest.goto("http://127.0.0.1:3000");
  await guest.locator(".modern-dashboard").waitFor();
  await guest
    .getByRole("button", { name: "Growing Calendar", exact: true })
    .first()
    .click();
  await guest.locator(".botanical-calendar").waitFor();
  assert.equal(await guest.locator(".calendar-task-chip").count(), 0);
  assert.ok(
    await guest
      .getByText("Weekly email is available with an account.", { exact: false })
      .count(),
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real month grid, four seasonal illustrations, plant task art, two-label limit, completion + reload + cloud sync, email setup status, guest empty state, mobile fit, accessibility.",
  );
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
  if (log.includes("Error:")) console.error(log.slice(-3000));
}

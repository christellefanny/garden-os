// Isolated beta recovery QA. Build first with the local fixture URL and publishable key.
// No production records or real accounts are used.
import { chromium } from "playwright";
import { navigateGarden } from "./helpers/navigate.mjs";
import { isolateBrowserContext } from "./helpers/isolated-browser.mjs";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const base = "http://127.0.0.1:3101";
const fixtureUrl = "http://127.0.0.1:54321";
const userId = "a0a0a0a0-0000-4000-8000-000000000001";
const key = `garden-os-journal-${userId}`;
const fixture = spawn(process.execPath, ["tests/fixtures/supabase.mjs"], { stdio: "inherit" });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3101"], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: fixtureUrl, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "garden-os-local-preview" },
});
const waitFor = async check => {
  for (let i = 0; i < 120; i++) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.fail("Timed out waiting for cloud recovery");
};
const state = () => fetch(`${fixtureUrl}/control/state`).then(response => response.json());
const signIn = async page => {
  await page.goto(base);
  await page.getByRole("button", { name: "Already have an account?", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Open my garden", exact: true }).click();
  await page.getByRole("navigation", { name: "Garden Atelier navigation" }).waitFor();
};
const navigate = navigateGarden;
const note = async (page, text) => {
  await navigate(page, "Garden Journal");
  await page.getByRole("button", { name: "Add observation", exact: true }).click();
  await page.getByLabel("Observation", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Save observation", exact: true }).click();
  await page.getByText(text, { exact: true }).waitFor();
};
let browser;
try {
  await waitFor(async () => { try { return (await fetch(base)).ok; } catch { return false; } });
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.GARDEN_TEST_BROWSER, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const context = await browser.newContext();
  await isolateBrowserContext(context);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let unavailable = true, failPut = false, putFailed = false;
  const writes = [];
  await page.route("**/api/state", async route => {
    const method = route.request().method();
    if (method === "GET" && unavailable) return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
    if (method === "PUT") {
      writes.push(route.request().postDataJSON());
      if (failPut) {
        failPut = false; putFailed = true;
        return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
      }
    }
    return route.continue();
  });
  await signIn(page);
  await note(page, "Butterflies arrived while cloud loading was unavailable.");
  assert.equal(writes.length, 0, "no upload before a successful cloud read");
  assert.ok(await page.evaluate(pending => localStorage.getItem(pending), `garden-os-sync-pending-${userId}`));
  await navigate(page, "Settings");
  await page.locator(".sync-status").filter({ hasText: "Cloud unavailable" }).waitFor();
  unavailable = false;
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await waitFor(async () => (await state()).syncedState.some(row => row.key === key && row.value.some(entry => entry.text.includes("Butterflies arrived"))));
  await page.locator(".sync-status").filter({ hasText: "All changes synced" }).waitFor();
  await page.reload();
  await page.locator(".sync-status").filter({ hasText: "All changes synced" }).waitFor();

  failPut = true;
  await note(page, "Second note survives a temporary save failure.");
  await waitFor(() => putFailed);
  await navigate(page, "Settings");
  await page.locator(".sync-status").filter({ hasText: "Cloud unavailable" }).waitFor();
  await page.getByText("Recovery & backups", { exact: true }).click();
  await page.getByRole("button", { name: "Retry cloud synchronization", exact: true }).click();
  await waitFor(async () => (await state()).syncedState.find(row => row.key === key)?.value.length === 2);
  await page.locator(".sync-status").filter({ hasText: "All changes synced" }).waitFor();

  // Another device changes the same journal after our last successful read.
  const saved = (await state()).syncedState.find(row => row.key === key);
  const changed = [...saved.value, { id: "other-device", kind: "Note", date: "2026-11-07", text: "Another device's observation." }];
  await fetch(`${fixtureUrl}/rest/v1/rpc/garden_os_save_state`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_key: key, p_value: changed, p_version: saved.version }) });
  await note(page, "Keep this local version as a recovery copy.");
  await waitFor(async () => page.evaluate(key => !!localStorage.getItem(`${key}-cloud-conflict`), key));
  await navigate(page, "Settings");
  await page.locator(".sync-status").filter({ hasText: "differences need review" }).waitFor();
  assert.ok(await page.evaluate(key => localStorage.getItem(`${key}-before-cloud-migration`).includes("Keep this local version"), key));
  await page.getByRole("button", { name: "Use cloud version (keep local backup)", exact: true }).click();
  await page.locator(".sync-status").filter({ hasText: "All changes synced" }).waitFor();
  assert.ok(await page.evaluate(key => localStorage.getItem(`${key}-before-cloud-choice`).includes("Keep this local version"), key));
  await page.reload();
  await navigate(page, "Garden Journal");
  await page.getByText("Another device's observation.", { exact: true }).waitFor();
  assert.equal(await page.getByText("Keep this local version as a recovery copy.", { exact: true }).count(), 0);

  const clean = await browser.newContext();
  await isolateBrowserContext(clean);
  const second = await clean.newPage();
  await signIn(second);
  await navigate(second, "Garden Journal");
  await second.getByText("Another device's observation.", { exact: true }).waitFor();
  await second.getByText("Butterflies arrived while cloud loading was unavailable.", { exact: true }).waitFor();
  await clean.close();

  // Open a real Vault form before recovery. A fresh cloud read must preserve
  // the unsaved draft and block a stale collection from replacing cloud plants.
  const vaultKey = `garden-os-plant-vault-${userId}`;
  const cloudPlant = { id: "cloud-basil", name: "Cloud basil", variety: "", category: "Herb", statuses: ["Growing Now"], source: "Fixture", year: "2026", notes: "" };
  const seedVault = await fetch(`${fixtureUrl}/rest/v1/rpc/garden_os_save_state`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_key: vaultKey, p_value: [cloudPlant], p_version: 0 }) });
  assert.ok(seedVault.ok);
  const editorContext = await browser.newContext();
  await isolateBrowserContext(editorContext);
  const editor = await editorContext.newPage();
  editor.on("pageerror", error => errors.push(error.message));
  let recoveryUnavailable = true;
  const vaultWrites = [];
  await editor.route("**/api/state", route => {
    if (route.request().method() === "GET" && recoveryUnavailable) return route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
    if (route.request().method() === "PUT" && route.request().postDataJSON().key === vaultKey) vaultWrites.push(route.request().postDataJSON());
    return route.continue();
  });
  await signIn(editor);
  await navigate(editor, "Plant Vault");
  await editor.getByRole("button", { name: "Add plant", exact: true }).click();
  await editor.getByLabel("Plant name", { exact: true }).fill("Mint draft remains open");
  recoveryUnavailable = false;
  await editor.evaluate(() => window.dispatchEvent(new Event("online")));
  await waitFor(() => editor.evaluate(key => !!localStorage.getItem(`${key}-cloud-conflict`), vaultKey));
  assert.equal(await editor.getByLabel("Plant name", { exact: true }).inputValue(), "Mint draft remains open");
  assert.equal(await editor.evaluate(key => localStorage.getItem(key), vaultKey), null);
  await editor.getByRole("button", { name: "Save to Plant Vault", exact: true }).click();
  await navigate(editor, "Settings");
  await editor.getByText("Recovery & backups", { exact: true }).click();
  await editor.getByRole("button", { name: "Retry cloud synchronization", exact: true }).click();
  await editor.locator(".sync-status").filter({ hasText: "differences need review" }).waitFor();
  assert.deepEqual(vaultWrites, []);
  assert.deepEqual((await state()).syncedState.find(row => row.key === vaultKey).value, [cloudPlant]);
  assert.ok(await editor.evaluate(key => localStorage.getItem(key).includes("Mint draft remains open"), vaultKey));
  // Resolve the vault explicitly; unrelated staged keys remain reviewable.
  await editor.locator(".interior-notice").filter({ hasText: "Plant Vault has local and cloud versions" }).getByRole("button", { name: "Use cloud version (keep local backup)", exact: true }).click();
  await waitFor(() => editor.evaluate(({ key, userId }) => !Object.hasOwn(JSON.parse(localStorage.getItem(`garden-os-sync-pending-${userId}`) || "{}"), key), { key: vaultKey, userId }));
  assert.ok(await editor.evaluate(key => localStorage.getItem(`${key}-before-cloud-choice`).includes("Mint draft remains open"), vaultKey));
  await navigate(editor, "Plant Vault");
  await editor.getByRole("heading", { name: "Cloud basil", exact: true }).waitFor();
  assert.equal(await editor.getByRole("heading", { name: "Mint draft remains open", exact: true }).count(), 0);
  await editorContext.close();
  assert.deepEqual(errors, []);
  console.log("PASS: failed initial load → local journal edit → reconnect → cloud acknowledgement → reload; temporary save failure + manual retry; genuine conflict + both recovery copies + use-cloud choice; fresh second browser reads saved journal; open Vault draft survives recovery and stale writes stay blocked through manual retry; explicit Settings resolution retains backup; no runtime errors.");
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

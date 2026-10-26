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
    ["Dianthus", "Paint the Town"],
  ];
  const plants = crops.map(([name, variety], i) => ({
    id: "crop-" + i,
    name,
    variety,
    category: i === 4 ? "Flower" : "Vegetable",
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
  await page.getByRole("button", {name:"My Gardens",exact:true}).first().click();
  await page.getByRole("button", {name:"Dianthus bed",exact:true}).click();
  await page.getByRole("button", {name:"+ Add Plant",exact:true}).click();
  assert.equal(await page.getByLabel("Plant category",{exact:true}).count(),0);
  assert.equal(await page.getByLabel("Find a plant",{exact:true}).count(),0);
  const chooser=page.getByLabel("Choose a plant",{exact:true});
  assert.equal(await chooser.locator('option[value="vault:crop-0"]').count(),1);
  assert.equal(await chooser.locator('option[value="vault:crop-4"]').count(),1);
  await chooser.selectOption("catalog:Tulip");
  await page.getByRole("button",{name:"Save Plant",exact:true}).click();
  await page.getByText("Plant saved.",{exact:true}).waitFor();
  let state=await (await fetch("http://127.0.0.1:54321/control/state")).json();
  const tulip=JSON.parse(state.spaces.find(s=>s.id==="bed-4").notes).plants.find(p=>p.name==="Tulip");
  assert.ok(tulip.vaultPlantId);
  assert.equal(tulip.category,"Flower");
  await page.getByRole("button", {name:"+ Add Plant",exact:true}).click();
  await chooser.selectOption("vault:crop-0");
  await page.getByRole("button",{name:"Save Plant",exact:true}).click();
  await page.getByText("Plant saved.",{exact:true}).waitFor();
  state=await (await fetch("http://127.0.0.1:54321/control/state")).json();
  assert.equal(JSON.parse(state.spaces.find(s=>s.id==="bed-4").notes).plants.find(p=>p.name==="Peppers").vaultPlantId,"crop-0");
  await page.getByRole("button",{name:"Edit Peppers",exact:true}).click();
  await page.getByLabel("Quantity",{exact:true}).fill("2");
  await page.getByRole("button",{name:"Save Plant",exact:true}).click();
  await page.getByText("Plant saved.",{exact:true}).waitFor();
  state=await (await fetch("http://127.0.0.1:54321/control/state")).json();
  assert.equal(JSON.parse(state.spaces.find(s=>s.id==="bed-4").notes).plants.find(p=>p.name==="Peppers").vaultPlantId,"crop-0");
  await page.getByRole("button", {name:"+ Add Plant",exact:true}).click();
  for (const width of [1536,390]) {
    await page.setViewportSize({width,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
    await page.getByLabel("Choose a plant",{exact:true}).scrollIntoViewIfNeeded();
    const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
    assert.deepEqual(axe.violations,[],JSON.stringify(axe.violations));
    await page.getByLabel("Choose a plant",{exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`${repo}/docs/previews/plant-picker-${width===1536?"desktop":"mobile"}.png`,fullPage:false});
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: single dropdown with all plants, catalog save, Vault selection, identity-preserving edits; desktop/mobile WCAG and overflow checks.",
  );
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

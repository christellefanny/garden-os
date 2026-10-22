/* Companion guidance QA uses isolated fixture records; no production data. */
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
  const plants = ["Tomato", "Potato", "Basil"].map((name, i) => ({id: "crop-"+i, name, variety: "", category: "Vegetable", statuses: ["Growing Now"], source: "", year: "2026", notes: ""}));
  const records = plants.slice(0,2).map(p => ({id:p.id, name:p.name, variety:"", quantity:1, spacing:24, planted:"", status:"Growing"}));
  const bed = {id:"companion-bed", garden_id:"garden-1", name:"Companion bed", type:"Raised Bed", length_feet:8, width_feet:4, notes:JSON.stringify({garden_os:1, notes:"", plants:records, entries:[]})};
  await fetch("http://127.0.0.1:54321/rest/v1/growing_spaces", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify([bed])});
  browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(plants => localStorage.setItem("garden-os-plant-vault-a0a0a0a0-0000-4000-8000-000000000001",JSON.stringify(plants)),plants);
  const page = await context.newPage();
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:3000");
  await page.getByLabel("Email",{exact:true}).fill("garden@example.test");
  await page.getByLabel("Password",{exact:true}).fill("fixture-password");
  await page.getByRole("button",{name:"Open my garden",exact:true}).click();
  await page.locator(".modern-dashboard").waitFor();
  await page.getByRole("button",{name:"Plant Vault",exact:true}).first().click();
  assert.equal(await page.locator(".vault-plant-card .companion-guide").count(),0);
  await page.getByRole("button",{name:"Open Tomato",exact:true}).click();
  await page.getByRole("heading",{name:"Companion planting",exact:true}).waitFor();
  assert.ok(await page.getByText("Good companions",{exact:true}).isVisible());
  assert.ok(await page.getByText("Keep apart / use care",{exact:true}).isVisible());
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:1000});
    await page.locator(".companion-guide").scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
    const axe = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
    assert.deepEqual(axe.violations,[],JSON.stringify(axe.violations));
    await page.screenshot({path:`/tmp/companion-${width}.png`});
  }
  await page.getByRole("button",{name:"Close dialog",exact:true}).click();
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole("button",{name:"My Gardens",exact:true}).first().click();
  await page.locator(".garden-collection-card").first().click();
  await page.getByRole("button",{name:"Companion bed",exact:true}).click();
  await page.getByText("Use care: Tomato + Potato",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Edit Potato",exact:true}).click();
  await page.getByLabel("Status",{exact:true}).selectOption("Finished");
  await page.getByRole("button",{name:"Save Plant",exact:true}).click();
  await page.getByText("Plant saved.",{exact:true}).waitFor();
  assert.equal(await page.getByText("Use care: Tomato + Potato",{exact:true}).count(),0);
  let state = await (await fetch("http://127.0.0.1:54321/control/state")).json();
  assert.equal(JSON.parse(state.spaces.find(s=>s.id===bed.id).notes).plants.find(p=>p.name==="Potato").status,"Finished");
  await page.getByRole("button",{name:"+ Add Plant",exact:true}).click();
  await page.getByLabel("Choose a plant",{exact:true}).selectOption("vault:crop-2");
  await page.getByText("Useful pairing: Tomato + Basil",{exact:true}).waitFor();
  await page.getByLabel("Choose a plant",{exact:true}).selectOption("");
  await page.getByLabel("Plant name",{exact:true}).fill("Potato");
  await page.getByText("Use care: Tomato + Potato",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Save Plant",exact:true}).click();
  await page.getByText("Plant saved.",{exact:true}).waitFor();
  state = await (await fetch("http://127.0.0.1:54321/control/state")).json();
  assert.equal(JSON.parse(state.spaces.find(s=>s.id===bed.id).notes).plants.filter(p=>p.name==="Potato").length,2);
  await page.getByRole("button",{name:"Close dialog",exact:true}).click();
  await page.getByRole("button",{name:"Plant planner",exact:true}).click();
  await page.getByLabel("Growing space",{exact:true}).selectOption(bed.id);
  await page.getByLabel("Crop",{exact:true}).selectOption("Tomato");
  await page.getByText("Use care: Tomato + Potato",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Add a plant to Companion bed",exact:true}).click();
  assert.equal(await page.getByLabel("Plant name",{exact:true}).inputValue(),"Tomato");
  await page.getByRole("button",{name:"Close dialog",exact:true}).click();
  await page.reload();
  await page.getByRole("button",{name:"Companion bed",exact:true}).click();
  await page.getByText("Use care: Tomato + Potato",{exact:true}).waitFor();
  // Guest uses the same guide without an account or cloud write.
  const guest = await browser.newContext({viewport:{width:390,height:900}});
  await guest.addInitScript(bed => {
    localStorage.setItem("garden-os-guest-active","1");
    localStorage.setItem("garden-os-guest-warning-seen","1");
    localStorage.setItem("garden-os-guest-data",JSON.stringify({gardens:[{id:"garden-1",name:"Guest garden",year:2026,location:null,hardiness_zone:null}],spaces:[bed]}));
  },bed);
  const gp = await guest.newPage();
  await gp.goto("http://127.0.0.1:3000/?view=my-gardens&garden=garden-1");
  await gp.getByRole("button",{name:"Companion bed",exact:true}).click();
  await gp.getByText("Use care: Tomato + Potato",{exact:true}).waitFor();
  assert.equal(await gp.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log("PASS: Vault guide, mobile/desktop accessibility, live bed preview, finished exclusions, advisory save, API persistence, planner crop handoff, reload, and guest access.");
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

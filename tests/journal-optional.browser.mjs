// Isolated browser QA. No real accounts, mail, or production data.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
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
  const nav = page.getByRole("navigation");
  await nav.getByRole("button",{name:"Garden Journal",exact:true}).click();
  await page.getByRole("button",{name:"Add observation",exact:true}).click();
  assert.equal(await page.getByLabel("Growing space (optional)").inputValue(), "");
  await page.getByLabel("Observation",{exact:true}).fill("Butterflies visited today.");
  await page.getByRole("button",{name:"Save observation",exact:true}).click();
  await page.getByText("Butterflies visited today.",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Write in your journal →",exact:true}).click();
  await page.getByLabel("Entry title",{exact:true}).fill("A garden before the beds");
  await page.locator("textarea[name=text]").fill("Dreaming about spring flowers.");
  await page.getByRole("button",{name:"Save journal entry",exact:true}).click();
  await page.getByRole("button",{name:"Edit entry",exact:true}).click();
  await page.locator("textarea[name=text]").fill("Dreaming about spring flowers and vegetables.");
  await page.getByRole("button",{name:"Save journal entry",exact:true}).click();
  await page.getByText("Dreaming about spring flowers and vegetables.",{exact:true}).waitFor();
  const userKey="garden-os-journal-a0a0a0a0-0000-4000-8000-000000000001";
  let cloud;
  for(let i=0;i<50;i++){
    cloud=await (await fetch("http://127.0.0.1:54321/control/state")).json();
    if(cloud.syncedState.some(r=>r.key===userKey&&r.value.some(e=>e.text==="Dreaming about spring flowers and vegetables."))) break;
    await new Promise(r=>setTimeout(r,100));
  }
  assert.equal(cloud.syncedState.find(r=>r.key===userKey).value.length,2);
  assert.equal(cloud.spaces.length,0,"No fake growing spaces created");
  await page.reload();
  await page.getByRole("button",{name:"A garden before the beds",exact:true}).waitFor();
  const oldEntry={id:"legacy-entry",kind:"Note",date:"2026-10-24",text:"Existing bed observation."};
  await fetch("http://127.0.0.1:54321/rest/v1/growing_spaces",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:"bed-1",garden_id:"garden-1",name:"Flower bed",type:"Raised Bed",length:4,width:4,notes:JSON.stringify({garden_os:1,notes:"Original bed notes",plants:[],entries:[oldEntry]})})});
  await page.reload();
  await page.getByRole("tab",{name:"Observations",exact:true}).click();
  await page.getByText("Existing bed observation.",{exact:true}).waitFor();
  await page.getByText("Butterflies visited today.",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Add observation",exact:true}).click();
  await page.getByLabel("Growing space (optional)").selectOption("bed-1");
  await page.getByLabel("Observation",{exact:true}).fill("Flowers opening in this bed.");
  await page.getByRole("button",{name:"Save observation",exact:true}).click();
  await page.getByText("Flowers opening in this bed.",{exact:true}).waitFor();
  await page.getByText("Existing bed observation.",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Add observation",exact:true}).click();
  await page.getByLabel("Observation",{exact:true}).fill("Unlinked even with a bed.");
  await page.getByRole("button",{name:"Save observation",exact:true}).click();
  await page.getByText("Unlinked even with a bed.",{exact:true}).waitFor();
  console.log("PASS: account observations and edited journal entries without spaces, verified cloud persistence; existing bed entries preserved, linked and unlinked new writing with a bed.");
  await browser.close();
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote"] });
  const gc=await browser.newContext({viewport:{width:390,height:844}}), gp=await gc.newPage();
  await gp.goto("http://127.0.0.1:3043");
  await gp.getByRole("button",{name:"Continue as guest",exact:true}).click();
  await gp.getByRole("button",{name:"Continue as guest",exact:true}).click();
  await gp.getByRole("navigation").getByRole("button",{name:"Garden Journal",exact:true}).click();
  await gp.getByRole("button",{name:"Add observation",exact:true}).click();
  await gp.getByLabel("Observation",{exact:true}).fill("My first guest observation.");
  await gp.getByRole("button",{name:"Save observation",exact:true}).click();
  await gp.getByText("My first guest observation.",{exact:true}).waitFor();
  await gp.reload();
  await gp.getByText("My first guest observation.",{exact:true}).waitFor();
  await gp.getByRole("button",{name:"Write in your journal →",exact:true}).click();
  await gp.getByLabel("Entry title",{exact:true}).fill("Plans for my first garden");
  await gp.locator("textarea[name=text]").fill("Starting small, with room to grow.");
  const axe=await new AxeBuilder({page:gp}).include("dialog").withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  assert.deepEqual(axe.violations.map(v=>v.id),[]);
  await gp.screenshot({path:"/workspace/scratch/journal-optional-mobile.png"});
  await gp.getByRole("button",{name:"Save journal entry",exact:true}).click();
  await gp.reload();
  await gp.getByRole("button",{name:"Plans for my first garden",exact:true}).waitFor();
  await gp.setViewportSize({width:320,height:700});
  assert.equal(await gp.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  console.log("PASS: guest observation and journal reload persistence without growing spaces, accessible mobile form, width320, no runtime errors.");
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

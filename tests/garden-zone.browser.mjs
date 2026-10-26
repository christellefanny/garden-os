// Isolated browser QA. No real accounts, mail, or production data.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

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
  const nav=page.getByRole("navigation");
  let lookups=0;
  await page.route("**/api/garden-zone",async route=>{
    lookups++;const {location}=route.request().postDataJSON();
    if(location==="bad, location")return route.fulfill({status:502,contentType:"application/json",body:JSON.stringify({error:"No verified zone found. Enter your zone yourself."})});
    await route.fulfill({contentType:"application/json",body:JSON.stringify({zone:location==="90210"?"10b":"6a",zip:location==="90210"?"90210":"60544",place:location})});
  });
  await nav.getByRole("button",{name:"My Gardens",exact:true}).click();
  await page.getByRole("button",{name:/^2026 Front Yard Garden/}).click();
  await page.getByRole("button",{name:"Edit garden",exact:true}).click();
  assert.equal(await page.getByLabel("Hardiness Zone",{exact:true}).inputValue(),"5b");
  assert.equal(lookups,0,"Existing saved zones are preserved on edit");
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  await page.getByRole("button",{name:"← All gardens",exact:true}).click();
  await page.getByRole("button",{name:"+ New Garden",exact:true}).click();
  await page.getByLabel("Garden Name",{exact:true}).fill("Zone lookup garden");
  await page.getByLabel("Location",{exact:true}).fill("60544");
  await page.waitForFunction(()=>document.querySelector('input[name=zone]')?.value==="6a");
  await page.getByRole("button",{name:"Save Garden",exact:true}).click();
  await page.getByRole("button",{name:"Edit garden",exact:true}).click();
  assert.equal(await page.getByLabel("Hardiness Zone",{exact:true}).inputValue(),"6a");
  await page.getByLabel("Location",{exact:true}).fill("Plainfield, IL");
  await page.waitForFunction(()=>document.querySelector('input[name=zone]')?.value==="6a");
  await page.getByLabel("Location",{exact:true}).fill("90210");
  await page.waitForFunction(()=>document.querySelector('input[name=zone]')?.value==="10b");
  await page.getByLabel("Location",{exact:true}).fill("bad, location");
  await page.getByText("No verified zone found. Enter your zone yourself.",{exact:true}).waitFor();
  assert.equal(await page.getByLabel("Hardiness Zone",{exact:true}).inputValue(),"");
  await page.getByLabel("Hardiness Zone",{exact:true}).fill("7b");
  await page.getByRole("button",{name:"Save Garden",exact:true}).click();
  await page.reload();
  await page.getByRole("button",{name:"Edit garden",exact:true}).click();
  assert.equal(await page.getByLabel("Hardiness Zone",{exact:true}).inputValue(),"7b");
  await page.getByRole("button",{name:"Cancel",exact:true}).click();
  console.log("PASS: account auto-fill, ZIP and city/state, changed location, lookup failure/manual fallback, saved manual override and preserved existing zone.");
  await browser.close();
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--single-process","--no-zygote"]});
  const gc=await browser.newContext({viewport:{width:390,height:844}}), gp=await gc.newPage();
  await gp.goto("http://127.0.0.1:3043");
  await gp.getByRole("button",{name:"Continue as guest",exact:true}).click();await gp.getByRole("button",{name:"Continue as guest",exact:true}).click();
  await gp.getByRole("button",{name:/^Create your first garden/}).click();
  let lateDone;
  const late=new Promise(resolve=>{lateDone=resolve;});
  await gp.route("**/api/garden-zone",async route=>{
    const location=route.request().postDataJSON().location;
    if(location==="90210"){await new Promise(r=>setTimeout(r,350));await route.fulfill({contentType:"application/json",body:JSON.stringify({zone:"10b",zip:"90210"})}).catch(()=>{});lateDone();}
    else await route.fulfill({contentType:"application/json",body:JSON.stringify({zone:"6a",zip:"60544"})});
  });
  await gp.getByLabel("Garden Name",{exact:true}).fill("My vegetable garden");
  await gp.getByLabel("Location",{exact:true}).fill("60544");
  await gp.waitForFunction(()=>document.querySelector('input[name=zone]')?.value==="6a");
  await gp.screenshot({path:"/workspace/scratch/garden-zone-mobile.png"});
  const requested=gp.waitForRequest(r=>r.url().endsWith("/api/garden-zone")&&r.postDataJSON().location==="90210");
  await gp.getByLabel("Location",{exact:true}).fill("90210");await requested;
  await gp.getByLabel("Hardiness Zone",{exact:true}).fill("7a");await late;
  assert.equal(await gp.getByLabel("Hardiness Zone",{exact:true}).inputValue(),"7a","Late results cannot overwrite a manual zone");
  await gp.getByLabel("Location",{exact:true}).fill("60544");
  await gp.waitForFunction(()=>document.querySelector('input[name=zone]')?.value==="6a");
  await gp.getByRole("button",{name:"Save Garden",exact:true}).click();await gp.reload();
  await gp.getByRole("button",{name:"Edit garden",exact:true}).click();
  assert.equal(await gp.getByLabel("Hardiness Zone",{exact:true}).inputValue(),"6a");
  assert.deepEqual(errors,[]);
  console.log("PASS: guest ZIP autofill and reload persistence, manual correction wins over a pending response, 390px form; no runtime errors.");

} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

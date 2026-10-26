// Isolated browser QA. No real accounts, mail, or production data.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";

const fixture = spawn(process.execPath, ["tests/fixtures/supabase.mjs"], { stdio: "ignore" });
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3043"], { stdio: "ignore", env:{...process.env,SUPABASE_SERVICE_ROLE_KEY:"fixture-admin-only"} });
let browser, page;
try {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch("http://127.0.0.1:3043", { signal: AbortSignal.timeout(1500) })).ok) break; } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote"] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  page = await context.newPage();
  const errors = [];
  page.on("response",async response=>{if(response.url().includes("/api/photos")&&!response.ok())console.log("Photo API error",response.status(),await response.text());});
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("http://127.0.0.1:3043");
  await page.getByLabel("Email", { exact: true }).fill("garden@example.test");
  await page.getByLabel("Password", { exact: true }).fill("fixture-password");
  await page.getByRole("button", { name: "Open my garden", exact: true }).click();
  const nav=page.getByRole("navigation");
  const jpeg=await (await import("node:fs/promises")).readFile("public/email/dahlia.jpg");
  const visit=async id=>{await page.goto(`http://127.0.0.1:3043/?view=my-gardens&garden=${id}`);await page.getByRole("button",{name:"Pictures",exact:true}).click();};
  const upload=async(name,date)=>{
    await page.getByRole("button",{name:"Add pictures",exact:true}).first().click();
    const dialog=page.getByRole("dialog",{name:"Add pictures",exact:true});
    await dialog.getByLabel("Photos (select multiple)",{exact:true}).setInputFiles({name:name+".jpg",mimeType:"image/jpeg",buffer:jpeg});
    await dialog.getByLabel("Date",{exact:true}).fill(date);
    await dialog.locator("textarea").fill("A dated photo of this garden's progress.");
    await dialog.getByRole("button",{name:/^Save .*pictures$/}).click();
    await page.getByRole("button",{name:`View ${name}`,exact:true}).waitFor();
  };
  await visit("garden-1");
  let interrupt=true;
  await page.route("**/api/photos",async route=>{if(interrupt&&route.request().method()==="POST"){interrupt=false;await route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"Fixture offline. Device copy retained."})});}else await route.continue();});
  await upload("Early growth","2026-05-15");
  await page.getByRole("button",{name:"Back up existing pictures",exact:true}).click();
  await page.getByRole("status").filter({hasText:"Your pictures are backed up."}).waitFor();
  await upload("Harvest time","2026-08-20");
  await page.getByLabel(/^Year/).selectOption("2026");
  assert.equal(await page.getByRole("button",{name:/^View (Early growth|Harvest time)$/}).count(),2);
  await page.reload();
  await page.getByRole("button",{name:"Pictures",exact:true}).click();
  await page.getByRole("button",{name:"View Early growth",exact:true}).waitFor();
  await page.getByRole("button",{name:"View Harvest time",exact:true}).waitFor();
  const createGarden=async(id,name,year)=>{const r=await fetch("http://127.0.0.1:54321/rest/v1/gardens",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,name,year,location:"Plainfield, IL",hardiness_zone:"5b"})});assert.ok(r.ok);};
  await createGarden("garden-next","Vegetable Garden",2027);
  await visit("garden-next");
  assert.equal(await page.getByRole("button",{name:"View Early growth",exact:true}).count(),0);
  await upload("New vegetable beds","2027-05-15");
  await page.getByRole("button",{name:"+ New folder",exact:true}).click();
  await page.getByLabel("Folder name",{exact:true}).fill("First seedlings");
  await page.getByRole("button",{name:"Create folder",exact:true}).click();
  await page.getByRole("button",{name:"Add pictures to First seedlings",exact:true}).waitFor();
  await visit("garden-1");
  assert.equal(await page.getByRole("button",{name:"View New vegetable beds",exact:true}).count(),0);
  assert.equal(await page.getByRole("button",{name:"Add pictures to First seedlings",exact:true}).count(),0);
  await page.getByRole("button",{name:"View Early growth",exact:true}).waitFor();
  await page.getByRole("button",{name:"View Early growth",exact:true}).click();
  await page.getByRole("dialog",{name:"Early growth",exact:true}).getByRole("img").waitFor();
  await page.getByRole("dialog",{name:"Early growth",exact:true}).getByRole("button",{name:"Close dialog",exact:true}).click();
  await page.getByRole("button",{name:"Edit name and description for Early growth",exact:true}).click();
  await page.getByLabel("Photo name",{exact:true}).fill("Spring seedlings");
  await page.getByRole("button",{name:"Save details",exact:true}).click();
  await page.getByRole("button",{name:"View Spring seedlings",exact:true}).waitFor();
  const axe=await new AxeBuilder({page}).include("dialog").withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),[]);
  await page.screenshot({path:"/workspace/scratch/garden-pictures-desktop.png"});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:"/workspace/scratch/garden-pictures-mobile.png"});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByRole("dialog").getByRole("button",{name:"Close dialog",exact:true}).click();
  await nav.getByRole("button",{name:"Garden Journal",exact:true}).click();
  await page.getByRole("tab",{name:"Photos",exact:true}).click();
  await page.getByRole("button",{name:"Show all pictures",exact:true}).click();
  await page.getByRole("button",{name:"View Spring seedlings",exact:true}).waitFor();
  await page.getByRole("button",{name:"View New vegetable beds",exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  await browser.close();
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process", "--no-zygote"] });
  const freshContext=await browser.newContext({viewport:{width:1200,height:950}}), fresh=await freshContext.newPage();
  await fresh.goto("http://127.0.0.1:3043/?view=my-gardens&garden=garden-1");
  await fresh.getByLabel("Email",{exact:true}).fill("garden@example.test");
  await fresh.getByLabel("Password",{exact:true}).fill("fixture-password");
  await fresh.getByRole("button",{name:"Open my garden",exact:true}).click();
  await fresh.getByRole("button",{name:"Pictures",exact:true}).click();
  await fresh.getByRole("button",{name:"View Spring seedlings",exact:true}).waitFor();
  await fresh.getByRole("button",{name:"View Harvest time",exact:true}).waitFor();
  assert.equal(await fresh.getByRole("button",{name:"View New vegetable beds",exact:true}).count(),0);
  const unauthorized=await fetch("http://127.0.0.1:3043/api/photos");assert.equal(unauthorized.status,401);
  assert.deepEqual(errors,[]);
  console.log("PASS: a clean second browser downloads private cloud pictures, dates, edited names and garden associations; unauthorized API access rejected.");
  await browser.close();
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--single-process","--no-zygote"]});
  const guestContext=await browser.newContext({viewport:{width:390,height:844}});
  await guestContext.addInitScript(()=>{
    localStorage.setItem("garden-os-guest-active","true");localStorage.setItem("garden-os-guest-warning-seen","true");
    localStorage.setItem("garden-os-guest-data",JSON.stringify({gardens:[{id:"guest-garden",name:"Guest vegetable garden",year:2026,location:null,hardiness_zone:null}],spaces:[]}));
  });
  const guestPage=await guestContext.newPage();
  await guestPage.goto("http://127.0.0.1:3043/?view=my-gardens&garden=guest-garden");
  await guestPage.getByRole("button",{name:"Pictures",exact:true}).click();
  await guestPage.getByRole("button",{name:"Add pictures",exact:true}).first().click();
  const guestUpload=guestPage.getByRole("dialog",{name:"Add pictures",exact:true});
  await guestUpload.getByLabel("Photos (select multiple)",{exact:true}).setInputFiles({name:"Guest seedlings.jpg",mimeType:"image/jpeg",buffer:jpeg});
  await guestUpload.getByRole("button",{name:/^Save .*pictures$/}).click();
  await guestPage.getByRole("button",{name:"View Guest seedlings",exact:true}).waitFor();
  await guestPage.getByRole("dialog").getByRole("button",{name:"Close dialog",exact:true}).click();
  await guestPage.getByRole("button",{name:"Save to an account",exact:true}).click();
  await guestPage.getByRole("button",{name:"Already growing with us? Sign in",exact:true}).click();
  await guestPage.getByLabel("Email",{exact:true}).fill("garden@example.test");await guestPage.getByLabel("Password",{exact:true}).fill("fixture-password");
  await guestPage.getByRole("button",{name:"Open my garden",exact:true}).click();
  await guestPage.getByRole("button",{name:"Pictures",exact:true}).click();
  await guestPage.getByRole("button",{name:"View Guest seedlings",exact:true}).waitFor();
  await guestPage.getByRole("button",{name:"Back up existing pictures",exact:true}).click();
  await guestPage.getByRole("status").filter({hasText:"Your pictures are backed up."}).waitFor();
  const guestCopies=await guestPage.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open("garden-os-photo-journal-v1",2);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});const values=await new Promise((resolve,reject)=>{const r=db.transaction("entries","readonly").objectStore("entries").getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});db.close();return values.map(e=>({id:e.id,cloudVersion:e.cloudVersion}));});
  assert.equal(guestCopies.filter(e=>e.id.startsWith("guest:")).length,1);assert.equal(guestCopies.filter(e=>!e.id.startsWith("guest:")&&e.cloudVersion).length,1);
  console.log("PASS: interrupted backup retains original and retries successfully; guest pictures copy to an account, back up successfully and retain the guest original.");

  console.log("PASS: per-garden albums, multiple dated uploads, year filtering, reload persistence, future garden album, isolated folders/photos, full-size viewing, editing details, general photo journal access, mobile and dialog accessibility; no runtime errors.");

} catch(error) {
  console.log("Failed page:",await page?.locator("body").innerText());
  throw error;
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

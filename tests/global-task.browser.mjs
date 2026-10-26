// Isolated browser QA. No real accounts, mail, or production data.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
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
  await page.getByRole("navigation").getByRole("button", { name: "Flower Garden", exact: true }).click();
  const quick = page.locator(".floating-add-task");
  await quick.click();
  await page.getByLabel("Task", {exact:true}).fill("Check the cut flowers");
  await page.getByLabel("Notes (optional)").fill("Look for fresh buds.");
  await page.getByRole("button",{name:"Save task",exact:true}).click();
  await page.getByRole("status").filter({hasText:"Task saved."}).waitFor();
  assert.match(page.url(), /flower-garden/);
  await page.getByRole("navigation").getByRole("button",{name:"Tasks",exact:true}).click();
  await page.getByText("Check the cut flowers",{exact:true}).waitFor();
  await page.reload();
  await page.getByText("Check the cut flowers",{exact:true}).waitFor();
  await page.getByRole("navigation").getByRole("button",{name:"Growing Calendar",exact:true}).click();
  await quick.click();
  await page.getByLabel("Task",{exact:true}).fill("Water the seedlings");
  await page.getByRole("button",{name:"Save task",exact:true}).click();
  await page.getByText("Water the seedlings",{exact:false}).first().waitFor({state:"attached"});
  for (const name of ["Home","My Gardens","Plant Vault","Flower Garden","Plan & Design","Tasks","Garden Journal","Settings","Help"]) {
    await page.getByRole("navigation").getByRole("button",{name,exact:true}).click();
    await quick.waitFor({state:"visible"});
  }
  const guest = await browser.newContext({viewport:{width:390,height:844}});
  const gp = await guest.newPage();
  await gp.goto("http://127.0.0.1:3043");
  await gp.getByRole("button",{name:"Continue as guest",exact:true}).click();
  await gp.getByRole("button",{name:"Continue as guest",exact:true}).click();
  await gp.getByRole("navigation").getByRole("button",{name:"Flower Garden",exact:true}).click();
  await gp.locator(".floating-add-task").click();
  await gp.getByLabel("Task",{exact:true}).fill("Save marigold seeds");
  await gp.getByRole("button",{name:"Save task",exact:true}).click();
  await gp.getByRole("navigation").getByRole("button",{name:"Tasks",exact:true}).click();
  await gp.getByText("Save marigold seeds",{exact:true}).waitFor();
  await gp.reload();
  await gp.getByText("Save marigold seeds",{exact:true}).waitFor();
  await gp.locator(".floating-add-task").click();
  await gp.keyboard.press("Escape");
  assert.equal(await gp.getByRole("dialog").count(),0);
  assert.equal(await gp.locator(".floating-add-task").evaluate(el=>el===document.activeElement),true);
  await gp.setViewportSize({width:320,height:700});
  assert.equal(await gp.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await gp.setViewportSize({width:390,height:844});
  await gp.getByRole("navigation").getByRole("button",{name:"Flower Garden",exact:true}).click();
  await gp.locator(".floating-add-task").scrollIntoViewIfNeeded();
  await gp.screenshot({path:"/workspace/scratch/global-task-mobile.png"});
  await gp.locator(".floating-add-task").click();
  const axe = await new AxeBuilder({page:gp}).include("dialog").withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  assert.deepEqual(axe.violations.map(v=>v.id),[]);
  await gp.screenshot({path:"/workspace/scratch/global-task-dialog.png"});
  assert.deepEqual(errors,[]);
  console.log("PASS: signed-in and guest capture, all navigation destinations, live calendar update, reload persistence, mobile320/390, Escape/focus restoration, accessible dialog.");
} finally {
  await browser?.close();
  server.kill();
  fixture.kill();
}

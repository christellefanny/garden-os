// Isolated local QA only: no real accounts or cloud writes.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const port=3051, origin=`http://127.0.0.1:${port}`;
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'garden-os-local-preview'},stdio:['ignore','pipe','pipe']});
let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
try {
 let ready=false;for(let i=0;i<160;i++){try{if((await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready,log);
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET'&&/rest\/v1|api\/state/.test(r.url()))writes.push(r.url());});
 await page.goto(origin);await page.getByRole('button',{name:'Continue as guest',exact:true}).click();await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
 const nav=page.getByRole('navigation',{name:'Garden Atelier navigation'});
 await nav.getByRole('button',{name:'The Flower Library',exact:true}).click();
 await page.getByRole('searchbox',{name:'Find a flower'}).fill('dahlia');
 assert.equal(await page.locator('.learning-flower').count(),1);
 await page.getByRole('button',{name:/Read .* planting and care guide/}).click();
 const dialog=page.getByRole('dialog');await dialog.waitFor();await dialog.getByRole('heading',{name:'Dahlias',exact:true}).waitFor();
 assert.ok(await dialog.getByRole('link',{name:/NC State/}).isVisible());
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 assert.ok(await page.getByRole('button',{name:/Read .* planting and care guide/}).evaluate(el=>el===document.activeElement));
 await nav.getByRole('button',{name:'Beginner’s Guide',exact:true}).click();
 // Help me start must reveal the first question on initial and repeated use.
 for(const reducedMotion of ['no-preference','reduce']){
  await page.emulateMedia({reducedMotion});
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:844});
   for(let attempt=0;attempt<2;attempt++){
    await page.getByRole('button',{name:/Step 6 Build a watering/}).scrollIntoViewIfNeeded();
    await page.getByRole('button',{name:'Help me start',exact:true}).click();
    const first=page.getByRole('combobox',{name:'Where will you grow?',exact:true});
    await first.waitFor();
    await page.waitForFunction(()=>{const e=document.querySelector('.learning-first-question');const r=e?.getBoundingClientRect();return r&&r.top>=0&&r.bottom<=innerHeight;});
    assert.ok(await first.evaluate(e=>e===document.activeElement));
    assert.equal(await page.locator('#learning-start').count(),1);
   }
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('button',{name:/Step 1 Choose a space/}).click();await dialog.waitFor();
 await dialog.getByRole('checkbox',{name:'Record sunlight',exact:true}).check();
 await dialog.getByRole('button',{name:'Next guide →',exact:true}).click();await dialog.getByRole('heading',{name:'Understand zones, frost and planting time',exact:true}).waitFor();
 await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('button',{name:/Step 1 Choose a space/}).click();assert.ok(await dialog.getByRole('checkbox',{name:'Record sunlight',exact:true}).isChecked());
 await page.reload();await page.getByRole('button',{name:/Step 1 Choose a space/}).click();assert.ok(await dialog.getByRole('checkbox',{name:'Record sunlight',exact:true}).isChecked());
 await mkdir('docs/previews/learning',{recursive:true});
 await page.screenshot({path:'docs/previews/learning/beginner-desktop.png'});
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow '+width);
  assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),'dialog overflow '+width);
  const axe=await new AxeBuilder({page}).include('dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
  await page.screenshot({path:`docs/previews/learning/beginner-${width}.png`});
 }
 await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();await nav.getByRole('button',{name:'The Flower Library',exact:true}).click();
 await page.getByRole('searchbox',{name:'Find a flower'}).fill('dahlia');await page.getByRole('button',{name:/Read .* planting and care guide/}).click();await dialog.waitFor();
 await page.screenshot({path:'docs/previews/learning/flower-mobile.png'});
 assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth));
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 console.log('PASS learning dialogs, close/Escape/focus restore, next guide, checklist reload persistence, 390/320px mobile, dialog WCAG AA, zero guest cloud writes.');
} catch(error){console.error(log.slice(-5000));throw error;} finally {await browser?.close();server.kill();fixture.kill();}

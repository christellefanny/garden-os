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
 // Blooms lives inside My Gardens, not the sidebar; exercise return/cancel and narrow layouts.
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:844});
  const labels=await nav.getByRole('button').allTextContents();
  assert.equal(labels[labels.indexOf('My Gardens')+1],'Beginner’s Guide');
  assert.equal(labels[labels.indexOf('Tasks')-1],'Flower Corner');
  assert.ok(!labels.includes('Flower Garden')&&!labels.includes('Blooms'));
  await nav.getByRole('button',{name:'My Gardens',exact:true}).click();
  await page.getByRole('button',{name:'Open Blooms →',exact:true}).click();
  await page.getByRole('heading',{name:'Blooms',exact:true}).waitFor();
  assert.ok(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  await page.getByRole('button',{name:'← Back to My Gardens',exact:true}).click();
  await page.getByRole('button',{name:'+ New Garden',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal(await page.getByRole('dialog').count(),0);
  await page.getByRole('button',{name:'Open Blooms →',exact:true}).click();
  await page.goBack();
  await page.getByRole('heading',{name:'My Gardens',exact:true}).waitFor();
 }
 await page.setViewportSize({width:1440,height:1000});
 await nav.getByRole('button',{name:'Flower Corner',exact:true}).click();
 await page.getByRole('searchbox',{name:'Search the Library'}).fill('dahlia');
 assert.equal(await page.locator('.corner-library-card').count(),1);
 await page.getByRole('button',{name:/Read .* growing guide/}).click();
 const dialog=page.getByRole('dialog');await dialog.waitFor();await dialog.getByRole('heading',{name:'Dahlias',exact:true}).waitFor();
 assert.ok(await dialog.getByRole('link',{name:/NC State/}).isVisible());
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
 assert.ok(await page.getByRole('button',{name:/Read .* growing guide/}).evaluate(el=>el===document.activeElement));
 await nav.getByRole('button',{name:'Beginner’s Guide',exact:true}).click();
 // Help me start must show the full helper title on initial and repeated use.
 for(const reducedMotion of ['no-preference','reduce']){
  await page.emulateMedia({reducedMotion});
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:844});
   for(let attempt=0;attempt<2;attempt++){
    await page.getByRole('button',{name:/Step 6 Build a watering/}).scrollIntoViewIfNeeded();
    await page.getByRole('button',{name:'Help me start',exact:true}).click();
    const first=page.getByRole('combobox',{name:'Where will you grow?',exact:true});
    await first.waitFor();
    await page.waitForFunction(()=>{const e=document.querySelector('#learning-start h2');const r=e?.getBoundingClientRect();return r&&r.top>=0&&r.bottom<=innerHeight;});
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
 await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();await nav.getByRole('button',{name:'Flower Corner',exact:true}).click();
 await page.getByRole('searchbox',{name:'Search the Library'}).fill('dahlia');await page.getByRole('button',{name:/Read .* growing guide/}).click();await dialog.waitFor();
 await page.screenshot({path:'docs/previews/learning/flower-mobile.png'});
 assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth));
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 console.log('PASS learning dialogs, close/Escape/focus restore, next guide, checklist reload persistence, 390/320px mobile, dialog WCAG AA, zero guest cloud writes.');
} catch(error){console.error(log.slice(-5000));throw error;} finally {await browser?.close();server.kill();fixture.kill();}

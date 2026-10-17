// All garden records and weather/location responses in this browser test are isolated fixtures.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1'],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'guest-planting-fixture'},stdio:['ignore','pipe','pipe']});
let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
let browser;
const profile={version:1,zip:'60544',place:'Plainfield, Illinois',zone:'5b',timezone:'America/Chicago',lastSpringFrost:'04-28',firstFallFrost:'10-14',meanHigh:[31,36,48,61,72,81,85,83,76,63,48,36],meanLow:[17,21,31,41,52,62,66,64,55,43,32,22],years:15,frostYears:15,startYear:2011,endYear:2025,forecast:[],resolvedAt:'2026-10-17T12:00:00Z'};
const errors=[];
try {
 for(let n=0;n<120;n++){try{if((await fetch('http://127.0.0.1:3000',{signal:AbortSignal.timeout(2000)})).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 const executable=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || await (await import('/workspace/scratch/74febc05412f/browser-qa/node_modules/@sparticuz/chromium/build/index.js')).default.executablePath();
 browser=await chromium.launch({executablePath:executable,args:['--no-sandbox','--disable-gpu','--single-process','--no-zygote']});
 const context=await browser.newContext({viewport:{width:1536,height:1000}});
 await context.addInitScript(()=>{localStorage.setItem('garden-os-guest-warning-seen','true');Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:(_ok,error)=>error({code:1})}});});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-17T12:00:00Z')});
 let mode='ok';const requests=[];await page.route('**/api/planting-location',async route=>{requests.push(route.request().postDataJSON());await route.fulfill({status:mode==='ok'?200:502,contentType:'application/json',body:JSON.stringify(mode==='ok'?profile:{error:'Lookup unavailable. Please retry.'})});});
 await page.goto('http://127.0.0.1:3000');await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
 const section=page.getByRole('region',{name:'What to Plant Now',exact:true});await section.waitFor();assert.equal(requests.length,0);
 assert.equal(await page.getByRole("button",{name:/Plant Vault|View Vault/}).count(),0);
 assert.equal(await page.getByRole("heading",{name:"Plant Vault",exact:true}).count(),0);
 await page.goto("http://127.0.0.1:3000/?view=plant-vault");await section.waitFor();
 assert.equal(await page.getByRole("heading",{name:"Plant Vault",exact:true}).count(),0);
 assert.equal(await page.getByRole('heading',{name:'In the Garden Now',exact:true}).count(),0);
 await section.getByRole('button',{name:'Explore Garlic',exact:true}).click();await page.getByRole('dialog').getByText('Check local timing',{exact:true}).waitFor();await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await section.getByRole('button',{name:'Find my growing location',exact:true}).click();await page.getByRole('button',{name:'Use my current location',exact:true}).click();await page.getByRole('alert').getByText(/Location permission was declined/).waitFor();
 await page.getByLabel('U.S. ZIP code',{exact:true}).fill('60544');await page.getByRole('button',{name:'Show local planting ideas',exact:true}).click();await section.getByText('Plainfield, Illinois',{exact:true}).waitFor();
 assert.deepEqual(requests,[{zip:'60544'}]);assert.equal(await section.getByText('Grow indoors',{exact:true}).count(),2);
 for(const image of await section.locator('img').all())await image.evaluate(el=>el.decode());
 await mkdir('docs/previews/guest-planting',{recursive:true});await page.screenshot({path:'docs/previews/guest-planting/desktop.png',fullPage:true});
 const before=await section.locator('.guest-plant-row').allTextContents();
 for(const season of ['spring','summer','fall','winter']){
  await page.getByLabel('Change seasonal theme').selectOption(season);assert.deepEqual(await section.locator('.guest-plant-row').allTextContents(),before,'Theme must not change planting dates');
  const axe=await new AxeBuilder({page}).include('.guest-planting-card').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
 }
 await section.getByRole('button',{name:'Explore Garlic',exact:true}).click();await page.getByRole('dialog').getByRole('heading',{name:'Is there still time?',exact:true}).waitFor();await page.getByRole('dialog').screenshot({path:'docs/previews/guest-planting/garlic-detail.png'});await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await section.getByRole('button',{name:'Browse all 13 plant guides',exact:false}).click();
 const guides=page.getByRole('dialog');assert.equal(await guides.locator('.guest-plant-guide').count(),13);
 for(const image of await guides.locator('img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(el=>el.decode());}assert.equal(new Set(await guides.locator('img').evaluateAll(imgs=>imgs.map(el=>el.getAttribute('src')))).size,13);
 await guides.locator('.guest-plant-guide').filter({hasText:'Tomatoes'}).click();await page.getByRole('dialog').getByText(/It is too late in this outdoor growing window/).waitFor();await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 for(const width of [1536,1024,768,390,320]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'page overflow '+width);assert.equal(await page.getByRole('dialog').evaluate(el=>el.scrollWidth>el.clientWidth),false,'dialog overflow '+width);}
 await page.getByRole('button',{name:'Flowers',exact:true}).click();assert.equal(await page.getByRole('dialog').locator('.guest-plant-guide').count(),3);await page.getByRole('dialog').screenshot({path:'docs/previews/guest-planting/flowers-mobile.png'});await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/previews/guest-planting/mobile.png',fullPage:true});
 await page.reload();await section.getByText('Plainfield, Illinois',{exact:true}).waitFor();assert.equal(requests.length,1,'Saved profile reused');
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('garden-os-guest-data')||'{"gardens":[],"spaces":[]}')),{gardens:[],spaces:[]},'Suggestions never create gardens or plants');
 mode='fail';await section.getByRole('button',{name:'Change location',exact:true}).click();await page.getByLabel('U.S. ZIP code',{exact:true}).fill('10001');await page.getByRole('button',{name:'Show local planting ideas',exact:true}).click();await page.getByRole('alert').getByText('Lookup unavailable. Please retry.',{exact:true}).waitFor();await page.getByRole('button',{name:'Close dialog',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('garden-atelier-guest-planting-location-v1')).zip),'60544');
 const example=page.getByRole('region',{name:'Imagine your kitchen garden',exact:true});await example.waitFor();
 await example.locator('img').evaluate(el=>el.decode());
 for(let i=0;i<4;i++){await example.getByRole('button',{name:`Explore example bed ${i+1}:`,exact:false}).click();assert.equal(await example.locator('.guest-example-art button[aria-pressed="true"]').count(),1);}
 const exampleAxe=await new AxeBuilder({page}).include('.guest-garden-example').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(exampleAxe.violations.map(v=>v.id),[]);
 await page.setViewportSize({width:1536,height:1000});await example.screenshot({path:'docs/previews/guest-planting/example-desktop.png'});
 for(const width of [1024,768,390,320]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'example overflow '+width);}
 await page.setViewportSize({width:390,height:844});await example.screenshot({path:'docs/previews/guest-planting/example-mobile.png'});
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(key=>key.startsWith('garden-os-layout-2027-guest-'))),false,'Browsing example does not save a layout');
 await example.getByRole('button',{name:'Design your own garden',exact:false}).click();await page.getByRole('heading',{name:'Garden Layout',exact:true}).waitFor();await page.getByRole('button',{name:'Create a layout',exact:true}).click();await page.getByRole('heading',{name:'Create a blank layout',exact:true}).waitFor();await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('navigation',{name:'Garden Atelier navigation'}).getByRole('button',{name:'Home',exact:true}).click();await example.waitFor();
 // Permission already granted: automatic lookup happens without a new prompt.
 const auto=await browser.newContext();await auto.addInitScript(()=>{localStorage.clear();localStorage.setItem('garden-os-guest-warning-seen','true');navigator.permissions.query=async()=>({state:'granted'});Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:ok=>ok({coords:{latitude:41.63,longitude:-88.2}})}});});
 const autoPage=await auto.newPage();let detected;await autoPage.route('**/api/planting-location',async route=>{detected=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...profile,resolvedAt:new Date().toISOString()})});});
 await autoPage.goto('http://127.0.0.1:3000');await autoPage.getByRole('button',{name:'Continue as guest',exact:true}).click();await autoPage.getByRole('region',{name:'What to Plant Now'}).getByText('Plainfield, Illinois',{exact:true}).waitFor();assert.deepEqual(detected,{latitude:41.63,longitude:-88.2});
 const member=await browser.newPage();await member.addInitScript(()=>localStorage.clear());await member.goto('http://127.0.0.1:3000');await member.getByLabel('Email',{exact:true}).fill('garden@example.test');await member.getByLabel('Password',{exact:true}).fill('fixture-password');await member.getByRole('button',{name:'Open my garden',exact:true}).click();await member.getByRole('heading',{name:'In the Garden Now',exact:true}).waitFor();await member.getByRole('navigation',{name:'Garden Atelier navigation'}).getByRole('button',{name:'Plant Vault',exact:true}).waitFor();assert.equal(await member.getByRole('heading',{name:'What to Plant Now',exact:true}).count(),0);
 const bad=await fetch('http://127.0.0.1:3000/api/planting-location',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({zip:"12345' OR 1=1"})});assert.equal(bad.status,400);
 assert.deepEqual(errors,[]);console.log('PASS: guest-only discovery, 13 distinct decoded illustrations, plant details and timing, denied/granted geolocation, ZIP fallback, local persistence, provider failure recovery, themes independent of planting season, five responsive widths, accessibility, signed-in dashboard unchanged, no fake records, invalid API input rejected.');
} catch(e){console.error(e);console.error(log.slice(-3000));process.exitCode=1;}finally{await browser?.close();server.kill();fixture.kill();}

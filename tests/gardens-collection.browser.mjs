/* Isolated end-to-end QA. These records exist only in the local fixture server. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1'],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'garden-os-local-preview'},stdio:['ignore','pipe','pipe']});
let serverLog='';server.stdout.on('data',d=>serverLog+=d);server.stderr.on('data',d=>serverLog+=d);
let browser;
const errors=[];
try {
 for(let n=0;n<120;n++){try{if((await fetch('http://127.0.0.1:3000',{signal:AbortSignal.timeout(2000)})).ok)break;}catch{} await new Promise(r=>setTimeout(r,250));}
 const request=async(table,body)=>{const r=await fetch('http://127.0.0.1:54321/rest/v1/'+table,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.ok(r.ok);return r.json();};
 for(const [id,name] of [['garden-2','Vegetable Garden'],['garden-3','Flower Garden'],['garden-4','Herb Garden']])await request('gardens',{id,name,year:2027,location:'Plainfield, IL',hardiness_zone:'5b'});
 for(const [i,g] of ['garden-1','garden-2','garden-2','garden-3'].entries())await request('growing_spaces',{id:'space-'+i,garden_id:g,name:'Growing bed '+i,type:'Raised Bed',length_feet:4,width_feet:4,notes:JSON.stringify({garden_os:1,notes:'',plants:[],entries:[]})});
 const args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote'];
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args});
 const context=await browser.newContext({viewport:{width:1536,height:1000}});
 await context.addInitScript(() => {
 const user='a0a0a0a0-0000-4000-8000-000000000001';
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(!localStorage.getItem('garden-os-plant-vault-'+user))localStorage.setItem('garden-os-plant-vault-'+user,JSON.stringify([{id:'qa-basil',name:'Basil',variety:'Genovese',category:'Herb',statuses:['Growing Now'],source:'Local QA fixture',year:'2026',notes:''}]));
 if(!localStorage.getItem('garden-os-calendar-'+user))localStorage.setItem('garden-os-calendar-'+user,JSON.stringify({lastFrost:'05-15',firstFrost:'10-15',plants:{},tasks:{},reminders:[{id:'custom|qa-water',plantId:'qa-basil',title:'Check soil moisture',date:today},{id:'custom|qa-observe',plantId:'qa-basil',title:'Record new growth',date:today}]}));
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000');
 await page.getByLabel('Email',{exact:true}).fill('garden@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Open my garden',exact:true}).click();
 const nav=page.getByRole('navigation',{name:'Garden Atelier navigation'});
 await nav.getByRole('button',{name:'My Gardens',exact:true}).click();
 const collection=page.getByRole('region',{name:'Your gardens'});
 const cards=collection.locator('.garden-collection-card');assert.equal(await cards.count(),4);
 for(const [name,count] of [['Front Yard Garden',1],['Vegetable Garden',2],['Flower Garden',1],['Herb Garden',0]])assert.match(await cards.filter({hasText:name}).innerText(),new RegExp(count+' growing space'));
 const images=cards.locator('img');for(const img of await images.all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());}
 assert.equal(new Set(await images.evaluateAll(imgs=>imgs.map(el=>el.getAttribute('src')))).size,4);
 await mkdir('docs/previews/gardens',{recursive:true});
 for(const season of ['spring','summer','fall','winter']){
   await page.getByLabel('Change seasonal theme').selectOption(season);
   await page.waitForFunction(s=>document.documentElement.dataset.season===s,season);
   const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],season+' accessibility');
 }
 for(const width of [1536,1024,768,390,320]){
   await page.setViewportSize({width,height:1000});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'collection overflow at '+width);
   if([1536,768,390].includes(width))await page.locator('.gardens-page').screenshot({path:`docs/previews/gardens/collection-${width}.png`});
 }
 await page.setViewportSize({width:1536,height:1000});
 await page.getByRole('button',{name:'+ New Garden',exact:true}).click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await cards.filter({hasText:'Vegetable Garden'}).click();assert.match(page.url(),/garden=garden-2/);await page.getByRole('heading',{name:'Vegetable Garden',exact:true}).waitFor();
 assert.equal(await page.locator('.growing-space-card').count(),2);
 await page.locator('.gardens-page').screenshot({path:'docs/previews/gardens/detail-desktop.png'});
 await page.getByRole('button',{name:'Edit garden',exact:true}).click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Plan & Design',exact:true}).last().click();assert.match(page.url(),/view=garden-layout/);
 await nav.getByRole('button',{name:'My Gardens',exact:true}).click();await cards.filter({hasText:'Vegetable Garden'}).click();
 await page.getByRole('button',{name:'Growing calendar',exact:true}).last().click();assert.match(page.url(),/view=calendar/);
 await nav.getByRole('button',{name:'My Gardens',exact:true}).click();await cards.filter({hasText:'Vegetable Garden'}).click();
 await page.reload();await page.getByRole('heading',{name:'Vegetable Garden',exact:true}).waitFor();
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'detail mobile overflow');
 await page.locator('.gardens-page').screenshot({path:'docs/previews/gardens/detail-mobile.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: four illustrated gardens, real counts, create/edit dialogs, garden navigation and refresh, design/calendar shortcuts, five responsive widths, four seasonal accessibility checks, zero runtime errors.');
} catch(e){console.error(e);console.error(serverLog.slice(-2500));process.exitCode=1;} finally {await browser?.close();server.kill('SIGTERM');fixture.kill('SIGTERM');}

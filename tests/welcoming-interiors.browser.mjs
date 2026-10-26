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
 const pages=[['Plant Vault','vault'],['Growing Calendar','calendar'],['Tasks','tasks'],['Garden Journal','journal']];
 await mkdir('docs/previews/interiors',{recursive:true});
 const sources=new Set();
 for(const [name,key] of pages){
   await nav.getByRole('button',{name,exact:true}).click();
   const header=page.locator('.atelier-interior-header');await header.waitFor();
   const image=header.locator('img');await image.evaluate(el=>el.decode());sources.add(await image.getAttribute('src'));
   for(const season of ['spring','summer','fall','winter']){
     await page.getByLabel('Change seasonal theme').selectOption(season);
     const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
     assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],name+' '+season+' accessibility');
   }
   for(const width of [1536,1024,768,390,320]){
     await page.setViewportSize({width,height:1000});
     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name+' overflow at '+width);
     if([1536,390].includes(width))await page.locator('.atelier-welcoming-page').screenshot({path:`docs/previews/interiors/${key}-${width}.png`});
   }
   await page.setViewportSize({width:1536,height:1000});
 }
 assert.equal(sources.size,4);
 await nav.getByRole('button',{name:'Plant Vault',exact:true}).click();
 await page.getByRole('button',{name:'Add plant',exact:true}).click();await page.getByRole('heading',{name:'Add to your collection',exact:true}).waitFor();await page.getByRole('button',{name:'×',exact:true}).click();
 await page.getByRole('button',{name:'Collection tools',exact:true}).click();await page.getByRole('button',{name:'Export Plant Vault',exact:true}).waitFor();await page.keyboard.press('Escape');
 await nav.getByRole('button',{name:'Growing Calendar',exact:true}).click();
 await page.getByRole('button',{name:'Planning settings',exact:true}).click();await page.getByRole('dialog').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('button',{name:'Add reminder',exact:true}).click();await page.getByRole('dialog').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('button',{name:'Monthly Calendar',exact:true}).click();await page.getByRole('button',{name:/gardening steps/}).first().click();
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'mobile month overflow');
 await nav.getByRole('button',{name:'Tasks',exact:true}).click();
 const task=page.getByRole('button',{name:/Complete Check soil moisture for/});await task.click();await page.reload();await page.locator('.tasks-page').waitFor();assert.equal(await task.count(),0);
 await nav.getByRole('button',{name:'Garden Journal',exact:true}).click();
 await page.getByRole('button',{name:'Add observation',exact:true}).click();
 await page.getByRole('dialog').getByLabel('Observation',{exact:true}).fill('A small new leaf in the garden.');await page.getByRole('button',{name:'Save observation',exact:true}).click();
 await page.getByText('A small new leaf in the garden.',{exact:true}).waitFor();
 await page.getByRole('tab',{name:'Journal',exact:true}).click();await page.getByRole('button',{name:'Write an entry',exact:true}).click();await page.getByRole('dialog').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('button',{name:'Add pictures',exact:true}).click();await page.getByRole('tab',{name:'Photos',exact:true}).waitFor();await page.getByRole('dialog').waitFor();await page.getByRole('dialog').getByRole('button',{name:'Close dialog',exact:true}).click();
 assert.deepEqual(errors,[]);
 console.log('PASS: four distinct watercolor headers; all four pages at five widths; all seasonal accessibility checks; vault tools, calendar settings/reminders/month, persisted task completion, observation save, journal and photo dialogs; zero runtime errors.');
} catch(e){console.error(e);console.error(serverLog.slice(-2500));process.exitCode=1;} finally {await browser?.close();server.kill('SIGTERM');fixture.kill('SIGTERM');}

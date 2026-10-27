// Account and guest fixtures only. No real accounts or paid model requests.
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3043'],{stdio:'ignore'});
const launch=()=>chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote']});
const picture='public/layout-inspiration/courtyard-open-entry.webp';
const analysis={summary:'Two beds and a container by a walkway.',notes:['Check the walking space.'],areas:[{name:'Left bed',kind:'Bed',x:10,y:20,w:25,h:55},{name:'Walkway',kind:'Path',x:45,y:5,w:10,h:90},{name:'Patio planter',kind:'Container',x:70,y:20,w:16,h:16}]};
let browser;
try{
 for(let i=0;i<160;i++){try{if((await fetch('http://127.0.0.1:3043')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 browser=await launch();let context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3043');await page.getByLabel('Email',{exact:true}).fill('garden@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Open my garden',exact:true}).click();
 await page.getByRole('navigation').getByRole('button',{name:'Plan & Design',exact:true}).click();
 const key='garden-os-custom-layouts-v1-a0a0a0a0-0000-4000-8000-000000000001-garden-1';
 const original={id:'existing-layout',name:'Keep my existing plan',items:[{id:'old-bed',name:'Original bed',kind:'Bed',x:5,y:5,w:25,h:25,spaceId:'existing-space'}]};
 await page.evaluate(({key,original})=>localStorage.setItem(key,JSON.stringify([original])),{key,original});
 let posted,scanMode='success';
 await page.route('**/api/photo-layout',async route=>{posted=route.request().postDataJSON();if(scanMode==='failure')return route.fulfill({status:502,contentType:'application/json',body:JSON.stringify({error:'Photo service is temporarily unavailable. Mark areas yourself.'})});await route.fulfill({contentType:'application/json',body:JSON.stringify({analysis})});});
 await page.getByRole('button',{name:'Upload a garden photo →',exact:true}).click();
 await page.getByLabel('Choose a garden photo').setInputFiles({name:'wrong.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await page.getByRole('alert').filter({hasText:'Choose a JPG'}).waitFor();
 await page.getByLabel('Choose a garden photo').setInputFiles(picture);await page.getByRole('img',{name:'Your chosen garden photo',exact:true}).waitFor();
 await page.getByRole('radio',{name:'Container garden Pots, planters & grow bags'}).check();await page.getByRole('button',{name:'Find garden areas',exact:true}).click();
 await page.getByRole('heading',{name:'A first draft, ready for your eye.',exact:true}).waitFor();assert.equal(posted.focus,'containers');assert.match(posted.image,/^data:image\/jpeg;base64,/);
 await page.getByLabel('Selected area',{exact:true}).selectOption({label:'3 · Patio planter'});await page.getByLabel('Area name',{exact:true}).fill('My pepper grow bag');await page.getByLabel('Width (%)',{exact:true}).fill('18');
 await page.getByRole('button',{name:'+ Container',exact:true}).click();await page.getByLabel('Area name',{exact:true}).fill('Dahlia pot');
 await page.getByLabel('Layout name',{exact:true}).fill('Patio vegetables & flowers');await page.getByLabel('Garden width (feet, optional)',{exact:true}).fill('14');await page.getByLabel('Notes about this space',{exact:true}).fill('Keep the door clear.');
 assert.equal(await page.getByRole('button',{name:'Create editable layout →',exact:true}).isEnabled(),false);
 const axe=await new AxeBuilder({page}).include('.photo-layout-flow').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 await page.screenshot({path:'/workspace/scratch/photo-layout-review-desktop.png',fullPage:true});
 await page.getByRole('checkbox',{name:'I’ve reviewed the areas and understand the spacing is approximate.'}).check();await page.getByRole('button',{name:'Create editable layout →',exact:true}).click();
 await page.getByRole('heading',{name:'Patio vegetables & flowers',exact:true}).waitFor();const stored=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);assert.deepEqual(stored[0],original);assert.equal(stored.length,2);assert.equal(stored[1].items.length,4);assert.ok(stored[1].items.every(i=>i.spaceId===''));assert.equal(stored[1].source.focus,'containers');assert.equal(stored[1].source.widthFeet,14);assert.match(stored[1].source.image,/^data:image\/jpeg/);assert.equal(stored[1].items.filter(i=>i.kind==='Container').length,2);
 let cloudCopy;for(let i=0;i<80;i++){const state=await fetch('http://127.0.0.1:54321/control/state').then(r=>r.json());cloudCopy=state.syncedState.find(r=>r.key===key);if(cloudCopy?.value?.some(l=>l.name==='Patio vegetables & flowers'))break;await new Promise(r=>setTimeout(r,100));}assert.equal(cloudCopy.value.length,2,'Photo layout is acknowledged by the cloud fixture');
 await page.reload();await page.getByRole('button',{name:'Patio vegetables & flowers',exact:true}).click();await page.getByRole('heading',{name:'Patio vegetables & flowers',exact:true}).waitFor();
 await page.getByText('Photo & garden notes · approximate map',{exact:true}).click();await page.getByRole('img',{name:'Original photo reference for this garden layout',exact:true}).waitFor();
 await page.getByRole('button',{name:'Add container',exact:true}).click();
 await page.getByRole('button',{name:'Inspiration & new layout',exact:true}).click();await page.getByRole('button',{name:'Upload a garden photo →',exact:true}).click();await page.getByLabel('Choose a garden photo').setInputFiles(picture);await page.getByRole('img',{name:'Your chosen garden photo',exact:true}).waitFor();scanMode='failure';await page.getByRole('button',{name:'Find garden areas',exact:true}).click();await page.getByRole('alert').filter({hasText:'Photo service'}).waitFor();await page.getByRole('button',{name:'Mark areas myself',exact:true}).click();await page.getByRole('button',{name:'+ Container',exact:true}).click();
 const synced=await fetch('http://127.0.0.1:54321/control/state').then(r=>r.json());assert.equal(synced.spaces.length,0);assert.equal(synced.gardens.length,1);
 assert.deepEqual(errors,[]);console.log('PASS: account photo review, container focus, corrections, reference/measurements, separate editable layout, existing design preserved, no garden/plant records created, service failure manual fallback, WCAG AA.');
 await browser.close();browser=await launch();context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3043');await page.getByRole('button',{name:'Continue as guest',exact:true}).click();await page.getByRole('button',{name:'Continue as guest',exact:true}).click();await page.getByRole('navigation').getByRole('button',{name:'Plan & Design',exact:true}).click();await page.getByRole('button',{name:'Upload a garden photo →',exact:true}).click();
 await page.getByRole('radio',{name:'Container garden Pots, planters & grow bags'}).check();await page.getByLabel('Choose a garden photo').setInputFiles(picture);await page.getByRole('img',{name:'Your chosen garden photo',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Find garden areas',exact:true}).isEnabled(),false);
 await page.getByRole('button',{name:'Mark areas myself',exact:true}).click();await page.getByRole('button',{name:'+ Container',exact:true}).click();await page.getByLabel('Area name',{exact:true}).fill('Balcony tomato pot');await page.getByLabel('Layout name',{exact:true}).fill('My balcony garden');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'/workspace/scratch/photo-layout-mobile.png',fullPage:true});
 await page.getByRole('checkbox',{name:'I’ve reviewed the areas and understand the spacing is approximate.'}).check();await page.getByRole('button',{name:'Create editable layout →',exact:true}).click();await page.getByRole('heading',{name:'My balcony garden',exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'My balcony garden',exact:true}).click();await page.getByRole('heading',{name:'My balcony garden',exact:true}).waitFor();assert.deepEqual(errors,[]);
 console.log('PASS: guest container-only mapping, 390px mobile, saved layout survives reload, no runtime errors.');
}finally{await browser?.close();server.kill();fixture.kill();}

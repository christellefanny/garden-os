// Isolated local QA only: no real accounts or cloud writes.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { beginnerGuides } from '../lib/garden-learning.ts';
const port=3051, origin=`http://127.0.0.1:${port}`;
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'garden-os-local-preview'},stdio:['ignore','pipe','pipe']});
let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
try {
 let ready=false;for(let i=0;i<160;i++){try{if((await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready,log);
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET'&&/rest\/v1|api\/state/.test(r.url()))writes.push(r.url());});
 // A fresh public reader only enters guest mode when explicitly choosing to design.
 const fresh=await browser.newPage({viewport:{width:390,height:844}});
 fresh.on('pageerror',e=>errors.push(e.message));fresh.on('request',r=>{if(r.method()!=='GET'&&/rest\/v1|api\/state/.test(r.url()))writes.push(r.url());});
 await fresh.goto(`${origin}/beginners-guide/space`);
 await fresh.getByRole('heading',{name:beginnerGuides[0].title,exact:true}).waitFor();
 await fresh.waitForFunction(()=>document.querySelector('input[type="checkbox"]')?.disabled===false);
 assert.equal(await fresh.evaluate(()=>localStorage.getItem('garden-os-guest-active')),null);
 await fresh.getByRole('link',{name:'Open Plan & Design',exact:true}).click();
 await fresh.getByRole('heading',{name:'Garden Layout',exact:true}).waitFor();
 assert.equal(new URL(fresh.url()).searchParams.get('view'),'garden-layout');
 assert.equal(await fresh.evaluate(()=>localStorage.getItem('garden-os-guest-active')),'true');
 await fresh.goBack();await fresh.getByRole('heading',{name:beginnerGuides[0].title,exact:true}).waitFor();await fresh.close();
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
 await page.getByRole('button',{name:/^Filters/}).click();
 await page.getByRole('searchbox',{name:'Search the Library'}).fill('dahlia');
 assert.equal(await page.locator('.corner-library-card').count(),1);
 const namedLink=page.getByRole('link',{name:'Dahlias (opens in a new tab)',exact:true});
 const guideOpened=page.context().waitForEvent('page');await namedLink.click();const guide=await guideOpened;
 await guide.getByRole('heading',{name:'Dahlias',exact:true}).waitFor();
 assert.ok(await guide.getByRole('link',{name:/NC State/}).isVisible());
 const sources=guide.getByRole('button',{name:'About this guide & its sources',exact:true});await sources.click();
 await guide.getByRole('dialog').getByRole('heading',{name:'About this growing guide',exact:true}).waitFor();
 await guide.keyboard.press('Escape');await guide.close();
 assert.equal(await page.getByRole('searchbox',{name:'Search the Library'}).inputValue(),'dahlia');
 const dialog=page.getByRole('dialog');
 await nav.getByRole('button',{name:'Beginner’s Guide',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Open Plan & Design',exact:true}).count(),0);
 await page.getByRole('button',{name:'Start Your Garden',exact:true}).click();
 await page.getByRole('heading',{name:'Garden Layout',exact:true}).waitFor();
 await page.goBack();await page.getByRole('heading',{name:'Beginner’s Guide',exact:true}).waitFor();
 // Help me start must show the full helper title on initial and repeated use.
 for(const reducedMotion of ['no-preference','reduce']){
  await page.emulateMedia({reducedMotion});
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:844});
   for(let attempt=0;attempt<2;attempt++){
    await page.getByRole('link',{name:/Step 6: Build a watering/}).scrollIntoViewIfNeeded();
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
 // Overview cards open independent documents and leave the starting helper in this tab.
 const overviewUrl=page.url();let spaceTab;
 for(const [index,entry] of beginnerGuides.entries()){
  const card=page.getByRole('link',{name:`Step ${index+1}: ${entry.title} (opens in a new tab)`,exact:true});
  assert.equal(await card.getAttribute('target'),'_blank');assert.equal(await card.getAttribute('rel'),'noopener noreferrer');
  const opened=page.context().waitForEvent('page');await card.click();const tab=await opened;
  tab.on('pageerror',e=>errors.push(e.message));
  await tab.getByRole('heading',{name:entry.title,exact:true}).waitFor();
  assert.equal(new URL(tab.url()).pathname,`/beginners-guide/${entry.id}`);assert.equal(page.url(),overviewUrl);
  assert.equal(await page.getByRole('dialog').count(),0);
  await tab.reload();await tab.getByRole('heading',{name:entry.title,exact:true}).waitFor();
  assert.equal(await tab.getByRole('heading',{name:'Design your space',exact:true}).count(),entry.id==='space'?1:0);
  assert.equal(await tab.getByRole('link',{name:'Open Plan & Design',exact:true}).count(),entry.id==='space'?1:0);
  if(entry.id==='space'){
   spaceTab=tab;await tab.getByRole('checkbox',{name:'Record sunlight',exact:true}).check();
   await tab.getByRole('link',{name:'Next guide →',exact:true}).click();await tab.getByRole('heading',{name:beginnerGuides[1].title,exact:true}).waitFor();
   await tab.goBack();await tab.getByRole('heading',{name:entry.title,exact:true}).waitFor();
   assert.ok(await tab.getByRole('checkbox',{name:'Record sunlight',exact:true}).isChecked());
   await tab.getByRole('link',{name:'Open Plan & Design',exact:true}).click();
   await tab.getByRole('heading',{name:'Garden Layout',exact:true}).waitFor();
   assert.equal(new URL(tab.url()).searchParams.get('view'),'garden-layout');
   await tab.goBack();await tab.getByRole('heading',{name:entry.title,exact:true}).waitFor();
  }else{
   if(entry.id==='care'){
    const finalActions=tab.getByRole('navigation',{name:'Guide next steps',exact:true});
    assert.deepEqual(await finalActions.locator('a,button').allTextContents(),['Explore Plants','Return to the first guide','Start Your Garden']);
    const lessonUrl=tab.url();
    await finalActions.getByRole('button',{name:'Explore Plants',exact:true}).click();
    assert.equal(tab.url(),lessonUrl);assert.ok(await tab.locator('#beginner-plant-options').isVisible());assert.equal(await tab.getByRole('dialog').count(),0);
    await tab.getByRole('link',{name:'Explore Flower Corner',exact:true}).click();
    await tab.getByRole('heading',{name:'Flower Corner',exact:true}).waitFor();
    await tab.goBack();await tab.getByRole('heading',{name:entry.title,exact:true}).waitFor();
    await finalActions.getByRole('link',{name:'Start Your Garden',exact:true}).click();
    await tab.getByRole('heading',{name:'Garden Layout',exact:true}).waitFor();
    await tab.goBack();await tab.getByRole('heading',{name:entry.title,exact:true}).waitFor();
    await finalActions.getByRole('link',{name:'Return to the first guide',exact:true}).click();
    await tab.getByRole('heading',{name:beginnerGuides[0].title,exact:true}).waitFor();
   }
   await tab.close();
  }
 }
 await page.getByRole('button',{name:'Show my next steps',exact:true}).click();
 const spaceButton=page.getByRole('button',{name:'Read the space guide',exact:true});
 await spaceButton.click();await dialog.waitFor();assert.equal(page.url(),overviewUrl);
 assert.ok(await dialog.getByRole('heading',{name:'Design your space',exact:true}).isVisible());
 assert.equal(await dialog.getByRole('button',{name:'Open Plan & Design',exact:true}).count(),1);
 assert.ok(await dialog.getByRole('checkbox',{name:'Record sunlight',exact:true}).isChecked());
 // The modal and the separate document share the existing browser-local progress store.
 await dialog.getByRole('checkbox',{name:'Check access to water',exact:true}).check();
 await spaceTab.waitForFunction(()=>Array.from(document.querySelectorAll('label')).find(label=>label.textContent==='Check access to water')?.querySelector('input')?.checked===true);
 await spaceTab.getByRole('checkbox',{name:'Measure the usable space',exact:true}).check();
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('dialog label')).find(label=>label.textContent==='Measure the usable space')?.querySelector('input')?.checked===true);
 await spaceTab.close();
 await dialog.getByRole('button',{name:'Next guide →',exact:true}).click();await dialog.getByRole('heading',{name:'Understand zones, frost and planting time',exact:true}).waitFor();
 assert.equal(await dialog.getByRole('button',{name:'Open Plan & Design',exact:true}).count(),0);
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.ok(await spaceButton.evaluate(el=>el===document.activeElement));
 await spaceButton.click();assert.ok(await dialog.getByRole('checkbox',{name:'Record sunlight',exact:true}).isChecked());
 await page.reload();await page.getByRole('button',{name:'Help me start',exact:true}).click();await page.getByRole('button',{name:'Show my next steps',exact:true}).click();
 await page.getByRole('button',{name:'Read the space guide',exact:true}).click();assert.ok(await dialog.getByRole('checkbox',{name:'Record sunlight',exact:true}).isChecked());
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
 await dialog.getByRole('button',{name:'Open Plan & Design',exact:true}).click();
 await page.getByRole('heading',{name:'Garden Layout',exact:true}).waitFor();
 assert.equal(new URL(page.url()).searchParams.get('view'),'garden-layout');assert.equal(await dialog.count(),0);
 await page.goBack();await page.getByRole('heading',{name:'Beginner’s Guide',exact:true}).waitFor();
 assert.equal(await dialog.count(),0);
 // The helper reaches the same completion choices without opening another dialog or tab.
 await page.getByRole('button',{name:'Help me start',exact:true}).click();
 await page.getByRole('button',{name:'Show my next steps',exact:true}).click();
 await page.getByRole('button',{name:'Read the space guide',exact:true}).click();
 for(const entry of beginnerGuides.slice(1)){
  await dialog.getByRole('button',{name:'Next guide →',exact:true}).click();
  await dialog.getByRole('heading',{name:entry.title,exact:true}).waitFor();
 }
 const finalActions=dialog.getByRole('navigation',{name:'Guide next steps',exact:true});
 assert.deepEqual(await finalActions.getByRole('button').allTextContents(),['Explore Plants','Return to the first guide','Start Your Garden']);
 await finalActions.getByRole('button',{name:'Explore Plants',exact:true}).click();
 assert.equal(await page.getByRole('dialog').count(),1);assert.ok(await dialog.locator('#beginner-plant-options').isVisible());
 assert.equal(new URL(page.url()).searchParams.get('view'),'beginners-guide');
 assert.equal(await dialog.getByRole('link',{name:'Explore Flower Corner',exact:true}).getAttribute('href'),'/flower-corner');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth),'final dialog overflow '+width);
  const boxes=await finalActions.getByRole('button').evaluateAll(elements=>elements.map(el=>({top:el.getBoundingClientRect().top,height:el.getBoundingClientRect().height})));
  assert.ok(boxes.every(box=>box.height>=44));assert.ok(boxes[0].top<boxes[1].top&&boxes[1].top<boxes[2].top);
  const axe=await new AxeBuilder({page}).include('dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
 }
 await finalActions.getByRole('button',{name:'Return to the first guide',exact:true}).click();
 await dialog.getByRole('heading',{name:beginnerGuides[0].title,exact:true}).waitFor();
 for(const entry of beginnerGuides.slice(1)){
  await dialog.getByRole('button',{name:'Next guide →',exact:true}).click();
  await dialog.getByRole('heading',{name:entry.title,exact:true}).waitFor();
 }
 assert.equal(await dialog.locator('#beginner-plant-options').isVisible(),false);
 await finalActions.getByRole('button',{name:'Start Your Garden',exact:true}).click();
 await page.getByRole('heading',{name:'Garden Layout',exact:true}).waitFor();assert.equal(await dialog.count(),0);
 await page.goBack();await page.getByRole('heading',{name:'Beginner’s Guide',exact:true}).waitFor();
 await nav.getByRole('button',{name:'Flower Corner',exact:true}).click();
 const filters=page.getByRole('button',{name:/^Filters/});if(await filters.getAttribute('aria-expanded')!=='true')await filters.click();
 await page.getByRole('searchbox',{name:'Search the Library'}).fill('dahlia');
 const mobileGuideOpened=page.context().waitForEvent('page');await page.getByRole('link',{name:'Dahlias (opens in a new tab)',exact:true}).click();const mobileGuide=await mobileGuideOpened;
 await mobileGuide.setViewportSize({width:320,height:844});await mobileGuide.getByRole('heading',{name:'Dahlias',exact:true}).waitFor();
 await mobileGuide.screenshot({path:'docs/previews/learning/flower-mobile.png'});
 assert.ok(await mobileGuide.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobileGuide.close();
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 console.log('PASS six new-tab guide routes and refresh/back, helper-only dialogs, cross-tab checklist updates, close/Escape/focus restore, next guide, checklist reload persistence, 390/320px mobile, dialog WCAG AA, zero guest cloud writes.');
} catch(error){console.error(log.slice(-5000));throw error;} finally {await browser?.close();server.kill();fixture.kill();}

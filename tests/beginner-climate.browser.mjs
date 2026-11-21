// Isolated browser QA: climate providers are mocked, with no real account or cloud writes.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const port=3057,origin=`http://127.0.0.1:${port}`;
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'});
const modeArgs=process.env.GARDEN_TEST_PRODUCTION?['start']:['dev'];
const server=spawn(process.execPath,['node_modules/next/dist/bin/next',...modeArgs,'--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'garden-os-local-preview'},stdio:['ignore','pipe','pipe']});
let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const profile={version:1,zip:'60544',place:'Plainfield, Illinois',zone:'6a',timezone:'America/Chicago',lastSpringFrost:'04-28',firstFallFrost:'10-14',meanHigh:[31,36,48,61,72,81,85,83,76,63,48,36],meanLow:[17,21,31,41,52,62,66,64,55,43,32,22],years:15,frostYears:15,startYear:2011,endYear:2025,forecast:[],resolvedAt:new Date().toISOString()};
const errors=[],writes=[],requests=[];
let mode='ok';
async function setup(garden){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.method()!=='GET'&&/rest\/v1|api\/state/.test(r.url()))writes.push(r.url());});
  await page.addInitScript(garden=>{
    if(!sessionStorage.getItem('seeded')){
      localStorage.clear();localStorage.setItem('garden-os-guest-active','true');localStorage.setItem('garden-os-guest-warning-seen','true');
      localStorage.setItem('garden-os-guest-data',JSON.stringify({gardens:garden?[garden]:[],spaces:[]}));
      sessionStorage.setItem('seeded','true');
    }
    window.gpsCalls=0;Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:()=>{window.gpsCalls++;throw new Error('Silent GPS requested');}}});
  },garden);
  await page.route('**/api/garden-zone',async route=>{
    requests.push(route.request().postDataJSON());
    if(mode==='bad-location')return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:'Use a U.S. ZIP code or city and state.'})});
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mode==='mild'?{zone:'10b',zip:'33130',place:'Miami, FL'}:{zone:'6a',zip:'60544',place:'Plainfield, IL'})});
  });
  await page.route('**/api/planting-location',async route=>{
    requests.push(route.request().postDataJSON());
    await route.fulfill({status:mode==='history-fail'?502:200,contentType:'application/json',body:JSON.stringify(mode==='history-fail'?{error:'Historical weather is temporarily unavailable.'}:mode==='mild'?{...profile,zip:'33130',place:'Miami, Florida',zone:'10b',lastSpringFrost:null,firstFallFrost:null,frostYears:0,meanHigh:[74,76,78,82,86,89,90,90,89,85,80,76],meanLow:[60,62,64,68,72,76,77,77,76,72,66,62]}:profile)});
  });
  await page.goto(origin+'/?view=beginners-guide');
  await page.getByRole('heading',{name:'Beginner’s Guide',exact:true}).waitFor();
  return page;
}
try{
  let ready=false;for(let i=0;i<160;i++){try{if((await fetch(origin,{signal:AbortSignal.timeout(2000)})).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready,log);
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await setup();
  const panel=page.getByRole('region',{name:'Know your zone and frost dates'});
  await panel.waitFor();assert.equal(requests.length,0);
  const input=panel.getByLabel('City and state or ZIP code (optional)',{exact:true});
  assert.equal(await input.getAttribute('required'),null);
  const button=panel.getByRole('button',{name:'Find my growing window',exact:true});
  await page.setViewportSize({width:390,height:844});
  const compactPanel=(await panel.boundingBox()).height;
  assert.ok(compactPanel <= 300, `No-result climate card stays compact (was ${compactPanel}px)`);
  assert.ok((await input.boundingBox()).height >= 44);
  assert.ok((await button.boundingBox()).height >= 44);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  if(process.env.GARDEN_CLIMATE_COMPACT_SCREENSHOT)await panel.screenshot({
    path:process.env.GARDEN_CLIMATE_COMPACT_SCREENSHOT,
    style:'.floating-add-task { visibility: hidden !important; }',
  });
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Help me start',exact:true}).click();
  await page.getByRole('button',{name:'Show my next steps',exact:true}).click();
  await page.getByRole('heading',{name:'Your starting path',exact:true}).waitFor();
  const summary=panel.getByRole('button',{name:/View growing window/});
  const dialog=page.getByRole('dialog',{name:'Your growing window'});
  const close=dialog.getByRole('button',{name:'Close dialog'});
  const choice=panel.getByRole('button',{name:'Change location'});
  const showDetail=async()=>{ await summary.click(); await dialog.waitFor(); };
  await input.fill('Plainfield, IL');await button.click();
  await dialog.waitFor();
  await dialog.getByText('Apr 28',{exact:true}).waitFor();await dialog.getByText('Oct 14',{exact:true}).waitFor();
  await dialog.getByText('USDA 6a',{exact:true}).waitFor();
  assert.deepEqual(requests.slice(-2),[{location:'Plainfield, IL'},{zip:'60544'}]);
  assert.equal(await page.evaluate(()=>window.gpsCalls),0);
  assert.ok(await dialog.getByText(/80th percentile/).isVisible());
  assert.ok(await close.evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.activeElement?.matches('.beginner-climate-summary-button'));
  assert.equal(await panel.getByText('Apr 28',{exact:true}).count(),0);
  assert.match(await summary.textContent(),/Est. frost-free: Apr 28 to Oct 14/);
  assert.equal(await input.count(),0);
  await showDetail();
  await page.mouse.click(2,2);
  await dialog.waitFor({state:'hidden'});
  await page.waitForFunction(()=>document.activeElement?.matches('.beginner-climate-summary-button'));
  const beforeReload=requests.length;await page.reload();await summary.waitFor();assert.equal(requests.length,beforeReload);
  assert.equal(await dialog.count(),0,'Cache reload never opens details');
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});await panel.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow at '+width);
    const inlineAxe=await new AxeBuilder({page}).include('[aria-labelledby="beginner-climate-heading"]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(inlineAxe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
    if(width===390 && process.env.GARDEN_CLIMATE_SUMMARY_SCREENSHOT)await panel.screenshot({path:process.env.GARDEN_CLIMATE_SUMMARY_SCREENSHOT,style:'.floating-add-task {visibility:hidden!important}'});
    await showDetail();
    assert.ok(await dialog.evaluate(el=>el.scrollHeight>el.clientHeight),'long details scroll inside dialog');
    if(width===390 && process.env.GARDEN_CLIMATE_DIALOG_SCREENSHOT)await page.screenshot({path:process.env.GARDEN_CLIMATE_DIALOG_SCREENSHOT,style:'.floating-add-task {visibility:hidden!important}'});
    const axe=await new AxeBuilder({page}).include('dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
    await close.click();await dialog.waitFor({state:'hidden'});
    await page.getByRole('button',{name:'Help me start',exact:true}).click();
    await page.waitForFunction(()=>{const r=document.querySelector('#learning-start h2')?.getBoundingClientRect();return r&&r.top>=0&&r.bottom<=innerHeight;});
    assert.ok(await page.getByRole('combobox',{name:'Where will you grow?',exact:true}).evaluate(el=>el===document.activeElement));
  }
  await choice.click(); await input.fill('unsaved');
  await panel.getByRole('button',{name:'Cancel location change'}).click();
  assert.equal(await input.count(),0);
  assert.match(await summary.textContent(),/Apr 28 to Oct 14/);
  await page.waitForFunction(()=>document.activeElement?.matches('.beginner-climate-summary-button'));
  mode='mild';await choice.click();await input.waitFor(); await page.waitForFunction(()=>document.activeElement===document.querySelector('.beginner-climate-form input'));await input.fill('33130');await input.press('Enter');
  await dialog.getByText('USDA 10b',{exact:true}).waitFor();assert.equal(await dialog.getByText('No dependable annual date',{exact:true}).count(),2);
  await close.click(); await dialog.waitFor({state:'hidden'}); assert.match(await summary.textContent(),/No dependable annual frost dates/);
  mode='history-fail';await choice.click();await input.fill('60544');await button.click();
  await panel.getByRole('alert').filter({hasText:'Historical weather is temporarily unavailable.'}).waitFor();
  assert.equal(await dialog.count(),0,'Partial failure shows an inline error, not an unsolicited dialog');
  assert.match(await summary.textContent(),/USDA 6a.*Frost dates unavailable/);
  await showDetail();assert.equal(await dialog.getByText('Not available yet',{exact:true}).count(),2);await close.click();
  mode='bad-location';await input.fill('Paris');await button.click();await panel.getByRole('alert').filter({hasText:'Use a U.S. ZIP code'}).waitFor();
  assert.equal(await dialog.count(),0);assert.equal(await summary.count(),0);
  mode='ok';await input.fill('60544');await button.click();await dialog.getByText('Apr 28',{exact:true}).waitFor();
  const savedGarden={id:'garden-1',name:'Saved garden',year:2026,location:'Plainfield, IL',hardiness_zone:'5b'};
  const saved=await setup(savedGarden),savedPanel=saved.getByRole('region',{name:'Know your zone and frost dates'});
  await savedPanel.getByRole('button',{name:/View growing window.*USDA 6a.*Apr 28/}).waitFor();
  assert.equal(await saved.getByRole('dialog').count(),0,'Auto-lookup never opens details');
  await savedPanel.getByRole('button',{name:'Change location'}).click();
  assert.equal(await savedPanel.getByLabel('City and state or ZIP code (optional)',{exact:true}).inputValue(),'Plainfield, IL');
  assert.deepEqual(await saved.evaluate(()=>JSON.parse(localStorage.getItem('garden-os-guest-data')).gardens[0]),savedGarden);
  assert.equal(await saved.evaluate(()=>window.gpsCalls),0);assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  console.log('PASS beginner climate: optional location, saved garden auto-lookup, city/ZIP, two frost dates, source/method labels, scoped cache reload, mild climate, partial/full provider errors and retry, no GPS, no garden/calendar/cloud writes, mobile width and WCAG AA, automatic result dialog, Escape/outside/button close, summary focus and reopening, cancel-edit, scrollable details, no pop-up on cache/auto-lookup.');
}catch(error){console.error(log.slice(-5000));throw error;}finally{await browser?.close();server.kill();fixture.kill();}

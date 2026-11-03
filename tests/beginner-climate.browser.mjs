// Isolated browser QA: climate providers are mocked, with no real account or cloud writes.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const port=3057,origin=`http://127.0.0.1:${port}`;
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'garden-os-local-preview'},stdio:['ignore','pipe','pipe']});
let log='',browser;server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
const profile={version:1,zip:'60544',place:'Plainfield, Illinois',zone:'6a',timezone:'America/Chicago',lastSpringFrost:'04-28',firstFallFrost:'10-14',meanHigh:[31,36,48,61,72,81,85,83,76,63,48,36],meanLow:[17,21,31,41,52,62,66,64,55,43,32,22],years:15,frostYears:15,startYear:2011,endYear:2025,forecast:[],resolvedAt:new Date().toISOString()};
const errors=[],writes=[],requests=[];
let mode='ok';
async function setup(garden){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
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
  await page.getByRole('button',{name:'Help me start',exact:true}).click();
  await page.getByRole('button',{name:'Show my next steps',exact:true}).click();
  await page.getByRole('heading',{name:'Your starting path',exact:true}).waitFor();
  await input.fill('Plainfield, IL');await panel.getByRole('button',{name:'Find my growing window',exact:true}).click();
  await panel.getByText('Apr 28',{exact:true}).waitFor();await panel.getByText('Oct 14',{exact:true}).waitFor();
  await panel.getByText('USDA 6a',{exact:true}).waitFor();
  assert.deepEqual(requests.slice(-2),[{location:'Plainfield, IL'},{zip:'60544'}]);
  assert.equal(await page.evaluate(()=>window.gpsCalls),0);
  assert.ok(await panel.getByText(/80th percentile/).isVisible());
  await page.screenshot({path:'/tmp/beginner-climate-desktop.png',fullPage:true});
  const beforeReload=requests.length;await page.reload();await panel.getByText('Apr 28',{exact:true}).waitFor();assert.equal(requests.length,beforeReload);
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});await panel.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow at '+width);
    const axe=await new AxeBuilder({page}).include('[aria-labelledby="beginner-climate-heading"]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
    await page.getByRole('button',{name:'Help me start',exact:true}).click();
    await page.waitForFunction(()=>{const r=document.querySelector('#learning-start h2')?.getBoundingClientRect();return r&&r.top>=0&&r.bottom<=innerHeight;});
    assert.ok(await page.getByRole('combobox',{name:'Where will you grow?',exact:true}).evaluate(el=>el===document.activeElement));
  }
  await panel.scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/beginner-climate-320.png',fullPage:true});
  mode='mild';await input.fill('33130');await panel.getByRole('button',{name:'Find my growing window',exact:true}).click();
  await panel.getByText('USDA 10b',{exact:true}).waitFor();assert.equal(await panel.getByText('No dependable annual date',{exact:true}).count(),2);assert.equal(await panel.getByText('Apr 28',{exact:true}).count(),0);
  mode='history-fail';await input.fill('60544');await panel.getByRole('button',{name:'Find my growing window',exact:true}).click();
  await panel.getByRole('alert').filter({hasText:'Historical weather is temporarily unavailable.'}).waitFor();
  await panel.getByText('USDA 6a',{exact:true}).waitFor();assert.equal(await panel.getByText('Not available yet',{exact:true}).count(),2);
  mode='bad-location';await input.fill('Paris');await panel.getByRole('button',{name:'Find my growing window',exact:true}).click();await panel.getByRole('alert').filter({hasText:'Use a U.S. ZIP code'}).waitFor();
  assert.equal(await panel.getByText('Apr 28',{exact:true}).count(),0);
  mode='ok';await input.fill('60544');await panel.getByRole('button',{name:'Find my growing window',exact:true}).click();await panel.getByText('Apr 28',{exact:true}).waitFor();
  const savedGarden={id:'garden-1',name:'Saved garden',year:2026,location:'Plainfield, IL',hardiness_zone:'5b'};
  const saved=await setup(savedGarden),savedPanel=saved.getByRole('region',{name:'Know your zone and frost dates'});
  await savedPanel.getByText('Apr 28',{exact:true}).waitFor();
  assert.equal(await savedPanel.getByLabel('City and state or ZIP code (optional)',{exact:true}).inputValue(),'Plainfield, IL');
  assert.deepEqual(await saved.evaluate(()=>JSON.parse(localStorage.getItem('garden-os-guest-data')).gardens[0]),savedGarden);
  assert.equal(await saved.evaluate(()=>window.gpsCalls),0);assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
  console.log('PASS beginner climate: optional location, saved garden auto-lookup, city/ZIP, two frost dates, source/method labels, scoped cache reload, mild climate, partial/full provider errors and retry, no GPS, no garden/calendar/cloud writes, mobile width and WCAG AA, preserved helper focus/scroll.');
}catch(error){console.error(log.slice(-5000));throw error;}finally{await browser?.close();server.kill();fixture.kill();}

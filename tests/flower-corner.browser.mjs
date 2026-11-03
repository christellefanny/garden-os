// Public preview/local QA. No sign-in, guest initialization or user record mutation.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.FLOWER_CORNER_ORIGIN||'http://127.0.0.1:3000';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[],privateRequests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/rest\/v1|api\/state|api\/photos/.test(r.url()))privateRequests.push(r.url());});
 await page.goto(origin+'/flower-corner');
 await page.getByRole('heading',{name:'Flower Corner',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Continue as guest',exact:true}).count(),0);
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:844});
  const nav=page.getByRole('navigation',{name:'Flower Corner sections'});
  await nav.getByRole('button',{name:'Library',exact:true}).click();
  await page.getByRole('combobox',{name:'Plant type',exact:true}).selectOption('foliage');
  assert.ok(await page.locator('.corner-library-card').count()>0);
  assert.equal(await nav.getByRole('button',{name:'Flower Care',exact:true}).count(),0);
  await page.getByRole('button',{name:/Read .* growing guide/}).first().click();
  const dialog=page.getByRole('dialog');await dialog.waitFor();
  assert.ok(await dialog.getByRole('heading',{name:'When & how to plant',exact:true}).isVisible());
  assert.ok(await dialog.getByRole('link').count()>0);
  for(const name of ['Feeding','Bouquet use','Seed saving','Common problems'])assert.ok(await dialog.getByText(name,{exact:true}).count()>0);
  const plantTitle=await dialog.getByRole('heading').first().innerText();
  await dialog.getByRole('button',{name:'Understand pinching, deadheading & cutting back',exact:true}).click();
  await dialog.getByRole('heading',{name:'Care techniques',exact:true}).waitFor();
  assert.equal(await page.getByRole('dialog').count(),1);
  await page.waitForFunction(()=>document.activeElement?.textContent==='Three different cuts, three different jobs');
  await page.keyboard.press('Tab');await page.keyboard.press('Tab');
  assert.ok(await dialog.getByRole('button',{name:'← Back to '+plantTitle+' growing guide',exact:true}).evaluate(e=>e===document.activeElement));
  await page.keyboard.press('Enter');
  await dialog.getByRole('heading',{name:plantTitle,exact:true}).waitFor();
  await page.keyboard.press('Escape');
  assert.ok(await page.getByRole('button',{name:/Read .* growing guide/}).first().evaluate(e=>e===document.activeElement));
  await page.getByRole('button',{name:'Care techniques: pinching, deadheading & cutting back',exact:true}).click();
  await dialog.getByRole('heading',{name:'Care techniques',exact:true}).waitFor();
  await page.keyboard.press('Escape');
  assert.ok(await page.getByRole('button',{name:'Care techniques: pinching, deadheading & cutting back',exact:true}).evaluate(e=>e===document.activeElement));
  await page.getByRole('combobox',{name:'Plant type',exact:true}).selectOption('all');
  for(const name of ['When & How to Plant','Cut Flowers & Bouquets','Seed Saving & Next Season']){
   await nav.getByRole('button',{name,exact:true}).click();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await page.getByRole('button',{name:'Add pictures',exact:true}).count(),0);
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(privateRequests,[]);
 console.log('PASS public Flower Corner, foliage dialogs/Escape/focus, 4 sections at desktop/390/320, no account data requests.');
}finally{await browser.close();}

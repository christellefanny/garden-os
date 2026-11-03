// Public UI QA; no sign-in or account record mutation.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.FLOWER_CORNER_ORIGIN||'http://127.0.0.1:3000';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:844});
  await page.goto(origin+'/flower-corner');
  await page.getByRole('heading',{name:'Flower Corner',exact:true}).waitFor();
  await page.getByRole('searchbox',{name:'Search the Library'}).fill('statice');
  const imageLink=page.getByRole('link',{name:'Open Statice growing guide',exact:true});
  await imageLink.click();
  await page.waitForURL(/\/flower-corner\/statice/);
  await page.getByRole('heading',{name:'Statice',exact:true}).waitFor();
  const task=page.locator('.floating-add-task');
  assert.equal(await task.count(),1);await task.click();
  await page.getByLabel('Task',{exact:true}).fill('Cancelled draft, do not save');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.ok(await task.evaluate(e=>e===document.activeElement));
  await task.click();await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(),0);
  await page.reload();
  await page.getByRole('heading',{name:'Statice',exact:true}).waitFor();
  for(const label of ['Germination','Feeding','Bouquet use','Seed saving','Common problems'])assert.ok(await page.getByText(label,{exact:true}).count()>0,label);
  for(const name of ['Flower care: pinching, deadheading & cutting back','About this guide & its sources']){
   const opener=page.getByRole('button',{name,exact:true});await opener.click();
   await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
   assert.ok(await opener.evaluate(e=>e===document.activeElement));
  }
  await page.getByRole('link',{name:'← Back to Library',exact:true}).first().click();
  await page.getByRole('searchbox',{name:'Search the Library'}).waitFor();
  await page.waitForFunction(()=>document.querySelector('input[type=search]')?.value==='statice');
  await page.getByRole('link',{name:'Statice',exact:true}).click();
  await page.getByRole('heading',{name:'Statice',exact:true}).waitFor();
  await page.goBack();
  await page.getByRole('link',{name:'Read Statice growing guide',exact:true}).click();
  await page.getByRole('heading',{name:'Statice',exact:true}).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto(origin+'/flower-corner');
  await page.getByRole('button',{name:'Cut Flowers & Bouquets',exact:true}).click();
  assert.equal(await page.locator('.floating-add-task').count(),1);
  assert.equal(await page.getByTestId('cut-flower-guidance-note').count(),1);
  assert.equal(await page.getByText('A guide, not a universal planting date.',{exact:true}).count(),0);
  assert.equal(await page.getByText('Garden Atelier’s illustrated field notes',{exact:true}).count(),0);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 assert.deepEqual(errors,[]);console.log('PASS picture/name/read routes, refresh/back, supplementary dialogs, preserved filter, condensed note and desktop/narrow layouts.');
}finally{await browser.close();}

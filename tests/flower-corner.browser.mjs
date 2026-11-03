// Public UI QA; no sign-in or account record mutation.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const origin=process.env.FLOWER_CORNER_ORIGIN||'http://127.0.0.1:3000';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const context=await browser.newContext(),page=await context.newPage(),errors=[];
 context.on('page',tab=>tab.on('pageerror',error=>errors.push(error.message)));
 page.on('pageerror',error=>errors.push(error.message));
 const filterToggle=()=>page.getByRole('button',{name:/^Filters/});
 const revealFilters=async()=>{if(await filterToggle().getAttribute('aria-expanded')!=='true')await filterToggle().click();};
 const openProfile=async(link,id)=>{
  assert.equal(await link.getAttribute('target'),'_blank');
  assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
  const pending=context.waitForEvent('page');await link.click();const tab=await pending;
  await tab.waitForURL(new RegExp('/flower-corner/'+id));
  assert.equal(await tab.evaluate(()=>window.opener),null);
  return tab;
 };
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:844});
  await page.goto(origin+'/flower-corner');
  await page.getByRole('heading',{name:'Flower Corner',exact:true}).waitFor();
  await revealFilters();
  await page.getByRole('searchbox',{name:'Search the Library'}).fill('hosta');
  await page.getByRole('combobox',{name:'Plant kind',exact:true}).selectOption('foliage');
  await page.getByRole('combobox',{name:'Life cycle',exact:true}).selectOption('perennial');
  await page.getByRole('combobox',{name:'Sunlight',exact:true}).selectOption('shade');
  assert.equal(await page.locator('.corner-library-card').count(),1);
  assert.match(await page.getByRole('status').innerText(),/1 plant matches your filters/);
  assert.match(page.url(),/life=perennial/);
  await filterToggle().click();assert.equal(await page.getByRole('searchbox',{name:'Search the Library'}).isVisible(),false);
  await filterToggle().focus();await page.keyboard.press('Enter');
  assert.equal(await page.getByRole('searchbox',{name:'Search the Library'}).inputValue(),'hosta');
  await page.reload();
  await page.getByRole('searchbox',{name:'Search the Library'}).waitFor();
  assert.equal(await page.getByRole('combobox',{name:'Life cycle',exact:true}).inputValue(),'perennial');
  await page.getByRole('combobox',{name:'Life cycle',exact:true}).selectOption('annual');
  assert.equal(await page.locator('.corner-library-card').count(),0);
  await page.getByText('No plants match all your filters.',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Clear all filters',exact:true}).click();
  assert.equal(new URL(page.url()).search,'');
  assert.equal(await page.getByRole('searchbox',{name:'Search the Library'}).inputValue(),'');
  for(const name of ['Plant kind','Life cycle','Sunlight'])assert.equal(await page.getByRole('combobox',{name,exact:true}).inputValue(),'all');

  await page.getByRole('searchbox',{name:'Search the Library'}).fill('statice');
  await page.getByRole('combobox',{name:'Plant kind',exact:true}).selectOption('flower');
  await page.getByRole('combobox',{name:'Life cycle',exact:true}).selectOption('annual');
  await page.getByRole('combobox',{name:'Sunlight',exact:true}).selectOption('sun');
  const libraryUrl=page.url();
  const imageLink=page.getByRole('link',{name:'Explore Statice (opens in a new tab)',exact:true});
  const guide=await openProfile(imageLink,'statice');
  await guide.setViewportSize({width,height:844});
  await guide.getByRole('heading',{name:'Statice',exact:true}).waitFor();
  assert.equal(page.url(),libraryUrl);
  assert.equal(await page.getByRole('searchbox',{name:'Search the Library'}).inputValue(),'statice');
  const task=guide.locator('.floating-add-task');
  assert.equal(await task.count(),1);await task.click();
  await guide.getByLabel('Task',{exact:true}).fill('Cancelled draft, do not save');
  await guide.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.ok(await task.evaluate(element=>element===document.activeElement));
  await task.click();await guide.keyboard.press('Escape');
  assert.equal(await guide.getByRole('dialog').count(),0);
  await guide.reload();
  await guide.getByRole('heading',{name:'Statice',exact:true}).waitFor();
  for(const label of ['Germination','Feeding','Bouquet use','Seed saving','Common problems'])assert.ok(await guide.getByText(label,{exact:true}).count()>0,label);
  const about=guide.getByRole('button',{name:'About this guide & its sources',exact:true});await about.click();
  await guide.getByRole('dialog').waitFor();await guide.keyboard.press('Escape');
  assert.ok(await about.evaluate(element=>element===document.activeElement));
  assert.ok(await guide.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await guide.getByRole('link',{name:'← Back to Library',exact:true}).first().click();
  await guide.getByRole('searchbox',{name:'Search the Library'}).waitFor();
  assert.equal(await guide.getByRole('searchbox',{name:'Search the Library'}).inputValue(),'statice');
  assert.equal(await guide.getByRole('combobox',{name:'Life cycle',exact:true}).inputValue(),'annual');
  await guide.goBack();await guide.getByRole('heading',{name:'Statice',exact:true}).waitFor();
  await guide.goForward();await guide.getByRole('searchbox',{name:'Search the Library'}).waitFor();
  assert.equal(await guide.getByRole('combobox',{name:'Life cycle',exact:true}).inputValue(),'annual');
  await guide.close();
  const nameLink=page.getByRole('link',{name:'Statice (opens in a new tab)',exact:true});
  const namedGuide=await openProfile(nameLink,'statice');
  await namedGuide.getByRole('heading',{name:'Statice',exact:true}).waitFor();await namedGuide.close();
  assert.equal(page.url(),libraryUrl);
  assert.equal(await page.getByRole('link',{name:/Read .* growing guide/}).count(),0);
  await page.getByRole('button',{name:'Reset filters',exact:true}).click();
  assert.equal(new URL(page.url()).search,'');
  const care=page.getByRole('button',{name:'Care techniques: pinching, deadheading & cutting back',exact:true});
  for(let repeat=0;repeat<2;repeat++){
   await care.click();const dialog=page.getByRole('dialog');await dialog.waitFor();
   assert.ok(await dialog.getByRole('img').count()>=3);
   if(repeat===0)await page.keyboard.press('Escape');else await dialog.getByRole('button',{name:'Close dialog',exact:true}).click();
   assert.ok(await care.evaluate(element=>element===document.activeElement));
  }
  for(const name of ['When & How to Plant','Cut Flowers & Bouquets','Seed Saving & Next Season','Library']){
   await page.getByRole('button',{name,exact:true}).click();
   assert.equal(await page.locator('.floating-add-task').count(),1);
   assert.equal(await page.locator('.corner-public-note').count(),1);
   assert.equal(await page.getByTestId('cut-flower-guidance-note').count(),0);
   assert.equal(await page.getByText('A guide, not a universal planting date.',{exact:true}).count(),0);
   assert.equal(await page.getByText('Garden Atelier’s illustrated field notes',{exact:true}).count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
 }
 assert.deepEqual(errors,[]);console.log('PASS new-tab picture/name routes, isolated opener, refresh/return filters, combined lifecycle filtering, reset/empty state, illustrated dialogs, one persistent note and desktop/narrow layouts.');
}finally{await browser.close();}

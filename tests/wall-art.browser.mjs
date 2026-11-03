import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'}),server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3043'],{stdio:'inherit'});
let browser;
try{
 for(let i=0;i<160;i++){try{if((await fetch('http://127.0.0.1:3043')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3043');await page.getByRole('button',{name:'Continue as guest',exact:true}).click();await page.getByRole('button',{name:'Continue as guest',exact:true}).click();await page.getByRole('navigation').getByRole('button',{name:'Plan & Design',exact:true}).click();

 await page.getByRole('button',{name:'Start from scratch →',exact:true}).click();await page.getByRole('button',{name:'Create blank canvas',exact:true}).click();await page.getByRole('button',{name:'Add wall',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Choose a garden wall'});await dialog.waitFor();assert.equal(await dialog.locator('.container-picker-grid button').count(),5);
 await page.waitForFunction(()=>[...document.querySelectorAll('.container-picker-grid img')].every(i=>i.complete&&i.naturalWidth>0));
 const axe=await new AxeBuilder({page}).include('dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>v.id),[]);
 await dialog.screenshot({path:'/workspace/scratch/garden-wall-chooser.png'});
 await page.getByRole('button',{name:'Add Stone sitting wall',exact:true}).click();
 const shape=page.getByRole('button',{name:'Select Stone sitting wall',exact:true});await shape.waitFor();assert.equal(await shape.getAttribute('data-illustrated'),'true');assert.match(await shape.locator('img').getAttribute('src'),/sitting-stone/);
 await page.getByRole('button',{name:'Rotate Stone sitting wall 90 degrees',exact:true}).click();assert.match(await shape.locator('.layout-wall-art').getAttribute('style'),/rotate\(90deg\)/);
 await page.getByRole('button',{name:'Use Brick sitting wall',exact:true}).click();assert.match(await shape.locator('img').getAttribute('src'),/sitting-brick/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('garden-os-custom-layouts-v1-guest-planning')));assert.equal(saved[0].items[0].kind,'Wall');assert.equal(saved[0].items[0].wallStyle,'sitting-brick');assert.equal(saved[0].items[0].w,12);assert.equal(saved[0].items[0].h,40);
 await page.reload();await page.getByRole('button',{name:'My garden layout',exact:true}).click();assert.match(await page.getByRole('button',{name:'Select Stone sitting wall',exact:true}).locator('img').getAttribute('src'),/sitting-brick/);
 await page.getByRole('button',{name:'Select Stone sitting wall',exact:true}).click();await page.getByRole('button',{name:'Rotate Stone sitting wall 90 degrees',exact:true}).click();
 await page.getByRole('button',{name:'Add wall',exact:true}).click();await page.getByRole('button',{name:'Add Curved stone sitting wall',exact:true}).click();
 const curved=page.getByRole('button',{name:'Select Curved stone sitting wall',exact:true});await page.getByRole('button',{name:'Rotate Curved stone sitting wall 90 degrees',exact:true}).click();await page.getByRole('button',{name:'Rotate Curved stone sitting wall 90 degrees',exact:true}).click();assert.match(await curved.locator('.layout-wall-art').getAttribute('style'),/rotate\(180deg\)/);await page.getByRole('button',{name:'Rotate Curved stone sitting wall 90 degrees',exact:true}).click();await page.getByRole('button',{name:'Rotate Curved stone sitting wall 90 degrees',exact:true}).click();
 await page.getByLabel('Left (%)',{exact:true}).fill('50');await page.getByLabel('Top (%)',{exact:true}).fill('45');await page.getByLabel('Width (%)',{exact:true}).fill('42');
 await page.getByRole('button',{name:'Add container',exact:true}).click();await page.getByRole('button',{name:'Add Ivory porch planter',exact:true}).click();
 await page.getByLabel('Left (%)',{exact:true}).fill('58');await page.getByLabel('Top (%)',{exact:true}).fill('37');await page.getByLabel('Width (%)',{exact:true}).fill('14');await page.getByLabel('Height (%)',{exact:true}).fill('18');
 await page.locator('.layout-design-canvas').screenshot({path:'/workspace/scratch/garden-wall-with-planter.png'});
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Add wall',exact:true}).click();await page.getByRole('dialog',{name:'Choose a garden wall'}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'/workspace/scratch/garden-wall-mobile.png'});
 await page.getByRole('button',{name:'Add Curved block sitting wall',exact:true}).click();const actualWall=page.getByRole('button',{name:'Select Curved block sitting wall',exact:true});await actualWall.waitFor();assert.match(await actualWall.locator('img').getAttribute('src'),/curved-block/);await page.getByRole('button',{name:'Add wall',exact:true}).click();await page.getByRole('button',{name:'Add Stacked stone retaining wall',exact:true}).click();await page.getByRole('button',{name:'Delete Stacked stone retaining wall',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Select Stacked stone retaining wall',exact:true}).count(),0);assert.deepEqual(errors,[]);
 console.log('PASS: illustrated walls load, accessible chooser, rotate with artwork, finish changes and reload persist, containers alongside, mobile selection and deletion.');
}finally{await browser?.close();server.kill();fixture.kill();}

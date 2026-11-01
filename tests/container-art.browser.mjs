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
 await page.getByText('Explore planter styles',{exact:true}).click();assert.equal(await page.locator('.container-inspiration figure').count(),11);await page.locator('.container-inspiration').screenshot({path:'/workspace/scratch/container-inspiration-desktop.png'});
 await page.getByRole('button',{name:'Start from scratch →',exact:true}).click();await page.getByRole('button',{name:'Create blank canvas',exact:true}).click();await page.getByRole('button',{name:'Add container',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Choose a pot or planter'});await dialog.waitFor();assert.equal(await dialog.locator('.container-picker-grid button').count(),11);await page.waitForFunction(()=>[...document.querySelectorAll('.container-picker-grid img')].every(i=>i.complete&&i.naturalWidth>0));
 const axe=await new AxeBuilder({page}).include('dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>v.id),[]);
 await page.getByRole('button',{name:'Add Glazed blue pot',exact:true}).click();const shape=page.getByRole('button',{name:'Select Glazed blue pot',exact:true});await shape.waitFor();assert.equal(await shape.getAttribute('data-illustrated'),'true');assert.equal(await shape.evaluate(e=>getComputedStyle(e).borderTopWidth),'0px');assert.equal(await shape.locator('img').count(),1);
 await page.getByRole('button',{name:'Use Oak half-barrel',exact:true}).click();assert.match(await shape.locator('img').getAttribute('src'),/barrel/);
 await page.getByText('Add vegetables & flowers',{exact:false}).first().click();await page.getByRole('button',{name:'Add decorative Tomato',exact:true}).click();
 await page.locator('.layout-design-canvas').screenshot({path:'/workspace/scratch/container-with-plant.png'});
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('garden-os-custom-layouts-v1-guest-planning')));assert.equal(before[0].items[0].containerStyle,'barrel');assert.equal(before[0].items[0].decorations[0].plantId,'tomato');
 await page.reload();await page.getByRole('button',{name:'My garden layout',exact:true}).click();assert.match(await page.getByRole('button',{name:'Select Glazed blue pot',exact:true}).locator('img').getAttribute('src'),/barrel/);
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Add container',exact:true}).click();await page.getByRole('dialog',{name:'Choose a pot or planter'}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'/workspace/scratch/container-picker-mobile.png'});
 await page.getByRole('button',{name:'Add Sage window box',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Select Sage window box',exact:true}).count(),1);assert.deepEqual(errors,[]);
 console.log('PASS: eleven inspiration styles and loaded assets, accessible picker, illustrated canvas with no circle border, style changes and plant decoration persist, mobile 390px selection.');
}finally{await browser?.close();server.kill();fixture.kill();}

// Isolated guest/member fixture. No production records or location requests.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
import {initialLayout} from '../lib/garden-layout.ts';
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next',...(process.env.GARDEN_TEST_PRODUCTION?['start']:['dev','--webpack']),'--hostname','127.0.0.1'],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'layout-studio-fixture'},stdio:['ignore','pipe','pipe']});
let page;let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);let browser;
const key='garden-os-custom-layouts-v1-guest-planning';
try {
 for(let n=0;n<120;n++){try{if((await fetch('http://127.0.0.1:3000',{signal:AbortSignal.timeout(2000)})).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 let executable=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
 if(!executable&&process.env.GARDEN_PACKAGED_CHROMIUM)executable=await (await import(process.env.GARDEN_PACKAGED_CHROMIUM)).default.executablePath();
 browser=await chromium.launch({executablePath:executable,args:['--no-sandbox','--disable-gpu','--single-process','--no-zygote']});
 const context=await browser.newContext({viewport:{width:1536,height:1000}});page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('garden-os-guest-warning-seen','true'));
 await page.goto('http://127.0.0.1:3000');await page.getByRole('button',{name:'Continue as guest',exact:true}).click();
 const inspiration=page.getByRole('region',{name:'Imagine your dream garden',exact:true});await inspiration.waitFor();
 for(const [label,count] of [['Compact courtyard garden',2],['A garden for bouquets',4],['Four-bed vegetable garden',4]]){await inspiration.getByRole('button',{name:label,exact:true}).click();assert.equal(await inspiration.locator('.guest-example-art button').count(),count);await inspiration.locator('img').evaluate(el=>el.decode());}
 await inspiration.getByRole('button',{name:'Design your own garden',exact:false}).click();
 const gallery=page.locator('.layout-template-grid');await gallery.waitFor();assert.equal(await gallery.locator('article').count(),3);assert.equal(await page.getByRole('heading',{name:'Original nine-bed layout',exact:true}).count(),0);
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),null,'Browsing never creates plans');
 for(const img of await gallery.locator('img').all())await img.evaluate(el=>el.decode());
 await mkdir('docs/previews/layout-studio',{recursive:true});await page.screenshot({path:'docs/previews/layout-studio/gallery-desktop.png',fullPage:true});
 for(const width of [1024,768,390,320]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Gallery overflow '+width);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/previews/layout-studio/gallery-mobile.png',fullPage:true});await page.setViewportSize({width:1536,height:1000});
 const make=async(name,button)=>{await page.getByRole('button',{name:button,exact:false}).click();await page.getByLabel('Layout name',{exact:true}).fill(name);await page.getByRole('button',{name:'Create my editable copy',exact:true}).click();await page.getByRole('heading',{name,exact:true}).waitFor();};
 await make('My four-bed garden','Customize four-bed vegetable garden');
 const canvas=page.getByLabel('Garden layout canvas',{exact:true});await canvas.waitFor();
 assert.equal(await canvas.locator('.layout-on-canvas-actions').count(),0,'Actions wait for an explicit selection');
 const flowerBorder=canvas.locator('.layout-canvas-item').filter({has:page.getByRole('button',{name:'Select Flower border',exact:true})});
 await page.mouse.move(0,0);assert.equal(await flowerBorder.locator('.layout-object-label').evaluate(el=>getComputedStyle(el).opacity),'0');
 await flowerBorder.hover();assert.equal(await flowerBorder.locator('.layout-object-label').evaluate(el=>getComputedStyle(el).opacity),'1');
 assert.ok((await flowerBorder.locator('.layout-object-label').boundingBox()).width<(await flowerBorder.boundingBox()).width,'Label is a small tooltip, never a full border strip');
 await page.mouse.move(0,0);assert.equal(await flowerBorder.locator('.layout-object-label').evaluate(el=>getComputedStyle(el).opacity),'0');
 await page.getByRole('button',{name:'Select Tomato bed',exact:true}).click({position:{x:4,y:4}});assert.equal(await canvas.locator('.layout-on-canvas-actions').count(),1);
 await canvas.click({position:{x:10,y:100}});assert.equal(await canvas.locator('.layout-on-canvas-actions').count(),0);assert.equal(await page.getByLabel('Select garden shape',{exact:true}).inputValue(),'');
 await page.getByRole('button',{name:'Select Tomato bed',exact:true}).click({position:{x:4,y:4}});await page.getByRole('heading',{name:'My four-bed garden',exact:true}).click();assert.equal(await canvas.locator('.layout-on-canvas-actions').count(),0,'Clicking outside the bed dismisses actions');
 await page.getByRole('button',{name:'Select Tomato bed',exact:true}).click({position:{x:4,y:4}});await page.getByRole('button',{name:'Select Tomato bed',exact:true}).press('Escape');assert.equal(await canvas.locator('.layout-on-canvas-actions').count(),0);
 const plans=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'[]'),key);let saved=await plans();assert.equal(saved.length,1);assert.equal(saved[0].items.filter(i=>i.kind==='Bed').length,4);assert.equal(saved[0].items[2].decorations.length,4);

 await page.getByRole('button',{name:'Select Main path',exact:true}).click({position:{x:5,y:30}});const before=(await plans())[0].items.find(i=>i.name==='Main path');
 await canvas.getByRole('button',{name:'Rotate Main path 90 degrees',exact:true}).click();const rotated=(await plans())[0].items.find(i=>i.name==='Main path');assert.equal(rotated.w,before.h);assert.equal(rotated.h,before.w);
 await canvas.getByRole('button',{name:'Delete Main path',exact:true}).click();assert.equal((await plans())[0].items.some(i=>i.name==='Main path'),false);await page.getByRole('button',{name:'Undo removal',exact:true}).click();assert.ok((await plans())[0].items.some(i=>i.id===before.id));await page.getByRole('button',{name:'Select Main path',exact:true}).focus();await page.getByRole('button',{name:'Select Main path',exact:true}).press('Enter');await canvas.getByRole('button',{name:'Rotate Main path 90 degrees',exact:true}).click();
 await page.getByRole('button',{name:'Select Tomato bed',exact:true}).click({position:{x:4,y:4}});
 await page.locator('.layout-plant-drawer > summary').click();assert.equal(await page.getByRole('button',{name:/^Add decorative /}).count(),13);
 for(const img of await page.locator('.layout-plant-options img').all())await img.evaluate(el=>el.decode());
 await page.getByRole('button',{name:'Add decorative Broccoli',exact:true}).click();assert.equal((await plans())[0].items.find(i=>i.name==='Tomato bed').decorations.length,5);
 const stamp=page.getByRole('button',{name:'Move Broccoli illustration in Tomato bed',exact:true});await stamp.click();await stamp.press('ArrowRight');assert.equal((await plans())[0].items.find(i=>i.name==='Tomato bed').decorations.at(-1).x,55);
 // Pointer repositioning within a bed.
 const bounds=await stamp.boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2+12,bounds.y+bounds.height/2+10,{steps:4});await page.mouse.up();assert.ok((await plans())[0].items.find(i=>i.name==='Tomato bed').decorations.at(-1).x>55);
 await canvas.getByRole('button',{name:'Delete plant',exact:true}).click();assert.equal((await plans())[0].items.find(i=>i.name==='Tomato bed').decorations.length,4);await page.getByRole('button',{name:'Undo removal',exact:true}).click();
 await page.getByRole('button',{name:'Flowers · 6',exact:true}).click();assert.equal(await page.getByRole('button',{name:/^Add decorative /}).count(),6);for(const img of await page.locator('.layout-plant-options img').all()){
 await img.evaluate(el=>el.decode());
 const transparentFraction=await img.evaluate(el=>{const c=document.createElement('canvas');c.width=el.naturalWidth;c.height=el.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(el,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;let clear=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)clear++;return clear/(c.width*c.height);});
 assert.ok(transparentFraction>.2,'Each flower has real transparency, including at optimized image sizes');
 }await page.getByRole('button',{name:'Add decorative Dahlia',exact:true}).click();
 assert.equal(await canvas.locator('.layout-plant-flower').first().evaluate(el=>getComputedStyle(el).mixBlendMode),'normal','Flowers retain their painted colors on green borders');
 assert.equal(await canvas.locator('.layout-plant-stamp:not(.layout-plant-flower)').first().evaluate(el=>getComputedStyle(el).mixBlendMode),'multiply','Vegetable paper blends into the bed without pale halos');
 await page.locator('.layout-plant-drawer > summary').click();
 await page.getByRole('button',{name:'Plan View',exact:true}).click();assert.equal(await canvas.locator('.layout-plant-stamp').count(),0);await page.getByRole('button',{name:'Garden View',exact:true}).click();assert.ok(await canvas.locator('.layout-plant-stamp').count()>0);
 // On-canvas removal never removes actual records.
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('garden-os-guest-data')||'{"gardens":[],"spaces":[]}')),{gardens:[],spaces:[]});
 const ground=page.getByRole('region',{name:'Garden ground cover',exact:true});
 for(const [label,id] of [['Bark mulch','mulch'],['Gravel & pebbles','gravel'],['Stepping stones','stone']]){await ground.getByRole('button',{name:label,exact:true}).click();assert.equal((await plans())[0].groundCover,id);assert.ok((await canvas.locator('.layout-ground-area').evaluate(el=>getComputedStyle(el).backgroundImage)).includes(`ground-${id}-watercolor.webp`));}
 assert.equal(await canvas.evaluate(el=>getComputedStyle(el).backgroundImage),'none');
 const area=await canvas.locator('.layout-ground-area').boundingBox(), workspace=await canvas.boundingBox();
 assert.ok(area.x>workspace.x&&area.y>workspace.y&&area.x+area.width<workspace.x+workspace.width,'Garden material leaves the outer workspace clear');
 await ground.getByRole('button',{name:'Plain ground',exact:true}).click();assert.equal(await canvas.locator('.layout-ground-area').count(),0);assert.equal((await plans())[0].groundCover,undefined);
 await ground.getByRole('button',{name:'Bark mulch',exact:true}).click();
 await page.getByLabel('Select garden shape',{exact:true}).selectOption(before.id);
 const pathCover=page.getByRole('group',{name:'Path ground cover',exact:true});await pathCover.getByRole('button',{name:'Gravel & pebbles',exact:true}).click();
 assert.equal((await plans())[0].items.find(i=>i.id===before.id).groundCover,'gravel');assert.equal((await plans())[0].groundCover,'mulch');assert.ok((await page.getByRole('button',{name:'Select Main path',exact:true}).evaluate(el=>getComputedStyle(el).backgroundImage)).includes('ground-gravel-watercolor.webp'));
 const borderId=(await plans())[0].items.find(i=>i.kind==='Border').id;await page.getByLabel('Select garden shape',{exact:true}).selectOption(borderId);await page.getByLabel('Height (%)',{exact:true}).fill('4');
 await page.locator('.layout-plant-drawer > summary').click();await page.getByRole('button',{name:'Flowers · 6',exact:true}).click();await page.getByRole('button',{name:'Add decorative Dahlia',exact:true}).click();await page.locator('.layout-plant-drawer > summary').click();
 const borderPlants=canvas.locator('.layout-canvas-item').filter({has:page.getByRole('button',{name:'Select Flower border',exact:true})}).locator('.layout-plant-stamp');
 for(const width of [1536,390,320]){await page.setViewportSize({width,height:900});const cb=await canvas.boundingBox();for(const mark of await borderPlants.all()){const box=await mark.boundingBox();assert.ok(box.width>=43&&box.height>=43,'Thin-border plants stay readable');assert.ok(Math.abs(box.width-box.height)<1,'Plants are not squashed');assert.ok(box.x>=cb.x-2&&box.y>=cb.y-2&&box.x+box.width<=cb.x+cb.width+2&&box.y+box.height<=cb.y+cb.height+2,'Artwork stays within the canvas');}}
 await page.setViewportSize({width:390,height:844});await page.mouse.move(0,0);await canvas.screenshot({path:'docs/previews/layout-studio/thin-border-mobile.png'});await page.setViewportSize({width:1536,height:1000});await canvas.screenshot({path:'docs/previews/layout-studio/ground-covers-desktop.png'});
 await page.getByLabel('Select garden shape',{exact:true}).selectOption(borderId);await canvas.getByRole('button',{name:'Rotate Flower border 90 degrees',exact:true}).click();assert.equal((await plans())[0].items.find(i=>i.id===borderId).w,4);const vertical=await borderPlants.first().boundingBox();assert.ok(vertical.width>=43&&vertical.height>=43);for(let turn=0;turn<3;turn++)await canvas.getByRole('button',{name:'Rotate Flower border 90 degrees',exact:true}).click();
 for(const [field,value]of [['Width (%)','80'],['Height (%)','4'],['Left (%)','10'],['Top (%)','1']])await page.getByLabel(field,{exact:true}).fill(value);
 const check=await new AxeBuilder({page}).include('.layout-studio').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(check.violations.map(v=>({id:v.id,target:v.nodes.map(n=>n.target)})),[]);
 await canvas.screenshot({path:'docs/previews/layout-studio/editor-desktop.png'});
 for(const width of [1536,1024,768,390,320]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Editor overflow '+width);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/previews/layout-studio/editor-mobile.png',fullPage:true});
 const stored=JSON.stringify(await plans());await page.reload();await page.getByRole('heading',{name:'My four-bed garden',exact:true}).waitFor();assert.equal(JSON.stringify(await plans()),stored);
 await page.getByRole('navigation',{name:'Garden Atelier navigation'}).getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('heading',{name:'My Garden Layout',exact:true}).waitFor();assert.equal(await page.getByRole('region',{name:'Imagine your dream garden',exact:true}).count(),0);
 await page.getByRole('navigation',{name:'Garden Atelier navigation'}).getByRole('button',{name:'Plan & Design',exact:true}).click();
 const nav=page.getByRole('navigation',{name:'Saved garden layouts'});await nav.getByRole('button',{name:'Inspiration & new layout',exact:true}).click();
 await make('My courtyard','Customize compact courtyard garden');assert.equal((await plans()).at(-1).items.filter(i=>i.kind==='Container').length,5);
 await nav.getByRole('button',{name:'Inspiration & new layout',exact:true}).click();await make('My flowers','Customize a garden for bouquets');assert.equal((await plans()).length,3);
 await nav.getByRole('button',{name:'Inspiration & new layout',exact:true}).click();await page.getByRole('button',{name:'Start from scratch',exact:false}).click();await page.getByLabel('Layout name',{exact:true}).fill('My blank plan');await page.getByRole('button',{name:'Create blank canvas',exact:true}).click();await page.getByRole('heading',{name:'My blank plan',exact:true}).waitFor();assert.equal((await plans()).at(-1).items.length,0);
 for(const kind of ['bed','container','path','border'])await page.getByRole('button',{name:`Add ${kind}`,exact:true}).click();assert.equal((await plans()).at(-1).items.length,4);
 await page.getByLabel('Select garden shape',{exact:true}).selectOption((await plans()).at(-1).items.find(i=>i.kind==='Path').id);await canvas.getByRole('button',{name:'Rotate Path 1 90 degrees',exact:true}).click();let path=(await plans()).at(-1).items.find(i=>i.kind==='Path');assert.equal(path.w,8);assert.equal(path.h,55);
 // Deleting a design requires confirmation and preserves every other design.
 const beforeDeletion=await plans();
 await page.getByRole('button',{name:'Delete layout',exact:true}).click();
 const deletion=page.getByRole('dialog',{name:'Delete this layout?',exact:true});await deletion.waitFor();
 await deletion.getByRole('button',{name:'Keep layout',exact:true}).click();assert.deepEqual(await plans(),beforeDeletion,'Cancel keeps the design');
 await page.getByRole('button',{name:'Delete layout',exact:true}).click();
 await page.evaluate(k=>localStorage.setItem(k,'unreadable saved data'),key);
 await deletion.getByRole('button',{name:'Delete layout',exact:true}).click();await deletion.getByRole('alert').waitFor();
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'unreadable saved data','An unreadable save is never overwritten by deletion');
 await page.evaluate(({key,plans})=>localStorage.setItem(key,JSON.stringify(plans)),{key,plans:beforeDeletion});
 await deletion.getByRole('button',{name:'Delete layout',exact:true}).click();
 await gallery.waitFor();assert.deepEqual(await plans(),beforeDeletion.slice(0,-1),'Only the selected layout is removed');
 await page.reload();await gallery.waitFor();assert.equal(await page.getByRole('navigation',{name:'Saved garden layouts'}).getByRole('button',{name:'My blank plan',exact:true}).count(),0,'Deleted design stays deleted after reload');
 // Existing user layouts and original nine-bed edits remain available.
 const member=await context.newPage();await member.goto('http://127.0.0.1:3000');await member.evaluate(()=>localStorage.clear());await member.reload();
 const old=initialLayout.map(b=>({...b}));old[2].notes='Keep my saved garlic notes';
 await member.evaluate(({old})=>{const uid='a0a0a0a0-0000-4000-8000-000000000001';localStorage.setItem(`garden-os-layout-2027-${uid}-garden-1`,JSON.stringify(old));localStorage.setItem(`garden-os-layout-selection-${uid}-garden-1`,'original');localStorage.setItem(`garden-os-custom-layouts-v1-${uid}-garden-1`,JSON.stringify([{id:'existing',name:'My existing plan',items:[{id:'existing-bed',name:'Existing bed',kind:'Bed',x:10,y:10,w:20,h:30,spaceId:''}]}]));},{old});
 await member.getByLabel('Email',{exact:true}).fill('garden@example.test');await member.getByLabel('Password',{exact:true}).fill('fixture-password');await member.getByRole('button',{name:'Open my garden',exact:true}).click();await member.locator('.modern-dashboard').waitFor();await member.getByRole('navigation',{name:'Garden Atelier navigation'}).getByRole('button',{name:'Plan & Design',exact:true}).click();await member.getByRole('heading',{name:'Original nine-bed layout',exact:true}).waitFor();assert.equal(await member.getByText('Keep my saved garlic notes',{exact:true}).count(),1);
 await member.getByRole('button',{name:'← Back',exact:true}).click();await member.getByRole('navigation',{name:'Saved garden layouts'}).getByRole('button',{name:'My existing plan',exact:true}).click();await member.getByRole('button',{name:'Select Existing bed',exact:true}).click({position:{x:4,y:4}});await member.getByRole('button',{name:'Rotate Existing bed 90 degrees',exact:true}).click();await member.reload();await member.getByRole('heading',{name:'My existing plan',exact:true}).waitFor();assert.ok(await member.getByRole('button',{name:'Select Existing bed',exact:true}).count());
 const legacyKey='garden-os-layout-2027-a0a0a0a0-0000-4000-8000-000000000001-garden-1';
 const legacyBefore=await member.evaluate(k=>localStorage.getItem(k),legacyKey);
 await member.getByRole('button',{name:'Delete layout',exact:true}).click();await member.getByRole('dialog',{name:'Delete this layout?',exact:true}).getByRole('button',{name:'Delete layout',exact:true}).click();
 await member.locator('.layout-template-grid').waitFor();await member.reload();await member.locator('.layout-template-grid').waitFor();
 assert.equal(await member.getByRole('navigation',{name:'Saved garden layouts'}).getByRole('button',{name:'My existing plan',exact:true}).count(),0,'Deleting the final custom layout returns to inspiration');
 assert.equal(await member.evaluate(k=>localStorage.getItem(k),legacyKey),legacyBefore,'Deleting a custom design preserves the existing nine-bed plan');
 assert.deepEqual(errors,[]);console.log('PASS: three homepage/gallery illustrations, blank start, independent editable copies, direct rotate/delete/undo, 19 illustrated decorations, keyboard/pointer planting, persistence, member legacy preservation, no fake records, five viewport widths and accessibility.');
}catch(e){await page?.screenshot({path:"docs/previews/layout-studio/failure.png",fullPage:true}).catch(()=>{});console.error(e);console.error(log.slice(-2500));process.exitCode=1;}finally{await browser?.close();server.kill();fixture.kill();}

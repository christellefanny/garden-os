// Local guest-only design regression. No live records are changed.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import AxeBuilder from '@axe-core/playwright';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port','3017'],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'layout-studio-fixture'},stdio:['ignore','pipe','pipe']});
let page;let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);let browser;
try{
 for(let n=0;n<120;n++){try{if((await fetch('http://127.0.0.1:3017',{signal:AbortSignal.timeout(2000)})).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch({executablePath:process.env.GARDEN_PACKAGED_CHROMIUM?await (await import(process.env.GARDEN_PACKAGED_CHROMIUM)).default.executablePath():process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote']});
 const context=await browser.newContext({viewport:{width:390,height:844}});page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('garden-os-guest-warning-seen','true'));await page.goto('http://127.0.0.1:3017');await page.getByRole('button',{name:/^(Try it as a guest|Continue as guest)$/,exact:false}).click();
 await page.getByRole('navigation',{name:'Garden Atelier navigation'}).getByRole('button',{name:'Plan & Design',exact:true}).click();
 const sections=page.getByRole('navigation',{name:'Garden layout sections'});
 assert.equal(await sections.getByRole('button').count(),2,'Entry has only two main choices');
 assert.equal(await page.locator('.layout-template-card').count(),0,'Entry does not mix saved designs and inspiration');
 await sections.getByRole('button',{name:'My Layouts',exact:true}).click();
 await page.getByText('No saved layouts yet.',{exact:false}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Start from scratch',exact:true}).count(),0);
 await sections.getByRole('button',{name:'New Layout',exact:true}).click();
 await page.getByRole('button',{name:'Use an inspiration layout',exact:true}).click();
 await page.getByRole('heading',{name:'Choose an inspiration layout',exact:true}).waitFor();
 assert.ok(await page.locator('.layout-template-card').count()>0);
 await page.locator('.layout-template-card button').first().click();
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('heading',{name:'New Layout',exact:true}).waitFor();
 await page.locator('.layout-photo-option>summary').click();
 await page.getByRole('button',{name:'Upload a garden photo',exact:false}).click();
 await page.getByRole('button',{name:/Cancel|Back to/,exact:false}).first().click();
 await page.getByRole('heading',{name:'New Layout',exact:true}).waitFor();
 await page.getByRole('button',{name:'Start from scratch',exact:false}).click();
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.getByRole('button',{name:'Start from scratch',exact:false}).waitFor();
 await page.getByRole('button',{name:'Start from scratch',exact:false}).click();await page.getByLabel('Layout name',{exact:true}).fill('Guided QA garden');await page.getByRole('button',{name:'Create blank canvas',exact:true}).last().click();
 const canvas=page.getByLabel('Garden layout canvas',{exact:true});await canvas.waitFor();
 const steps=page.getByRole('navigation',{name:'Garden design steps'});
 await page.getByRole('button',{name:'Add Bed or Container',exact:false}).click();await page.getByRole('button',{name:'Add garden bed',exact:true}).click();
 const key='garden-os-custom-layouts-v1-guest-planning';const plans=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
 assert.equal((await plans())[0].items.length,1);
 assert.ok((await canvas.boundingBox()).y<(await page.locator('.guided-layout-tool-panel').boundingBox()).y,'Canvas precedes mobile tools');
 await page.locator('.guided-layout-customize>summary').click();await page.getByLabel('Item name',{exact:true}).fill('Herb bed');await page.getByRole('button',{name:'Duplicate item',exact:true}).click();assert.equal((await plans())[0].items.length,2);await page.getByRole('button',{name:'Undo duplication',exact:true}).click();assert.equal((await plans())[0].items.length,1);await page.getByLabel('Select garden shape',{exact:true}).selectOption({label:'Herb bed · Bed'});
 await page.getByRole('button',{name:'Next: add plants',exact:false}).click();
 assert.equal(await page.locator('.guided-layout-heading h3').evaluate(el=>el===document.activeElement),true,'Step heading receives keyboard focus');await page.getByRole('button',{name:'Add decorative Tomato',exact:true}).click();
 await page.getByLabel('Custom plant name',{exact:true}).fill('Lemon verbena');await page.getByRole('button',{name:'Add custom plant',exact:true}).click();
 assert.equal((await plans())[0].items[0].decorations.length,2);
 await page.getByLabel('Find a plant',{exact:true}).fill('Habanero');await page.getByRole('button',{name:'Add decorative Habanero Pepper',exact:true}).click();
 await page.getByLabel('Find a plant',{exact:true}).fill('Daffodil');await page.getByRole('button',{name:/Add decorative Daffodil/}).click();
 await page.getByLabel('Find a plant',{exact:true}).fill('Beet');await page.getByRole('button',{name:'Add decorative Beet',exact:true}).click();
 await page.getByLabel('Find a plant',{exact:true}).fill('');

 await page.getByRole('button',{name:'Next: finishing touches',exact:false}).click();
 await page.getByRole('button',{name:'Add path',exact:false}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 assert.equal(await steps.getByRole('button',{name:'Plants',exact:false}).count(),1);
 await steps.getByRole('button',{name:'Spaces',exact:false}).click();
 await page.getByRole('button',{name:'Add Bed or Container',exact:false}).click();await page.getByRole('button',{name:'Add Classic terracotta',exact:true}).click();
 const potBefore=(await plans())[0].items.find(i=>i.containerStyle==='terracotta');
 await page.getByRole('button',{name:'Turn Classic terracotta clockwise',exact:true}).click();
 let pot=(await plans())[0].items.find(i=>i.id===potBefore.id);assert.equal(pot.containerRotation,90);assert.equal(pot.w,potBefore.h);assert.equal(pot.h,potBefore.w);
 assert.match(await page.locator('.layout-container-art').last().getAttribute('style'),/rotate\(90deg\)/);
 await page.getByRole('button',{name:'Make Classic terracotta larger',exact:true}).click();
 let larger=(await plans())[0].items.find(i=>i.id===pot.id);assert.ok(larger.w>pot.w&&larger.h>pot.h);assert.equal(larger.containerRotation,90);
 await page.getByRole('button',{name:'Make Classic terracotta smaller',exact:true}).click();
 for(let i=0;i<3;i++)await page.getByRole('button',{name:'Turn Classic terracotta clockwise',exact:true}).click();
 pot=(await plans())[0].items.find(i=>i.id===potBefore.id);assert.equal(pot.containerRotation,0);assert.ok(Math.abs(pot.w-potBefore.w)<.00001);

 assert.equal((await plans())[0].items.length,3);
 await page.locator('.guided-layout-customize').evaluate(el=>el.open=false);await page.getByRole('button',{name:'Preview layout',exact:true}).click();assert.equal(await page.locator('.guided-layout-tool-panel').count(),0);await page.getByRole('button',{name:'Continue editing',exact:true}).click();
 await steps.getByRole('button',{name:'Garden',exact:false}).click();await page.getByLabel('Layout name',{exact:true}).fill('   ');await page.getByLabel('Layout name',{exact:true}).blur();assert.equal((await plans())[0].name,'Guided QA garden','Blank rename does not corrupt saved name');await page.getByLabel('Layout name',{exact:true}).fill('Updated QA garden');
 await steps.getByRole('button',{name:'Spaces',exact:false}).click();
 await mkdir('docs/previews/guided-layout',{recursive:true});
 for(const width of [390,320,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No overflow at '+width);await page.screenshot({path:`docs/previews/guided-layout/spaces-${width}.png`,fullPage:true});}
 const axe=await new AxeBuilder({page}).include('.layout-editor').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
 const saved=await plans();await page.reload();await page.getByRole('button',{name:'My Layouts',exact:true}).click();await page.getByRole('button',{name:'Open Updated QA garden',exact:true}).click();assert.deepEqual(await plans(),saved,'Reload preserves every layout item');
 await page.getByLabel('Layout options').click();await page.getByRole('button',{name:'Delete layout',exact:true}).click();await page.getByRole('button',{name:'Keep layout',exact:true}).click();assert.deepEqual(await plans(),saved,'Cancel delete preserves design');await page.getByRole('button',{name:'Rename layout',exact:true}).click();await page.getByRole('dialog',{name:'Rename layout'}).getByLabel('Layout name').fill('Menu-renamed garden');await page.getByRole('button',{name:'Save name',exact:true}).click();await page.getByRole('heading',{name:'Menu-renamed garden',exact:true}).waitFor();await page.getByRole('button',{name:'Add Bed or Container',exact:false}).click();await page.getByRole('button',{name:'Add garden bed',exact:true}).click();assert.equal((await plans())[0].name,'Menu-renamed garden','Subsequent edits preserve menu rename');
 await sections.getByRole('button',{name:'My Layouts',exact:true}).click();
 await page.getByRole('button',{name:'Open Menu-renamed garden',exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Use an inspiration layout',exact:true}).count(),0,'My Layouts contains only saved plans');
 const finalSaved=await plans();await sections.getByRole('button',{name:'New Layout',exact:true}).click();
 assert.equal(await page.getByRole('button',{name:'Open Menu-renamed garden',exact:true}).count(),0,'New Layout does not show existing plans');
 assert.deepEqual(await plans(),finalSaved,'Switching sections leaves saved data untouched');
 for(const width of [320,390,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`docs/previews/guided-layout/new-layout-${width}.png`,fullPage:true});}
 const entryAxe=await new AxeBuilder({page}).include('.layout-studio').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(entryAxe.violations.map(v=>v.id),[]);
 assert.deepEqual(errors,[]);console.log('PASS: guided flow, mobile ordering, plants/custom plant, containers, preview, rename, persistence, cancel, accessibility');
}catch(error){if(page)await page.screenshot({path:'guide-error.png',fullPage:true}).catch(()=>{});console.error(log.slice(-4000));throw error;}finally{await browser?.close();server.kill('SIGTERM');}

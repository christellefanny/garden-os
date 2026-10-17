// Verify the real Flower Garden page against an isolated local database.
import { chromium } from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const fixture=spawn(process.execPath,['tests/fixtures/supabase.mjs'],{stdio:'ignore'});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1'],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54321',NEXT_PUBLIC_SUPABASE_ANON_KEY:'local-bouquet-qa'},stdio:'inherit'});
let browser;
try{
 for(let n=0;n<100;n++){try{if((await fetch('http://127.0.0.1:3000',{signal:AbortSignal.timeout(2000)})).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-gpu','--single-process','--no-zygote']});
 const page=await browser.newPage({viewport:{width:1536,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000');
 await page.getByLabel('Email',{exact:true}).fill('garden@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Open my garden',exact:true}).click();
 await page.getByRole('navigation',{name:'Garden Atelier navigation'}).getByRole('button',{name:'Flower Garden',exact:true}).click();
 await page.getByRole('button',{name:/Cut Flowers Discover bouquet/}).click();
 const section=page.locator('[aria-label="Cut Flower Encyclopedia"]');
 const art=section.locator('img');assert.equal(await art.count(),30);
 for(const img of await art.all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert.ok(await img.evaluate(el=>el.naturalWidth>0));}
 assert.equal(new Set(await art.evaluateAll(imgs=>imgs.map(el=>el.getAttribute('src')))).size,30);
 assert.equal(await section.getByText('No verified illustration yet',{exact:true}).count(),0);
 assert.equal(await section.locator('article').count(),30);
 await mkdir('docs/previews/cut-flowers',{recursive:true});
 for(const width of [1536,768,390]){
  await page.setViewportSize({width,height:1000});await section.scrollIntoViewIfNeeded();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'No overflow at '+width);
  await section.screenshot({path:`docs/previews/cut-flowers/encyclopedia-${width}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS: all 30 encyclopedia portraits decode with distinct sources, no missing illustration placeholders, all 30 entries retained, desktop/tablet/mobile layout and zero runtime errors.');
}finally{await browser?.close();server.kill();fixture.kill();}

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {navigationDestinations} from '../lib/navigation.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Flower Corner has a public route without account or guest dependencies',()=>{
 const route=read('app/flower-corner/page.tsx'),ui=read('components/FlowerCorner.tsx'),editorial=read('components/FlowerCornerEditorial.tsx');
 assert.match(route,/<FlowerCorner\s*\/>/);assert.match(route,/SeasonProvider/);
 for(const source of [route,ui,editorial])assert.doesNotMatch(source,/ItemPicturesButton|PhotoJournal|useVault|readGuest|supabase|userId|photoUrl/);
 assert.match(read('components/GardenApp.tsx'),/href="\/flower-corner"/);
});
test('Flower Corner preserves nav position and legacy Library bookmarks',()=>{
 for(const guest of [true,false]){const nav=navigationDestinations(guest);assert.equal(nav[nav.indexOf('Tasks')-1],'Flower Corner');assert.equal(nav[nav.indexOf('My Gardens')+1],'Beginner’s Guide');}
 assert.match(read('components/GardenWorkspace.tsx'),/requestedView === "flower-library" \? "flower-corner"/);
});
test('public library offers scoped filters, sourced popup profiles and editorial-only inspiration',()=>{
 const ui=read('components/FlowerCorner.tsx');
 for(const name of ['Library','When & How to Plant','Flower Care','Cut Flowers & Bouquets','Seed Saving & Next Season'])assert.ok(ui.includes(name));
 assert.match(ui,/Search the Library/);assert.match(ui,/Plant type/);assert.match(ui,/Sunlight/);assert.match(ui,/aria-haspopup="dialog"/);
 assert.match(ui,/<Dialog title=\{selected.name\}/);assert.match(ui,/selected.sources.map/);assert.match(ui,/not full seed-starting profiles yet/);
 assert.match(ui,/getFlowerGardenArt/);assert.match(ui,/VaultBotanicalPortrait/);
});

test('public Flower Corner renders actual Library cards without personal controls',async()=>{
 const React=await import('react');
 const {renderToStaticMarkup}=await import('react-dom/server');
 const {createRequire}=await import('node:module');
 const vm=await import('node:vm');
 const ts=await import('typescript');
 const profiles=await import('../lib/flower-corner-library.ts');
 const editorial=await import('../lib/flower-corner-editorial.ts');
 const art=await import('../lib/flower-garden-art.ts');
 const require=createRequire(import.meta.url),exports={};
 const js=ts.default.transpileModule(read('components/FlowerCorner.tsx'),{compilerOptions:{jsx:ts.default.JsxEmit.ReactJSX,module:ts.default.ModuleKind.CommonJS,target:ts.default.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.default.runInNewContext(js,{exports,require:id=>{
  if(id==='next/image')return function MockImage({src,alt}){return React.createElement('img',{src,alt});};
  if(id==='@/lib/flower-corner-library')return profiles;
  if(id==='@/lib/flower-corner-editorial')return editorial;
  if(id==='@/lib/flower-garden-art')return art;
  if(id==='@/components/seasonal/SeasonProvider')return {useSeason:()=>({season:'spring'})};
  if(id==='@/components/FlowerCornerEditorial')return {};
  if(id.startsWith('@/components/'))return ()=>null;
  return require(id);
 }});
 const html=renderToStaticMarkup(React.createElement(exports.default));
 assert.equal((html.match(/class="corner-library-card"/g)||[]).length,profiles.flowerCornerProfiles.length);
 assert.equal(profiles.flowerCornerProfiles.filter(p=>p.kind==='foliage').length,2);
 for(const p of profiles.flowerCornerProfiles)assert.ok(html.includes(p.name.replaceAll('&','&amp;')),p.name);
 assert.match(html,/Flower Corner sections/);assert.match(html,/No account needed/);
 assert.doesNotMatch(html,/Your bouquet ideas|Add pictures|My flowers|Continue as guest|Sign in/);
});

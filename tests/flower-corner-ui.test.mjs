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
test('public library consolidates sourced profiles and linked care techniques',()=>{
 const ui=read('components/FlowerCorner.tsx');
 for(const name of ['Library','When & How to Plant','Cut Flowers & Bouquets','Seed Saving & Next Season'])assert.ok(ui.includes(name));
 assert.match(ui,/Search the Library/);assert.match(ui,/Plant type/);assert.match(ui,/Sunlight/);assert.match(ui,/aria-haspopup="dialog"/);
 assert.match(ui,/<Dialog title=\{techniques/);assert.match(ui,/selected.sources.map/);assert.doesNotMatch(ui,/not full seed-starting profiles yet|corner-inspiration-grid|CornerCare/);
 assert.match(ui,/Care techniques/);assert.match(ui,/profileExtraFacts/);assert.match(ui,/legacyCare/);
 assert.match(ui,/getFlowerGardenArt/);assert.match(ui,/VaultBotanicalPortrait/);
});

async function loadUI({selected=null,techniques=false}={}){
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
  if(id==='react')return {...React,useState:initial=>[initial===null?selected:initial===false?techniques:initial,()=>{}]};
  if(id==='@/components/ui/Dialog')return function MockDialog({title,children}){return React.createElement('section',{'role':'dialog','aria-label':title},children);};
  if(id==='next/image')return function MockImage({src,alt}){return React.createElement('img',{src,alt});};
  if(id==='@/lib/flower-corner-library')return profiles;
  if(id==='@/lib/flower-corner-editorial')return editorial;
  if(id==='@/lib/flower-garden-art')return art;
  if(id==='@/components/seasonal/SeasonProvider')return {useSeason:()=>({season:'spring'})};
  if(id==='@/components/FlowerCornerEditorial')return {};
  if(id.startsWith('@/components/'))return ()=>null;
  return require(id);
 }});
 return {React,renderToStaticMarkup,exports,profiles,editorial};
}
test('public Flower Corner renders every profile as a complete guide without personal controls',async()=>{
 const {React,renderToStaticMarkup,exports,profiles}=await loadUI();
 const html=renderToStaticMarkup(React.createElement(exports.default));
 assert.equal((html.match(/class="corner-library-card"/g)||[]).length,profiles.flowerCornerProfiles.length);
 assert.ok(profiles.flowerCornerProfiles.some(p=>p.kind==='foliage'));
 assert.doesNotMatch(html,/>Flower Care<|additional cutting-flower inspiration entries/);
 for(const p of profiles.flowerCornerProfiles)assert.ok(html.includes(p.name.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')),p.name);
 assert.match(html,/Flower Corner sections/);assert.match(html,/No account needed/);
 assert.doesNotMatch(html,/Your bouquet ideas|Add pictures|My flowers|Continue as guest|Sign in/);
});

test('all former care reminders resolve to Library profiles without losing flowering/care text',async()=>{
 const {exports,profiles,editorial}=await loadUI();
 const preserved=profiles.flowerCornerProfiles.flatMap(exports.legacyCare);
 for(const care of editorial.cornerCareGuides){
  assert.ok(preserved.some(p=>p.name===care.name&&p.bloom===care.bloom&&p.care===care.care&&p.light===care.light),care.name);
 }
});
test('expanded profile care fields are surfaced in the shared fact rendering',async()=>{
 const {exports,profiles}=await loadUI();
 for(const profile of profiles.flowerCornerProfiles){
  const facts=exports.profileExtraFacts(profile);
  for(const [label,field] of [['Feeding','feeding'],['Bouquet use','bouquet'],['Seed saving','seedSaving'],['Common problems','problems']]){
   assert.equal(typeof profile[field],'string',profile.name+' '+field);
   assert.ok(profile[field].trim().length>0,profile.name+' '+field);
   assert.ok(facts.some(([name,text])=>name===label&&text===profile[field]),profile.name+' '+label);
  }
 }
});

test('profile popup renders expanded care content and linked techniques without nested dialogs',async()=>{
 const {flowerCornerProfiles}=await import('../lib/flower-corner-library.ts');
 const selected=flowerCornerProfiles.find(p=>p.kind==='flower');
 const {React,renderToStaticMarkup,exports}=await loadUI({selected});
 const html=renderToStaticMarkup(React.createElement(exports.default));
 assert.equal((html.match(/role="dialog"/g)||[]).length,1);
 for(const label of ['Feeding','Bouquet use','Seed saving','Common problems','Pinching','Deadheading','Cutting back'])assert.ok(html.includes(label),label);
 assert.match(html,/Understand pinching, deadheading/);
});
test('care technique popup preserves a route back to the selected plant and source attribution',async()=>{
 const {flowerCornerProfiles}=await import('../lib/flower-corner-library.ts');
 const selected=flowerCornerProfiles[0];
 const {React,renderToStaticMarkup,exports}=await loadUI({selected,techniques:true});
 const html=renderToStaticMarkup(React.createElement(exports.default));
 assert.equal((html.match(/role="dialog"/g)||[]).length,1);
 assert.match(html,/aria-label="Care techniques"/);assert.match(html,/Three different cuts/);
 assert.match(html,/extension.illinois.edu\/flowers\/caring-annuals/);
 assert.ok(html.includes('Back to '+selected.name+' growing guide'));
});

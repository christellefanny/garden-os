import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {navigationDestinations} from '../lib/navigation.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Flower Corner has a public route without account or guest dependencies',()=>{
 const route=read('app/flower-corner/page.tsx'),ui=read('components/FlowerCorner.tsx'),editorial=read('components/FlowerCornerEditorial.tsx');
 assert.match(route,/<FlowerCorner\s*\/>/);assert.match(route,/SeasonProvider/);
 for(const source of [route,ui,editorial])assert.doesNotMatch(source,/ItemPicturesButton|PhotoJournal|useVault|readGuest|supabase|userId|photoUrl/);
 assert.ok(navigationDestinations(true).includes('Flower Corner'));
 assert.doesNotMatch(read('components/GardenApp.tsx'),/Explore Flower Corner — no account needed/);
});
test('Flower Corner preserves nav position and legacy Library bookmarks',()=>{
 for(const guest of [true,false]){const nav=navigationDestinations(guest);assert.equal(nav[nav.indexOf('Tasks')-1],'Flower Corner');assert.equal(nav[nav.indexOf('My Gardens')+1],'Beginner’s Guide');}
 assert.match(read('components/GardenWorkspace.tsx'),/requestedView === "flower-library" \? "flower-corner"/);
});
test('public library consolidates sourced profiles and linked care techniques',()=>{
 const ui=read('components/FlowerCorner.tsx');
 for(const name of ['Library','When & How to Plant','Cut Flowers & Bouquets','Seed Saving & Next Season'])assert.ok(ui.includes(name));
 assert.match(ui,/Search the Library/);assert.match(ui,/Plant kind/);assert.match(ui,/Life cycle/);assert.match(ui,/Sunlight/);assert.match(ui,/aria-haspopup="dialog"/);
 assert.match(ui,/<Dialog title="Care techniques"/);assert.match(ui,/guideUrl\(profile.id\)/);assert.doesNotMatch(ui,/not full seed-starting profiles yet|corner-inspiration-grid|CornerCare/);
 assert.match(ui,/Care techniques/);assert.match(ui,/profileExtraFacts/);assert.match(ui,/legacyCare/);
 assert.match(ui,/FlowerCornerPortrait/);
});

async function loadUI({section='Library',techniques=false,filters=null,filtersOpen=false,heroUnavailable=false}={}){
 const React=await import('react');
 const {renderToStaticMarkup}=await import('react-dom/server');
 const {createRequire}=await import('node:module');
 const vm=await import('node:vm');
 const ts=await import('typescript');
 const profiles=await import('../lib/flower-corner-library.ts');
 const editorial=await import('../lib/flower-corner-editorial.ts');
 const classification=await import('../lib/flower-corner-classification.ts');
 const navigation=await import('../lib/flower-corner-navigation.ts');
 const require=createRequire(import.meta.url),exports={};
 let stateIndex=0;
 const state=[section,filters??navigation.defaultFlowerCornerFilters,filtersOpen,'/flower-corner',techniques,heroUnavailable];
 const js=ts.default.transpileModule(read('components/FlowerCorner.tsx'),{compilerOptions:{jsx:ts.default.JsxEmit.ReactJSX,module:ts.default.ModuleKind.CommonJS,target:ts.default.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.default.runInNewContext(js,{exports,URLSearchParams,require:id=>{
  if(id==='react')return {...React,useState:()=>[state[stateIndex++],()=>{}]};
  if(id==='@/components/ui/Dialog')return function MockDialog({title,children}){return React.createElement('section',{'role':'dialog','aria-label':title},children);};
  if(id==='next/link')return function MockLink({href,children,...props}){return React.createElement('a',{href,...props},children);};
  if(id==='next/image')return function MockImage({src,alt}){return React.createElement('img',{src,alt});};
  if(id==='@/lib/flower-corner-library')return profiles;
  if(id==='@/lib/flower-corner-editorial')return editorial;
  if(id==='@/lib/flower-corner-classification')return classification;
  if(id==='@/lib/flower-corner-navigation')return navigation;
  if(id==='@/components/seasonal/SeasonProvider')return {useSeason:()=>({season:'spring'})};
  if(id==='@/components/FlowerCornerEditorial')return {CornerPlanting:()=>null,CornerCutFlowers:()=>null,CornerSeedSaving:()=>null};
  if(id==='@/components/IllustratedCareTechniques')return function MockIllustratedCareTechniques(){return React.createElement('section',{'data-testid':'illustrated-care-techniques'},'Illustrated care techniques');};
  if(id.startsWith('@/components/'))return ()=>null;
  return require(id);
 }});
 return {React,renderToStaticMarkup,exports,profiles,editorial,classification,navigation};
}
test('public Flower Corner renders every profile without personal controls',async()=>{
 const {React,renderToStaticMarkup,exports,profiles}=await loadUI();
 const html=renderToStaticMarkup(React.createElement(exports.default));
 assert.equal((html.match(/class="corner-library-card"/g)||[]).length,profiles.flowerCornerProfiles.length);
 assert.ok(profiles.flowerCornerProfiles.some(p=>p.kind==='foliage'));
 assert.doesNotMatch(html,/>Flower Care<|additional cutting-flower inspiration entries/);
 for(const p of profiles.flowerCornerProfiles)assert.ok(html.includes(p.name.replaceAll('&','&amp;').replaceAll("'",'&#x27;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')),p.name);
 assert.match(html,/Flower Corner sections/);assert.match(html,/Outdoor guidance for U.S. home gardens/);
 assert.doesNotMatch(html,/Your bouquet ideas|Add pictures|My flowers|Continue as guest|Sign in|No account needed/);
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

test('only picture and plant name open each Library profile in a safely isolated new tab',async()=>{
 const {React,renderToStaticMarkup,exports,profiles}=await loadUI();
 const html=renderToStaticMarkup(React.createElement(exports.default));
 for(const p of profiles.flowerCornerProfiles){
  assert.equal(html.split('href="/flower-corner/'+p.id+'?returnTo=%2Fflower-corner"').length-1,2,p.id);
 }
 assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,profiles.flowerCornerProfiles.length*2);
 assert.equal((html.match(/opens in a new tab/g)||[]).length,profiles.flowerCornerProfiles.length*2);
 assert.equal((html.match(/role="dialog"/g)||[]).length,0);
 assert.doesNotMatch(html,/Read .* growing guide|· Growing guide|>Flower<|corner-guide-link/);
 assert.match(read('components/FlowerCorner.tsx'),/history.replaceState\(window.history.state/);
 assert.match(read('components/FlowerCorner.tsx'),/popstate/);
});
test('Library supplementary care techniques use the shared illustrated popup',async()=>{
 const {React,renderToStaticMarkup,exports}=await loadUI({techniques:true});
 const html=renderToStaticMarkup(React.createElement(exports.default));
 assert.equal((html.match(/role="dialog"/g)||[]).length,1);
 assert.match(html,/aria-label="Care techniques"/);assert.match(html,/data-testid="illustrated-care-techniques"/);
 assert.match(read('components/FlowerCorner.tsx'),/<IllustratedCareTechniques\s*\/>/);
 assert.doesNotMatch(read('components/FlowerCorner.tsx'),/flower-guides\/care.webp|<Facts title="Know the difference"/);
});

test('a single permanent hero note replaces repeated hub and editorial guidance notices',async()=>{
 for(const section of ['Library','When & How to Plant','Cut Flowers & Bouquets','Seed Saving & Next Season']){
  const {React,renderToStaticMarkup,exports}=await loadUI({section});
  const html=renderToStaticMarkup(React.createElement(exports.default));
  assert.equal((html.match(/Outdoor guidance for U.S. home gardens/g)||[]).length,1);
  assert.doesNotMatch(html,/A guide, not a universal planting date|Open to everyone/);
 }
 const editorial=read('components/FlowerCornerEditorial.tsx');
 for(const [start,end] of [['CornerPlanting','CornerCare'],['CornerSeedSaving','type BouquetStyle'],['CornerCutFlowers',null]]){
  const source=editorial.slice(editorial.indexOf(`export function ${start}`),end?(end.startsWith('type ')?editorial.indexOf(end):editorial.indexOf(`export function ${end}`)):undefined);
  assert.doesNotMatch(source,/<EditorialNote\s*\/|A little guidance for your cutting garden|cut-flower-guidance-note/);
 }
 assert.match(editorial,/Grow your own bouquets/);assert.match(editorial,/Plan next season, not an exact copy/);
});

test('search, kind, life cycle and sunlight combine with AND matching',async()=>{
 const {exports,profiles,classification,navigation}=await loadUI();
 const plants=profiles.flowerCornerProfiles,defaults=navigation.defaultFlowerCornerFilters;
 const select=filters=>plants.filter(p=>exports.matchesLibraryFilters(p,{...defaults,...filters}));
 assert.equal(select({}).length,plants.length);
 for(const life of ['annual','biennial','perennial']){
  const result=select({life});assert.ok(result.length>0,life);
  for(const profile of result)assert.ok(classification.getPlantLifecycles(profile).includes(life),profile.id);
 }
 const selected=select({query:'hosta',kind:'foliage',life:'perennial',light:'shade'});
 assert.equal(selected.length,1);assert.equal(selected[0].id,'hosta');
 assert.equal(select({query:'hosta',kind:'flower',life:'perennial',light:'shade'}).length,0);
 assert.equal(select({query:'hosta',kind:'foliage',life:'annual',light:'shade'}).length,0);
 assert.equal(select({query:'hosta',kind:'foliage',life:'perennial',light:'sun'}).length,0);
 for(const kind of ['flower','foliage'])for(const life of ['annual','biennial','perennial'])for(const light of ['sun','shade']){
  const intersections=select({kind}).filter(p=>select({life}).includes(p)&&select({light}).includes(p));
  assert.deepEqual(select({kind,life,light}).map(p=>p.id),intersections.map(p=>p.id));
 }
 assert.equal(select({query:'  HOSTA  '}).length,1);
});

test('Filters control exposes a grouped panel, active count, reset and clear empty state',async()=>{
 const defaults={query:'',kind:'all',life:'all',light:'all'};
 const {React,renderToStaticMarkup,exports}=await loadUI({filtersOpen:true,filters:{...defaults,query:'not-a-real-plant',kind:'foliage',life:'biennial',light:'shade'}});
 const html=renderToStaticMarkup(React.createElement(exports.default));
 assert.match(html,/aria-label="Filter the Library"/);assert.match(html,/aria-expanded="true" aria-controls=/);
 assert.match(html,/Filters<span> · 4 active/);assert.match(html,/Reset filters/);
 for(const label of ['Search the Library','Plant kind','Life cycle','Sunlight'])assert.ok(html.includes(label));
 assert.match(html,/role="status" aria-live="polite" aria-atomic="true"/);
 assert.match(html,/0 plants match your filters/);assert.match(html,/No plants match all your filters/);assert.match(html,/Clear all filters/);
 const closed=await loadUI();const closedHtml=closed.renderToStaticMarkup(closed.React.createElement(closed.exports.default));
 assert.match(closedHtml,/aria-expanded="false"/);assert.match(closedHtml,/hidden=""/);assert.doesNotMatch(closedHtml,/Reset filters|Clear all filters/);
});


test('the hub uses a blended real hero image, compact inline Filters and no enclosing band',async()=>{
 const {React,renderToStaticMarkup,exports}=await loadUI();const html=renderToStaticMarkup(React.createElement(exports.default));
 assert.match(html,/src="\/flower-corner-art\/hero-blended.png"/);assert.match(html,/class="corner-hero-copy"/);
 assert.match(html,/class="corner-section-heading"/);assert.match(html,/class="corner-filter-toggle"/);assert.match(html,/class="corner-filters" aria-label="Filter the Library"/);
 assert.doesNotMatch(html,/corner-filters my-6|corner-filters[^\"]*border|corner-filters[^\"]*rounded/);
 const fallback=await loadUI({heroUnavailable:true});assert.match(fallback.renderToStaticMarkup(fallback.React.createElement(fallback.exports.default)),/src="\/flower-botanical-spring.webp"/);
 const css=read('app/globals.css');assert.match(css,/\.corner-filter-toggle\{[^}]*min-height:38px/);assert.match(css,/\.corner-filters\{[^}]*border:0/);assert.match(css,/mix-blend-mode:multiply/);
});

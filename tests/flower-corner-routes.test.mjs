import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeFlowerCornerReturn,readFlowerCornerFilters,flowerCornerLibraryUrl,defaultFlowerCornerFilters} from '../lib/flower-corner-navigation.ts';
import {flowerCornerProfiles} from '../lib/flower-corner-library.ts';
import * as classification from '../lib/flower-corner-classification.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('guide return links preserve only safe Library filters, including life cycle',()=>{
 assert.equal(safeFlowerCornerReturn('/flower-corner?q=blue+flower&kind=flower&life=annual&light=sun'),'/flower-corner?q=blue+flower&kind=flower&life=annual&light=sun');
 assert.equal(safeFlowerCornerReturn('/?view=flower-corner&q=hosta&kind=foliage&life=perennial&light=shade'), '/?view=flower-corner&q=hosta&kind=foliage&life=perennial&light=shade');
 for(const url of ['https://evil.invalid/','//evil.invalid/','/\\evil.invalid/','javascript:alert(1)','/settings','/?view=settings',undefined,['/flower-corner']])assert.equal(safeFlowerCornerReturn(url),'/flower-corner');
 assert.equal(safeFlowerCornerReturn('/flower-corner?secret=not-public&kind=bogus&life=unknown#private'),'/flower-corner');
 for(const life of ['annual','biennial','perennial'])assert.equal(safeFlowerCornerReturn('/flower-corner?life='+life),'/flower-corner?life='+life);
 const filters=readFlowerCornerFilters(new URLSearchParams('q=hosta&kind=foliage&life=perennial&light=shade'));
 assert.deepEqual(filters,{query:'hosta',kind:'foliage',life:'perennial',light:'shade'});
 assert.equal(flowerCornerLibraryUrl('/',filters),'/?view=flower-corner&q=hosta&kind=foliage&life=perennial&light=shade');
 assert.deepEqual(readFlowerCornerFilters(new URLSearchParams('kind=unknown&life=unknown&light=unknown')),defaultFlowerCornerFilters);
 assert.equal(readFlowerCornerFilters(new URLSearchParams('q='+ 'x'.repeat(250))).query.length,200);
 assert.equal(flowerCornerLibraryUrl('/flower-corner',defaultFlowerCornerFilters),'/flower-corner');
 assert.equal(flowerCornerLibraryUrl('/',defaultFlowerCornerFilters),'/?view=flower-corner');
});

test('dedicated route validates every plant ID and has metadata without account access',()=>{
 const route=read('app/flower-corner/[plantId]/page.tsx');
 assert.match(route,/params: Promise/);assert.match(route,/await params/);assert.match(route,/await searchParams/);
 assert.match(route,/notFound\(\)/);assert.match(route,/generateMetadata/);assert.match(route,/safeFlowerCornerReturn/);
 assert.doesNotMatch(route,/supabase|userId|readGuest|photoUrl/);
 assert.equal(new Set(flowerCornerProfiles.map(p=>p.id)).size,flowerCornerProfiles.length);assert.ok(flowerCornerProfiles.length>=45);
 for(const p of flowerCornerProfiles)assert.match(p.id,/^[a-z0-9-]+$/);
});

async function loadGuide(extra=null){
 const RealReact=await import('react');const React=extra?{...RealReact,useState:()=>[extra,()=>{}]}:RealReact;
 const {renderToStaticMarkup}=await import('react-dom/server');const {createRequire}=await import('node:module');const vm=await import('node:vm');const ts=await import('typescript');
 const editorial=await import('../lib/flower-corner-editorial.ts');const art=await import('../lib/flower-garden-art.ts');
 const require=createRequire(import.meta.url),exports={};
 const js=ts.default.transpileModule(read('components/FlowerCornerGuide.tsx'),{compilerOptions:{jsx:ts.default.JsxEmit.ReactJSX,module:ts.default.ModuleKind.CommonJS,target:ts.default.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.default.runInNewContext(js,{exports,require:id=>{
  if(id==='react')return React;
  if(id==='next/link')return function MockLink({href,children,...props}){return React.createElement('a',{href,...props},children);};
  if(id==='next/image')return function MockImage({src,alt}){return React.createElement('img',{src,alt});};
  if(id==='@/components/ui/Dialog')return function MockDialog({title,children}){return React.createElement('dialog',{'aria-label':title},children);};
  if(id==='@/components/IllustratedCareTechniques')return {PlantCareIllustrations:({profile})=>React.createElement('section',{'data-testid':'plant-care-illustrations'},...['pinching','deadheading','cutback'].map(key=>React.createElement('p',{key},profile[key])))};
  if(id==='@/lib/flower-corner-editorial')return editorial;
  if(id==='@/lib/flower-garden-art')return art;
  if(id==='@/lib/flower-corner-navigation')return {safeFlowerCornerReturn};
  if(id==='@/lib/flower-corner-classification')return classification;
  if(id.startsWith('@/components/'))return ()=>null;
  return require(id);
 }});
 return p=>renderToStaticMarkup(React.createElement(exports.default,{profile:p,returnTo:'/flower-corner?q=test'}));
}

test('all guide pages render full facts and illustrated care outside a modal',async()=>{
 const render=await loadGuide();
 for(const p of flowerCornerProfiles){const html=render(p);
  assert.doesNotMatch(html,/<dialog/);assert.equal((html.match(/<h1>/g)||[]).length,1);
  for(const label of ['Start indoors','Germination','Sowing to blooms','Feeding','Common problems','Bouquet use','Seed saving'])assert.ok(html.includes(label),p.id+' '+label);
  assert.match(html,/Back to Library/);assert.match(html,/href="\/flower-corner\?q=test"/);
  assert.ok(html.includes(p.reviewed));assert.match(html,/data-testid="plant-care-illustrations"/);
  assert.doesNotMatch(html,/A guide, not a universal planting date|Flower care: pinching/);
 }
});

test('only guide explanations use a closable shared dialog; care stays inline',async()=>{
 const render=await loadGuide('notes');const html=render(flowerCornerProfiles[0]);
 assert.equal((html.match(/<dialog/g)||[]).length,1);assert.match(html,/About this growing guide/);
 const source=read('components/FlowerCornerGuide.tsx');assert.match(source,/onClose=\{\(\) => setExtra\(null\)\}/);assert.match(source,/aria-haspopup="dialog"/);
 assert.match(source,/<PlantCareIllustrations profile=\{profile\}/);assert.doesNotMatch(source,/setExtra\('techniques'\)|CareExplanation|flower-guides\/care.webp/);
});

test('server route supports direct refresh for each ID and rejects unknown IDs',async()=>{
 const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');const {createRequire}=await import('node:module');const vm=await import('node:vm');const ts=await import('typescript');
 const require=createRequire(import.meta.url),exports={};
 const js=ts.default.transpileModule(read('app/flower-corner/[plantId]/page.tsx'),{compilerOptions:{jsx:ts.default.JsxEmit.ReactJSX,module:ts.default.ModuleKind.CommonJS,target:ts.default.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.default.runInNewContext(js,{exports,require:id=>{
  if(id==='next/link')return function Link({href,children}){return React.createElement('a',{href},children);};
  if(id==='next/navigation')return {notFound:()=>{throw new Error('NOT_FOUND');}};
  if(id==='@/lib/flower-corner-library')return {flowerCornerProfiles};
  if(id==='@/lib/flower-corner-navigation')return {safeFlowerCornerReturn};
  if(id==='@/lib/flower-corner-classification')return classification;
  if(id==='@/lib/seasons')return {getSeason:()=> 'spring'};
  if(id==='@/components/seasonal/SeasonProvider')return function Season({children}){return children;};
  if(id==='@/components/FlowerCornerGuide')return function Guide({profile,returnTo}){return React.createElement('div',{'data-plant':profile.id,'data-return':returnTo},profile.name);};
  return require(id);
 }});
 for(const profile of flowerCornerProfiles){
  const props={params:Promise.resolve({plantId:profile.id}),searchParams:Promise.resolve({returnTo:'/?view=flower-corner&q=blue&kind=flower'})};
  const metadata=await exports.generateMetadata(props);assert.equal(metadata.title,`${profile.name} growing guide · Flower Corner`);
  const html=renderToStaticMarkup(await exports.default(props));assert.ok(html.includes(`data-plant="${profile.id}"`));assert.match(html,/data-return="\/\?view=flower-corner&amp;q=blue&amp;kind=flower"/);
 }
 await assert.rejects(exports.default({params:Promise.resolve({plantId:'not-a-plant'}),searchParams:Promise.resolve({})}),/NOT_FOUND/);
});


test('guide header places large native artwork directly beside its semantic title',()=>{
 const source=read('components/FlowerCornerGuide.tsx'),css=read('app/globals.css');
 assert.match(source,/className="corner-guide-portrait"><FlowerCornerPortrait profile=\{profile\} variant="guide"/);
 assert.match(source,/className="corner-guide-copy"/);assert.doesNotMatch(source,/max-w-\[280px\]/);
 assert.match(css,/\.corner-guide-header\{display:grid;grid-template-columns:minmax\(0,450px\)/);
 assert.match(source,/care illustrations show botanical examples/);assert.doesNotMatch(source,/care drawings are simplified schematics/);
});

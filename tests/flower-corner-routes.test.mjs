import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeFlowerCornerReturn} from '../lib/flower-corner-navigation.ts';
import {flowerCornerProfiles} from '../lib/flower-corner-library.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('guide return links preserve only safe Library filters',()=>{
 assert.equal(safeFlowerCornerReturn('/flower-corner?q=blue+flower&kind=flower&light=sun'),'/flower-corner?q=blue+flower&kind=flower&light=sun');
 assert.equal(safeFlowerCornerReturn('/?view=flower-corner&q=hosta&kind=foliage'), '/?view=flower-corner&q=hosta&kind=foliage');
 for(const url of ['https://evil.invalid/','//evil.invalid/','/\\evil.invalid/','javascript:alert(1)','/settings','/?view=settings',undefined,['/flower-corner']])assert.equal(safeFlowerCornerReturn(url),'/flower-corner');
 assert.equal(safeFlowerCornerReturn('/flower-corner?secret=not-public&kind=bogus#private'),'/flower-corner');
});

test('dedicated route validates every plant ID and has metadata without account access',()=>{
 const route=read('app/flower-corner/[plantId]/page.tsx');
 assert.match(route,/params: Promise/);assert.match(route,/await params/);assert.match(route,/await searchParams/);
 assert.match(route,/notFound\(\)/);assert.match(route,/generateMetadata/);assert.match(route,/safeFlowerCornerReturn/);
 assert.doesNotMatch(route,/supabase|userId|readGuest|photoUrl/);
 assert.equal(new Set(flowerCornerProfiles.map(p=>p.id)).size,45);
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
  if(id==='@/lib/flower-corner-editorial')return editorial;
  if(id==='@/lib/flower-garden-art')return art;
  if(id==='@/lib/flower-corner-navigation')return {safeFlowerCornerReturn};
  if(id.startsWith('@/components/'))return ()=>null;
  return require(id);
 }});
 return p=>renderToStaticMarkup(React.createElement(exports.default,{profile:p,returnTo:'/flower-corner?q=test'}));
}

test('all45 guide pages render full facts outside a modal',async()=>{
 const render=await loadGuide();
 for(const p of flowerCornerProfiles){const html=render(p);
  assert.doesNotMatch(html,/<dialog/);assert.equal((html.match(/<h1>/g)||[]).length,1);
  for(const label of ['Start indoors','Germination','Sowing to blooms','Feeding','Common problems','Bouquet use','Seed saving'])assert.ok(html.includes(label),p.id+' '+label);
  assert.match(html,/Back to Library/);assert.match(html,/href="\/flower-corner\?q=test"/);
  assert.ok(html.includes(p.reviewed));
 }
});

test('only additional care and guide explanations use closable shared dialogs',async()=>{
 for(const extra of ['techniques','notes']){const render=await loadGuide(extra);const html=render(flowerCornerProfiles[0]);
  assert.equal((html.match(/<dialog/g)||[]).length,1);assert.match(html,extra==='techniques'?/Three different cuts/:/About this growing guide/);
 }
 const source=read('components/FlowerCornerGuide.tsx');assert.match(source,/onClose=\{\(\) => setExtra\(null\)\}/);assert.match(source,/aria-haspopup="dialog"/);
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

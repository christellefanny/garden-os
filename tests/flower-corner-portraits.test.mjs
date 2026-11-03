import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {flowerCornerProfiles} from '../lib/flower-corner-library.ts';
import * as flowerArt from '../lib/flower-garden-art.ts';
import * as vaultArt from '../lib/vault-botanical-art.ts';
import {flowerCornerArt} from '../lib/flower-corner-art.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

async function loadPortrait(failedSources=[]){
 const RealReact=await import('react');const React={...RealReact,useState:()=>[failedSources,()=>{}]};
 const {renderToStaticMarkup}=await import('react-dom/server');const {createRequire}=await import('node:module');const vm=await import('node:vm');const ts=await import('typescript');
 const require=createRequire(import.meta.url),exports={};
 const js=ts.default.transpileModule(read('components/FlowerCornerPortrait.tsx'),{compilerOptions:{jsx:ts.default.JsxEmit.ReactJSX,module:ts.default.ModuleKind.CommonJS,target:ts.default.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 vm.default.runInNewContext(js,{exports,require:id=>{
  if(id==='react')return React;
  if(id==='next/image')return function MockImage({src,alt,width,height,className,style,sizes}){return React.createElement('img',{src,alt,width,height,className,style,sizes});};
  if(id==='@/lib/flower-corner-art')return {flowerCornerArt};
  if(id==='@/lib/flower-garden-art')return flowerArt;
  if(id==='@/lib/vault-botanical-art')return vaultArt;
  return require(id);
 }});
 return {exports,render:(profile,variant='card')=>renderToStaticMarkup(React.createElement(exports.default,{profile,variant}))};
}

test('individual exact-match artwork is preferred over sprite cells without inventing URLs',async()=>{
 const {exports}=await loadPortrait();
 for(const profile of flowerCornerProfiles){
  const native=exports.getNativeCornerPortrait(profile);
  if(native){assert.ok(existsSync('public'+native.src),profile.id);assert.ok(native.width>=512,profile.id);assert.ok(native.height>=512,profile.id);}
  else{const name=profile.artName||profile.name;const art=flowerArt.getFlowerGardenArt(name)||vaultArt.getVaultBotanicalArt(name,profile.artVariety||'');assert.ok(art,profile.id);assert.ok(existsSync('public'+art.src),profile.id);}
  if(flowerCornerArt[profile.id])assert.equal(native,flowerCornerArt[profile.id],profile.id);
 }
 const dahlia=flowerCornerProfiles.find(profile=>profile.id==='dahlias');assert.equal(exports.getNativeCornerPortrait(dahlia).src,'/layout-inspiration/dahlia-transparent.webp');
 const hosta=flowerCornerProfiles.find(profile=>profile.id==='hosta');assert.equal(exports.getNativeCornerPortrait(hosta),null);
});

test('guide native portraits grow to450px while cards stay300px and sprites never exceed313px',async()=>{
 const {render}=await loadPortrait();
 const dahlia=flowerCornerProfiles.find(profile=>profile.id==='dahlias'),daffodil=flowerCornerProfiles.find(profile=>profile.id==='daffodils'),hosta=flowerCornerProfiles.find(profile=>profile.id==='hosta');
 for(const native of [dahlia,daffodil]){
  const detail=render(native,'guide');assert.match(detail,/max-width:450px/);assert.match(detail,/data-art-kind="individual"/);assert.match(detail,/450px/);
  assert.match(render(native),/max-width:300px/);
 }
 const sprite=render(hosta,'guide');assert.match(sprite,/max-width:313px/);assert.match(sprite,/data-art-kind="sprite"/);assert.doesNotMatch(sprite,/max-width:450px/);
 const source=read('components/FlowerCornerPortrait.tsx');assert.match(source,/quality=\{90\}/);assert.match(source,/unoptimized/);assert.match(source,/width=\{1254\} height=\{1254\}/);assert.doesNotMatch(source,/photoUrl|supabase/);
});

test('six exact profile cutouts are512px with real alpha and never masked at their edges',async()=>{
 const {exports,render}=await loadPortrait();
 const sharp=(await import('sharp')).default;
 assert.deepEqual(Object.keys(exports.transparentCornerPortraits).sort(),['alyssum','cosmos','dahlias','lisianthus','snapdragons','zinnias']);
 for(const [id,path] of Object.entries(exports.transparentCornerPortraits)){
  const profile=flowerCornerProfiles.find(p=>p.id===id),native=exports.getNativeCornerPortrait(profile);
  assert.equal(native.src,path);assert.equal(native.width,512);assert.equal(native.height,512);
  const metadata=await sharp('public'+path).metadata();assert.equal(metadata.width,512);assert.equal(metadata.height,512);assert.equal(metadata.hasAlpha,true);
  const stats=await sharp('public'+path).stats();assert.equal(stats.channels[3].min,0);assert.equal(stats.channels[3].max,255);
  const html=render(profile,'guide');assert.match(html,/data-art-background="transparent"/);assert.match(html,/max-width:450px/);
 }
 const css=read('app/globals.css');assert.match(css,/\[data-art-background="transparent"\] \.corner-portrait-image\{mask-image:none/);
 assert.match(css,/\[data-art-background="paper"\] \.corner-portrait-image\{mask-image:radial-gradient\(ellipse/);
});

test('failed transparent portraits fall back to individual paintings, capped sprites, then an unavailable state',async()=>{
 const dahlia=flowerCornerProfiles.find(profile=>profile.id==='dahlias');
 const transparent='/layout-inspiration/dahlia-transparent.webp',paper='/cut-flowers/dahlias.webp';
 const failedCutout=await loadPortrait([transparent]);const paperFallback=failedCutout.render(dahlia,'guide');
 assert.match(paperFallback,/src="\/cut-flowers\/dahlias.webp"/);assert.match(paperFallback,/data-art-background="paper"/);assert.match(paperFallback,/max-width:450px/);
 const failedNative=await loadPortrait([transparent,paper]);const spriteFallback=failedNative.render(dahlia,'guide');
 assert.match(spriteFallback,/data-art-kind="sprite"/);assert.match(spriteFallback,/max-width:313px/);assert.match(spriteFallback,/Watercolor illustration of Dahlias/);
 const sprite=flowerArt.getFlowerGardenArt('Dahlias');const allFailed=await loadPortrait([transparent,paper,sprite.src]);
 assert.match(allFailed.render(dahlia,'guide'),/Illustration unavailable/);
});

test('portrait labels disclose related and cultivar-specific artwork',()=>{
 const source=read('components/FlowerCornerPortrait.tsx');
 for(const id of ['daffodils','china-asters','perennial-asters','pansies','violas'])assert.ok(flowerCornerArt[id],id);
 assert.notEqual(flowerCornerArt['china-asters'].src,flowerCornerArt['perennial-asters'].src);assert.notEqual(flowerCornerArt.pansies.src,flowerCornerArt.violas.src);
 assert.match(source,/other varieties may differ/);assert.match(source,/No verified illustration yet/);assert.match(source,/onError/);
});

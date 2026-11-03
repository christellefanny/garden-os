import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {flowerCornerProfiles} from '../lib/flower-corner-library.ts';
import {getFlowerGardenArt} from '../lib/flower-garden-art.ts';
import {getVaultBotanicalArt} from '../lib/vault-botanical-art.ts';
import {flowerCornerArt} from '../lib/flower-corner-art.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Flower Corner keeps sprite sources native and serves individual portraits at high quality',()=>{
 const source=read('components/FlowerCornerPortrait.tsx');
 assert.match(source,/unoptimized/);
 assert.match(source,/sizes="300px" quality=\{90\}/);
 assert.match(source,/maxWidth: 300/);
 assert.match(source,/width=\{1254\} height=\{1254\}/);
 assert.doesNotMatch(source,/\/cut-flowers\/|photoUrl|supabase/);
 for(const p of flowerCornerProfiles){
  if(flowerCornerArt[p.id]){assert.ok(existsSync("public"+flowerCornerArt[p.id].src));assert.ok(flowerCornerArt[p.id].width>=1000);continue;}
  const name=p.artName||p.name;
  const art=getFlowerGardenArt(name)||getVaultBotanicalArt(name,p.artVariety||'');
  assert.ok(art,p.id);
  assert.ok(existsSync('public'+art.src),p.id);
 }
});
test('portrait labels disclose related and cultivar-specific artwork',()=>{
 const source=read('components/FlowerCornerPortrait.tsx');
 for(const id of ['daffodils','china-asters','perennial-asters','pansies','violas'])assert.ok(flowerCornerArt[id],id);
 assert.notEqual(flowerCornerArt['china-asters'].src,flowerCornerArt['perennial-asters'].src);assert.notEqual(flowerCornerArt.pansies.src,flowerCornerArt.violas.src);
 assert.match(source,/other varieties may differ/);
 assert.match(source,/No verified illustration yet/);
 assert.match(source,/onError/);
});

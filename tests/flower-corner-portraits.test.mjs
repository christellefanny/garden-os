import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {flowerCornerProfiles} from '../lib/flower-corner-library.ts';
import {getFlowerGardenArt} from '../lib/flower-garden-art.ts';
import {getVaultBotanicalArt} from '../lib/vault-botanical-art.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Flower Corner keeps original watercolor sources without lossy optimizer resizing',()=>{
 const source=read('components/FlowerCornerPortrait.tsx');
 assert.match(source,/unoptimized/);
 assert.match(source,/maxWidth: 300/);
 assert.match(source,/width=\{1254\} height=\{1254\}/);
 assert.doesNotMatch(source,/\/cut-flowers\/|photoUrl|supabase/);
 for(const p of flowerCornerProfiles){
  const name=p.artName||p.name;
  const art=getFlowerGardenArt(name)||getVaultBotanicalArt(name,p.artVariety||'');
  if(!art){assert.equal(p.id,'daffodils');continue;}
  assert.ok(existsSync('public'+art.src),p.id);
 }
});
test('portrait labels disclose related and cultivar-specific artwork',()=>{
 const source=read('components/FlowerCornerPortrait.tsx');
 assert.match(source,/Related pansy illustration/);
 assert.match(source,/other varieties may differ/);
 assert.match(source,/No verified illustration yet/);
 assert.match(source,/onError/);
});

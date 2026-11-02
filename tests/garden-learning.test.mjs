import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {beginnerGuides,flowerProfiles} from '../lib/garden-learning.ts';
import {getFlowerGardenArt} from '../lib/flower-garden-art.ts';
import {getVaultBotanicalArt} from '../lib/vault-botanical-art.ts';

test('every published learning entry has an institutional source and a unique identity',()=>{
 const entries=[...beginnerGuides,...flowerProfiles];
 assert.equal(new Set(entries.map(e=>e.id)).size,entries.length);
 for(const entry of entries){
  const sources='sources' in entry?entry.sources:[entry.source];
  assert.ok(sources.length>0,entry.id);
  for(const source of sources){const url=new URL(source.url);assert.equal(url.protocol,'https:');assert.ok(url.hostname.endsWith('.edu')||url.hostname.endsWith('.usda.gov'),entry.id);}
 }
});
test('learning portraits resolve to existing approved artwork without broken fallbacks',()=>{
 for(const profile of flowerProfiles){
  const art=getFlowerGardenArt(profile.art)||getVaultBotanicalArt(profile.art);
  assert.ok(art,profile.name);assert.ok(existsSync(`public${art.src}`),profile.name);
 }
});

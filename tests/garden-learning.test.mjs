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
  const institutional=url=>url.hostname.endsWith('.edu')||url.hostname.endsWith('.usda.gov');
  assert.ok(sources.some(source=>institutional(new URL(source.url))),entry.id);
  for(const source of sources){
   const url=new URL(source.url);
   assert.equal(url.protocol,'https:');
   // A reviewed public frost lookup supplements the institutional advice.
   assert.ok(institutional(url)||source.url==='https://www.almanac.com/gardening/frostdates',entry.id);
  }
 }
});

test('timing explains opposite winter climates without turning zones into planting dates',()=>{
 const guide=beginnerGuides.find(guide=>guide.id==='timing');
 assert.ok(guide);
 const copy=[guide.intro,...guide.steps,guide.mistake].join(' ');
 for(const term of ['Zone 4','Zone 10','−30 to −20°F','30 to 40°F','Echinacea purpurea','Hibiscus rosa-sinensis'])assert.ok(copy.includes(term),term);
 assert.match(copy,/average coldest temperature/);
 assert.match(copy,/does not guarantee survival/);
 assert.match(copy,/summer heat/);
 assert.match(copy,/last spring frost and first fall frost/);
 assert.match(copy,/historical weather-station data, not your hardiness zone/);
 assert.match(copy,/current forecast/);
 assert.match(copy,/packet or plant label/);
 assert.ok(guide.sources.some(source=>source.url==='https://planthardiness.ars.usda.gov/'&&/ZIP code/.test(source.title)));
 assert.ok(guide.sources.some(source=>source.url==='https://www.almanac.com/gardening/frostdates'&&/first and last frost/.test(source.title)));
 assert.ok(guide.sources.some(source=>source.url==='https://plants.ces.ncsu.edu/plants/echinacea-purpurea/'));
 assert.ok(guide.sources.some(source=>source.url==='https://plants.ces.ncsu.edu/plants/hibiscus-rosa-sinensis/'));
});

test('essentials gives a bounded shopping example, fill quantities and separate seed and plant routes',()=>{
 const guide=beginnerGuides.find(guide=>guide.id==='essentials');
 assert.ok(guide);
 const copy=guide.steps.join(' ');
 for(const term of ['2 containers','drainage holes','2 garden-ready','1 watering can','1 hand trowel','2 labels','20 L','40 L','1.4 cubic feet','1 packet','Small plugs','8 cubic feet','soil test','Optional for now'])assert.ok(copy.includes(term),term);
 assert.match(copy,/Root balls and space below the rim/);
 assert.match(copy,/Match each plant’s mature size and root space/);
 assert.match(copy,/do not add a gravel layer/);
 assert.match(copy,/Do not add fertilizer automatically/);
 assert.match(copy,/You do not need to sow the whole packet/);
 assert.match(copy,/Confirm the depth your chosen plants need/);
});

test('refined guides preserve existing checklist keys and order',()=>{
 assert.deepEqual(beginnerGuides.map(guide=>guide.id),['space','timing','soil','essentials','planting','care']);
 assert.deepEqual(beginnerGuides.find(guide=>guide.id==='timing').checklist,['Find your winter hardiness zone','Look up local frost guidance','Read each plant’s timing instructions']);
 assert.deepEqual(beginnerGuides.find(guide=>guide.id==='essentials').checklist,['List only what this garden needs','Reuse suitable containers','Check mature size before purchasing']);
});
test('learning portraits resolve to existing approved artwork without broken fallbacks',()=>{
 for(const profile of flowerProfiles){
  const art=getFlowerGardenArt(profile.art)||getVaultBotanicalArt(profile.art);
  assert.ok(art,profile.name);assert.ok(existsSync(`public${art.src}`),profile.name);
 }
});

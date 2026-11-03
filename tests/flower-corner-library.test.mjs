import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {flowerCornerProfiles,flowerCornerReviewed} from '../lib/flower-corner-library.ts';
import {flowerProfiles} from '../lib/garden-learning.ts';
import {getFlowerGardenArt} from '../lib/flower-garden-art.ts';
import {getVaultBotanicalArt} from '../lib/vault-botanical-art.ts';
import {flowerCornerArt} from '../lib/flower-corner-art.ts';

const byId = id => flowerCornerProfiles.find(profile => profile.id === id);
test('Flower Corner retains every original learning flower and expands foliage and shade coverage',()=>{
  assert.equal(flowerCornerProfiles.length,55);
  assert.equal(new Set(flowerCornerProfiles.map(p=>p.id)).size,flowerCornerProfiles.length);
  for(const old of flowerProfiles) assert.ok(byId(old.id),old.id);
  assert.equal(byId('heuchera').kind,'foliage');
  assert.equal(byId('hosta').kind,'foliage');
});
test('each public profile has substantive growing fields and institutional evidence',()=>{
  const fields=['name','botanical','summary','light','water','spacing','matureSize','indoorStart','directSow','transplant','germination','sowToBloom','pinching','deadheading','cutback','feeding','problems','bouquet','seedSaving'];
  assert.match(flowerCornerReviewed,/^\d{4}-\d{2}-\d{2}$/);
  for(const profile of flowerCornerProfiles){
    for(const key of fields) assert.ok(typeof profile[key]==='string' && profile[key].trim().length>=(key==='name'?3:8),`${profile.id}.${key}`);
    assert.ok(profile.notes.length>=2,profile.id);
    assert.equal(profile.reviewed,flowerCornerReviewed);
    assert.ok(profile.sources.length>=2,profile.id);
    for(const source of profile.sources){
      const url=new URL(source.url);
      assert.equal(url.protocol,'https:');
      assert.ok(url.hostname.endsWith('.edu')||['www.rhs.org.uk','www.johnnyseeds.com','johnnyseeds.com','www.panamseed.com','www.tnipc.org','tnipc.org','txmg.org','dallascountymastergardeners.org','libguides.nybg.org','www.adaptiveseeds.com','www.ballseed.com','www.chicagobotanic.org'].includes(url.hostname),source.url);
      assert.ok(source.title.length>10);
      assert.ok((!url.search || (url.hostname==='www.tnipc.org'&&url.search==='?id=103')) && !url.hash,'no private link tokens in public data');
    }
  }
});
test('every library portrait has a real artwork file',()=>{
  for(const profile of flowerCornerProfiles){
    if(flowerCornerArt[profile.id]){assert.ok(existsSync(new URL("../public"+flowerCornerArt[profile.id].src,import.meta.url)));continue;}
    assert.ok(profile.artName,profile.id);
    const art=getFlowerGardenArt(profile.artName)||getVaultBotanicalArt(profile.artName,profile.artVariety);
    assert.ok(art,profile.artName);
    assert.ok(existsSync(`public${art.src}`),profile.artName);
  }
});
test('timing distinguishes seedlings, tubers, flowers and foliage',()=>{
  assert.match(byId('zinnias').sowToBloom,/8–12 weeks/);
  assert.match(byId('alyssum').sowToBloom,/6–8 weeks/);
  assert.match(byId('lisianthus').sowToBloom,/5 months/);
  assert.match(byId('sunflowers').sowToBloom,/50–95 days.*single-stem/);
  assert.match(byId('calendula').sowToBloom,/does not clearly define/);
  assert.match(byId('dahlias').germination,/not a tuber/);
  assert.match(byId('rudbeckia').germination,/genus-level/);
  for(const id of ['heuchera','hosta']){
    assert.match(byId(id).germination,/divisions/i);
    assert.match(byId(id).sowToBloom,/foliage|leaves/i);
  }
});
test('pruning instructions do not blindly pinch or shear every species',()=>{
  assert.match(byId('sunflowers').pinching,/Do not pinch single-stem/);
  assert.match(byId('dahlias').pinching,/3–4 pairs/);
  assert.match(byId('hosta').cutback,/not routinely shear healthy leaves/);
  assert.match(byId('heuchera').cutback,/not routinely shear healthy evergreen/);
  for(const profile of flowerCornerProfiles){
    assert.notEqual(profile.pinching,profile.deadheading);
    assert.notEqual(profile.deadheading,profile.cutback);
  }
});
test('library preserves safety and species distinctions',()=>{
  assert.match(byId('dahlias').notes.join(' '),/Sap.*irritate/);
  assert.match(byId('marigolds').notes.join(' '),/skin|food-safe/);
  assert.match(byId('hosta').notes.join(' '),/toxic.*cats.*dogs.*horses/);
  assert.match(byId('rudbeckia').notes.join(' '),/R\. fulgida/);
  assert.match(byId('sunflowers').notes.join(' '),/not perennial/);
  assert.match(byId('snapdragons').notes.join(' '),/Rust/);
  assert.match(byId('lisianthus').notes.join(' '),/cankers/);
});


test('every featured cut flower has a full Library profile',async()=>{
 const {cornerCutFlowers}=await import('../lib/flower-corner-editorial.ts');
 for(const flower of cornerCutFlowers){
  assert.ok(flowerCornerProfiles.some(p=>p.artName===flower.name||p.name===flower.name),flower.name);
 }
});
test('seasonal and seed-saving flowers have full Library coverage',()=>{
 for(const id of ['pansies','violas','daffodils','nasturtium'])assert.ok(byId(id),id);
 for(const p of flowerCornerProfiles){
  assert.ok(p.feeding.length>25,p.id+' feeding');
  assert.ok(p.problems.length>25,p.id+' problems');
  assert.ok(p.bouquet.length>25,p.id+' bouquet');
  assert.ok(p.seedSaving.length>25,p.id+' seedSaving');
 }
});

test('expanded catalog keeps species and cultivar safety distinctions',()=>{
 assert.match(JSON.stringify(byId('ammi-majus')),/skin|photo|sunlight/i);
 assert.match(byId('larkspur').notes.join(' '),/toxic|poison/i);
 assert.match(byId('sweet-peas').notes.join(' '),/toxic|poison/i);
 assert.match(byId('daffodils').cutback,/brown|dead/i);
 assert.match(byId('daffodils').notes.join(' '),/poison/i);
 assert.match(byId('chantilly-snapdragons').botanical,/Chantilly/);
 assert.match(byId('rudbeckia-sahara').botanical,/Sahara/);
});

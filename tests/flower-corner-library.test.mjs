import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {flowerCornerProfiles,flowerCornerReviewed} from '../lib/flower-corner-library.ts';
import {flowerProfiles} from '../lib/garden-learning.ts';
import {getFlowerGardenArt} from '../lib/flower-garden-art.ts';
import {getVaultBotanicalArt} from '../lib/vault-botanical-art.ts';

const byId = id => flowerCornerProfiles.find(profile => profile.id === id);
test('Flower Corner retains every original learning flower and adds two foliage profiles',()=>{
  assert.equal(flowerCornerProfiles.length,12);
  assert.equal(new Set(flowerCornerProfiles.map(p=>p.id)).size,12);
  for(const old of flowerProfiles) assert.ok(byId(old.id),old.id);
  assert.equal(byId('heuchera').kind,'foliage');
  assert.equal(byId('hosta').kind,'foliage');
});
test('each public profile has substantive growing fields and institutional evidence',()=>{
  const fields=['name','botanical','summary','light','water','spacing','matureSize','indoorStart','directSow','transplant','germination','sowToBloom','pinching','deadheading','cutback'];
  assert.match(flowerCornerReviewed,/^\d{4}-\d{2}-\d{2}$/);
  for(const profile of flowerCornerProfiles){
    for(const key of fields) assert.ok(typeof profile[key]==='string' && profile[key].trim().length>=(key==='name'?3:8),`${profile.id}.${key}`);
    assert.ok(profile.notes.length>=2,profile.id);
    assert.equal(profile.reviewed,flowerCornerReviewed);
    assert.ok(profile.sources.length>=2,profile.id);
    for(const source of profile.sources){
      const url=new URL(source.url);
      assert.equal(url.protocol,'https:');
      assert.ok(url.hostname.endsWith('.edu'),source.url);
      assert.ok(source.title.length>10);
      assert.ok(!url.search && !url.hash,'no private link tokens in public data');
    }
  }
});
test('every library portrait reuses an existing approved artwork file',()=>{
  for(const profile of flowerCornerProfiles){
    assert.ok(profile.artName,profile.id);
    const art=getFlowerGardenArt(profile.artName)||getVaultBotanicalArt(profile.artName);
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

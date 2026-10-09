import assert from "node:assert/strict";
import {test} from "node:test";
import {readVaultBackup,mergeVaultPlants} from "../lib/vault-transfer.ts";
const plant={id:"one",name:"Tulips",variety:"",category:"Flower",statuses:["Have Seeds"],source:"",year:"",notes:"Keep these notes",photoUrl:"https://example.com/tulips.jpg"};
test("backup round trip preserves fields and rejects invalid files",()=>{
  assert.deepEqual(readVaultBackup(JSON.stringify({garden_os_plant_vault:1,plants:[plant]})),[plant]);
  for(const plants of [[null],[{...plant,statuses:[1]}],[plant,plant]])assert.throws(()=>readVaultBackup(JSON.stringify({garden_os_plant_vault:1,plants})));
  assert.throws(()=>readVaultBackup('{"plants":[]}'));
});
test("repeat imports are idempotent and preserve both notes and statuses",()=>{
  const incoming={...plant,id:"other",statuses:["Wishlist"],notes:"New planting notes"};
  const once=mergeVaultPlants([plant],[incoming]);const twice=mergeVaultPlants(once.plants,[incoming]);
  assert.equal(once.added,0);assert.deepEqual(twice.plants,once.plants);assert.equal(once.plants[0].notes,"Keep these notes\n\nNew planting notes");assert.deepEqual(once.plants[0].statuses,["Have Seeds","Wishlist"]);assert.equal(plant.notes,"Keep these notes");
});
test("colliding IDs on different plants do not replace records",()=>{
  const result=mergeVaultPlants([plant],[{...plant,name:"Salvia"}]);assert.equal(result.added,1);assert.equal(result.plants.length,2);assert.notEqual(result.plants[0].id,result.plants[1].id);
});

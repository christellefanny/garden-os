import { test } from "node:test";
import assert from "node:assert/strict";
import { plantChoices, inferPlantFilter } from "../lib/plant-picker.ts";
import { connectGardenPlants } from "../lib/connected-garden.ts";
const vault = [{id:"saved",name:"Tomato",variety:"Roma",category:"Vegetable",statuses:[],source:"",year:"",notes:""},{id:"flower",name:"Dianthus",variety:"Paint the Town",category:"Flower",statuses:[],source:"",year:"",notes:""}];
const details = {garden_os:1,notes:"",plants:[],entries:[]};
test("automatic category gives bed context priority and stays broad for ambiguous gardens", () => {
  assert.equal(inferPlantFilter({name:"Flower border"},details,"Vegetable Garden",vault),"Flower");
  assert.equal(inferPlantFilter({name:"Bed 1"},details,"Vegetable Garden",vault),"Vegetable");
  assert.equal(inferPlantFilter({name:"Bed 1"},details,"Front Yard",vault),"All");
  assert.equal(inferPlantFilter({name:"Bed 1"},{...details,plants:[{name:"Tomato",vaultPlantId:"saved",status:"Growing"}]},"Front Yard",vault),"Vegetable");
  assert.equal(inferPlantFilter({name:"Mixed"},{...details,plants:[{name:"Tomato",vaultPlantId:"saved",status:"Growing"},{name:"Dianthus",vaultPlantId:"flower",status:"Growing"}]},"Front Yard",vault),"All");
});
test("picker filters both sources, searches varieties and offers plants outside the Vault", () => {
  const flowers=plantChoices(vault,"Flower");
  assert.ok(flowers.every(p=>p.category==="Flower"));
  assert.ok(flowers.some(p=>p.source==="vault" && p.name==="Dianthus"));
  assert.ok(flowers.some(p=>p.source==="catalog" && p.name==="Tulip"));
  assert.equal(plantChoices(vault,"Vegetable","roma")[0].id,"vault:saved");
  assert.ok(plantChoices(vault,"All").some(p=>p.category==="Herb"));
});
test("catalog plants keep their category and reuse the same connected record", () => {
  const input={...details,plants:[{id:"p",name:"Dianthus",variety:"",category:"Flower",quantity:1,spacing:12,planted:"",status:"Growing"}]};
  const first=connectGardenPlants(input,[],()=>"new");
  assert.equal(first.vault[0].category,"Flower");
  const next=connectGardenPlants(first.details,first.vault,()=>{throw Error("duplicate")});
  assert.equal(next.vault.length,1);
  assert.equal(next.details.plants[0].vaultPlantId,"new");
  const linked=connectGardenPlants({...details,plants:[{...input.plants[0],name:"Tomato",variety:"Roma",vaultPlantId:"saved"}]},vault,()=>{throw Error("duplicate")});
  assert.equal(linked.vault.length,2);
  assert.equal(linked.details.plants[0].vaultPlantId,"saved");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { plantChoices, inferPlantFilter, resolvePlantCategory } from "../lib/plant-picker.ts";
import { connectGardenPlants } from "../lib/connected-garden.ts";
import { getVegetableSoilProfile } from "../lib/vegetable-soil.ts";
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

test("custom renames save and reopen with the same correctly scoped soil guidance", () => {
  const base = {id:"p",variety:"",quantity:1,spacing:12,planted:"",status:"Growing"};
  for (const [before, after, expectedCategory, hasSoilProfile] of [
    [{name:"Sunflower",category:"Flower"}, "Tomato", "Vegetable", true],
    [{name:"Tomato",category:"Vegetable"}, "Sunflower", "Flower", false],
    [{name:"Tomato",category:"Vegetable"}, "Mystery plant", undefined, false],
  ]) {
    const category = resolvePlantCategory(after, undefined, before);
    assert.equal(category, expectedCategory);
    const editingProfile = getVegetableSoilProfile(after, category);
    const saved = {...base, name:after, category};
    const reloaded = JSON.parse(JSON.stringify({...details, plants:[saved]}));
    const connected = connectGardenPlants(reloaded, [], () => "renamed-vault-plant");
    assert.equal(connected.vault[0].category, expectedCategory || "Other");
    const reopened = connected.details.plants[0];
    assert.equal(Boolean(getVegetableSoilProfile(reopened.name, reopened.category)), hasSoilProfile);
    assert.equal(getVegetableSoilProfile(reopened.name, reopened.category)?.id, editingProfile?.id);
    assert.equal(Boolean(getVegetableSoilProfile(connected.vault[0].name, connected.vault[0].category)), hasSoilProfile);
  }
});

test("unchanged names retain explicit categories and unrelated selections cannot leak them", () => {
  assert.equal(resolvePlantCategory(" Tomato ", undefined, {name:"Tomato", category:"Flower"}), "Flower");
  assert.equal(resolvePlantCategory("Mystery", {name:"Mystery", category:"Vegetable"}), "Vegetable");
  assert.equal(resolvePlantCategory("Tomato", {name:"Sunflower", category:"Flower"}), "Vegetable");
  assert.equal(resolvePlantCategory("Mystery", {name:"Sunflower", category:"Flower"}), undefined);
});

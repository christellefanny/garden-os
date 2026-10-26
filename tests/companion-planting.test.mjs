import { test } from "node:test";
import assert from "node:assert/strict";
import { companionProfile, companionGuidance, checkCompanionBed, companionRules, companionNotes, companionSources } from "../lib/companion-planting.ts";
const plant = (name, status = "Growing", id = name) => ({ id, name, status });
test("names cover saved variants without confusing different plants", () => {
  for (const name of ["Tomatoes", "Cherry Tomato", "Tomato - container"]) assert.equal(companionProfile(name)?.id, "tomato");
  for (const name of ["Habanero", "Hungarian Hot Wax Pepper", "Bell Peppers"]) assert.equal(companionProfile(name)?.id, "pepper");
  assert.equal(companionProfile("Sweet Potatoes")?.id, "sweet-potato");
  assert.equal(companionProfile("Catmint"), undefined);
  assert.equal(companionProfile("Wildflower blend"), undefined);
  assert.equal(companionProfile("Mint mixture"), undefined);
  assert.equal(companionGuidance("Dahlia").relationships.length, 0);
});
test("pairing lookup is symmetric and gives sources and conditions", () => {
  const forward = companionGuidance("Tomato").relationships.find(r => r.companion === "Basil");
  const reverse = companionGuidance("Basil").relationships.find(r => r.companion === "Tomato");
  assert.equal(forward.id, reverse.id);
  assert.equal(forward.kind, "benefit");
  assert.ok(forward.sources.length);
  assert.ok(companionGuidance("Mint").containment);
});
test("bed checks de-duplicate pairs, ignore finished plants, and do not invent conflicts", () => {
  const plants = [plant("Tomatoes"), plant("Tomato", "Planned", "second"), plant("Potatoes", "Planned"), plant("Basil"), plant("Rosemary", "Finished"), plant("Mystery flower")];
  const result = checkCompanionBed(plants);
  assert.deepEqual(result.matches.map(r => r.id).sort(), ["tomato-basil", "tomato-potato"]);
  assert.deepEqual(result.unknown, ["Mystery flower"]);
  assert.equal(checkCompanionBed([plant("Tomato"), plant("Sweet Potato")]).matches.length, 0);
  assert.equal(checkCompanionBed([plant("Potato", "Finished"), plant("Tomato")]).matches.length, 0);
  assert.equal(checkCompanionBed([plant("Mint", "Finished")]).mint, false);
  assert.equal(checkCompanionBed([plant("Mint", "Planned")]).mint, true);
});

test("chart aliases do not confuse maize, brinjal, coriander or pot marigold", () => {
  assert.equal(companionProfile("Maize")?.id, "corn");
  assert.equal(companionProfile("Brinjal")?.id, "eggplant");
  assert.equal(companionProfile("Coriander")?.id, "cilantro");
  assert.equal(companionProfile("Pot Marigold")?.id, "calendula");
  assert.equal(companionProfile("Russian sage"), undefined);
  assert.equal(companionGuidance("Calendula").notes.length, 0);
  assert.ok(companionGuidance("French Marigold").notes.some(n => n.id === "marigold-nematodes"));
});
test("supplements stay crop-specific and do not turn conflicting chart claims into warnings", () => {
  const result = checkCompanionBed([plant("Cabbage"), plant("Onion"), plant("Marigold")]);
  assert.deepEqual(result.matches.map(r => r.id).sort(), ["cabbage-marigold", "cabbage-onion"]);
  assert.equal(checkCompanionBed([plant("Kale"), plant("Sage")]).matches.length, 0);
  assert.equal(checkCompanionBed([plant("Brussels Sprouts"), plant("Sage")]).matches[0].id, "brussels-sage");
  for (const names of [["Marigold","Bean"],["Pepper","Cabbage"],["Lettuce","Parsley"]]) {
    assert.equal(checkCompanionBed(names.map(n => plant(n))).matches.length, 0);
  }
});
test("support guidance includes its conditions and habitat advice stays out of pair checks", () => {
  const corn = companionGuidance("Maize").relationships.find(r => r.id === "corn-bean");
  assert.match(corn.reason, /climbing beans/);
  assert.match(corn.reason, /Bush beans do not climb/);
  assert.match(companionGuidance("Dill").notes[0].reason, /flowers/);
  assert.equal(checkCompanionBed([plant("Dill"), plant("Cucumber")]).matches.length, 0);
  assert.equal(new Set(companionRules.map(r => [r.a,r.b].sort().join(":"))).size, companionRules.length);
  for (const rule of [...companionRules,...companionNotes]) {
    assert.ok(rule.sources.length);
    for (const source of rule.sources) assert.ok(companionSources[source]?.url.startsWith("https://"));
  }
});

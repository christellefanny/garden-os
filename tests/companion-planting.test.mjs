import { test } from "node:test";
import assert from "node:assert/strict";
import { companionProfile, companionGuidance, checkCompanionBed } from "../lib/companion-planting.ts";
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

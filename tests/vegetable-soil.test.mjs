import { test } from "node:test";
import assert from "node:assert/strict";
import { plantCatalog } from "../lib/plant-picker.ts";
import {
  getVegetableSoilProfile,
  soilGrowingContext,
  vegetableSoilProfiles,
} from "../lib/vegetable-soil.ts";

test("all 26 current vegetable choices resolve to reviewed soil guidance", () => {
  const vegetables = plantCatalog.filter(plant => plant.category === "Vegetable");
  assert.equal(vegetables.length, 26);
  for (const plant of vegetables) {
    assert.ok(getVegetableSoilProfile(plant.name, plant.category), plant.name);
  }
  assert.equal(new Set(vegetableSoilProfiles.map(profile => profile.id)).size, vegetableSoilProfiles.length);
});

test("every crop has complete, source-linked copy and bounded optional pH", () => {
  for (const profile of vegetableSoilProfiles) {
    for (const field of ["id", "name", "bed", "container", "moisture"]) {
      assert.equal(typeof profile[field], "string", `${profile.id}: ${field}`);
      assert.ok(profile[field].trim(), `${profile.id}: ${field}`);
    }
    for (const field of ["bed", "container", "moisture"]) {
      assert.ok(profile[field].length >= 50, `${profile.id}: ${field} is not meaningful guidance`);
    }
    assert.match(profile.reviewed, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Array.isArray(profile.notes));
    assert.ok(profile.sources.length >= 1, profile.id);
    assert.equal(new Set(profile.sources.map(source => source.url)).size, profile.sources.length, `${profile.id}: duplicated source`);
    for (const source of profile.sources) {
      assert.ok(source.title.length > 10, profile.id);
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(!url.username && !url.password);
      assert.ok(/\.edu$|\.edu\.|\.org\.uk$|^gardening\.usask\.ca$/.test(url.hostname), `${profile.id}: review source ${url.hostname}`);
    }
    if (profile.ph) {
      assert.ok(Number.isFinite(profile.ph.min) && Number.isFinite(profile.ph.max));
      assert.ok(profile.ph.min >= 0 && profile.ph.max <= 14 && profile.ph.min <= profile.ph.max, profile.id);
      assert.ok(profile.ph.note.trim(), `${profile.id}: explain the pH scope`);
    }
  }
});

test("exact aliases handle spelling and whitespace without identifying unrelated plants", () => {
  assert.equal(getVegetableSoilProfile("  SWEET   POTATO  ")?.id, getVegetableSoilProfile("Sweet Potato")?.id);
  assert.notEqual(getVegetableSoilProfile("Sweet Potato")?.id, getVegetableSoilProfile("Potato")?.id);
  assert.notEqual(getVegetableSoilProfile("Beet")?.id, getVegetableSoilProfile("Swiss Chard")?.id);
  for (const name of ["Mystery vegetable", "Tomato tree", "Potato vine", "Sweet potato vine", "Carrot flower", "Queen Anne's Lace / Wild Carrot", "Cornflower", "Corn salad", "Pea shoots mix", "Bean mixture", "Sungold", "", "   "]) {
    assert.equal(getVegetableSoilProfile(name), undefined, name);
  }
  for (const profile of vegetableSoilProfiles) {
    for (const alias of [profile.name, ...profile.aliases]) {
      assert.equal(getVegetableSoilProfile(alias)?.id, profile.id, alias);
    }
  }
});

test("declared non-vegetable categories do not receive vegetable guidance", () => {
  for (const category of ["Flower", "Herb", "Fruit & Berry", "Tree"]) {
    assert.equal(getVegetableSoilProfile("Tomato", category), undefined, category);
  }
  assert.ok(getVegetableSoilProfile("Tomato", "Vegetable"));
  assert.ok(getVegetableSoilProfile("Tomato", "Other"));
  assert.ok(getVegetableSoilProfile("Tomato"));
  assert.equal(getVegetableSoilProfile("Unidentified root", "Vegetable"), undefined);
});

test("guest beginner vegetable names reuse the shared profiles", () => {
  for (const name of ["Leaf lettuce", "Spring radish", "Bush snap bean", "Slicing tomato", "Sweet bell pepper"]) {
    assert.ok(getVegetableSoilProfile(name, "Vegetable"), name);
  }
});

test("growing method uses explicit types and keeps hydroponics distinct", () => {
  for (const value of ["Raised Bed", "In-ground Bed", " raised bed "]) assert.equal(soilGrowingContext(value), "bed");
  for (const value of ["Container", "Grow Bag", "Growing Bag"]) assert.equal(soilGrowingContext(value), "container");
  assert.equal(soilGrowingContext("Hydroponic"), "hydroponic");
  for (const value of [undefined, "", "Greenhouse", "Window", "loam", "Patio", "Raised planter", "Unknown container"]) assert.equal(soilGrowingContext(value), "unknown", value);
});

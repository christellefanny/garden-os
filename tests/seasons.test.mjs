import assert from "node:assert/strict";
import { test } from "node:test";
import { getSeason, parseThemeSelection, seasonContent, seasons } from "../lib/seasons.ts";

test("automatic seasons cover all local months and transitions", () => {
  const expected = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "fall", "fall", "fall", "winter"];
  expected.forEach((season, month) => {
    assert.equal(getSeason(new Date(2026, month, 1, 0, 0)), season);
    assert.equal(getSeason(new Date(2026, month + 1, 0, 23, 59, 59)), season);
  });
  assert.equal(getSeason(new Date(2028, 1, 29)), "winter");
});

test("saved preferences accept only supported choices", () => {
  for (const value of ["automatic", ...seasons]) assert.equal(parseThemeSelection(value), value);
  for (const value of [null, undefined, "autumn", "SUMMER", "", {}, "<script>"]) assert.equal(parseThemeSelection(value), "automatic");
});

test("each season exposes its requested shortcuts", () => {
  const expected = {
    spring: ["Start Seeds", "Frost Dates", "Prepare Beds", "Plant"],
    summer: ["Watering", "Harvest", "Pests", "Garden Log"],
    fall: ["Harvest", "Save Seeds", "Plant Garlic", "Cleanup"],
    winter: ["Seed Vault", "Next Season Plan", "Seed Wishlist", "Indoor Growing"],
  };
  for (const season of seasons) assert.deepEqual(seasonContent[season].shortcuts.map((item) => item.label), expected[season]);
  assert.match(seasonContent.fall.description, /sweet potatoes/);
  assert.doesNotMatch(JSON.stringify(seasonContent), /pumpkin/i);
});

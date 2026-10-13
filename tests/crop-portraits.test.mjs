import { test } from "node:test";
import assert from "node:assert/strict";
import { getPortraitArt } from "../lib/plant-art.ts";
import { readFile } from "node:fs/promises";
test("four previously blank crops and their plural names resolve to illustrations", () => {
  for (const [name, variety] of [
    ["Peppers", "Habanero"],
    ["Tomatoes", "Roma"],
    ["Lettuce", "Buttercrunch"],
    ["Onions", "Yellow Sweet"],
  ]) {
    const art = getPortraitArt(name, variety);
    assert.ok(art);
    assert.equal(art.illustration, true);
  }
});
test("recognizable shapes map to separate tiles, preserving type distinctions", () => {
  const cases = [
    ["Hot Pepper", "Habanero", 0, 0],
    ["Hot Pepper", "Scotch bonnet", 1, 0],
    ["Hot Pepper", "Serrano", 2, 0],
    ["Bell Pepper", "Miniature Red Bell", 3, 0],
    ["Tomato", "Roma", 0, 1],
    ["Tomato", "Cherry", 1, 1],
    ["Tomato", "Beefsteak", 2, 1],
    ["Tomato", "Cherokee Purple", 3, 1],
    ["Lettuce", "Romaine", 0, 2],
    ["Lettuce", "Butterhead", 1, 2],
    ["Lettuce", "Red leaf", 2, 2],
    ["Lettuce", "Oakleaf", 3, 2],
    ["Onion", "Red", 0, 3],
    ["Onion", "Yellow", 1, 3],
    ["Onion", "White", 2, 3],
    ["Onion", "Bunching", 3, 3],
  ];
  for (const [name, variety, column, row] of cases) {
    const art = getPortraitArt(name, variety);
    assert.equal(art.column, column, `${name} ${variety}`);
    assert.equal(art.row, row, `${name} ${variety}`);
    assert.ok(art.caption);
  }
});
test("unrecognized species stay unmatched; unaffected known plants keep existing artwork", () => {
  assert.equal(getPortraitArt("Unidentified seedling"), null);
  assert.equal(
    getPortraitArt("Garlic", "Music").src,
    "/conservatory/botanical-plate.webp",
  );
});
test("the production illustration plate is a valid WebP asset", async () => {
  const data = await readFile(
    new URL("../public/conservatory/crop-portraits-v2.webp", import.meta.url),
  );
  assert.equal(data.toString("ascii", 0, 4), "RIFF");
  assert.equal(data.toString("ascii", 8, 12), "WEBP");
});

test("Dianthus including Paint the Town resolves to a full individual illustration", () => {
  for (const variety of ["", "Paint the Town", "Paint the Town Magenta"]) {
    const art = getPortraitArt("Dianthus", variety);
    assert.equal(art.src, "/conservatory/dianthus-portrait.webp");
    assert.equal(art.standalone, true);
    assert.match(art.caption, /Representative Dianthus/);
  }
});

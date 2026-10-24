import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { getVaultBotanicalArt, vaultBotanicalSubjects } from "../lib/vault-botanical-art.ts";

test("distinct colors and plant forms never resolve to the same illustration tile", () => {
  for (const [name, varieties] of [
    ["Tomato", ["Brandywine", "Cherokee Purple", "Roma VF"]],
    ["Pepper", ["Habanero", "Scotch Bonnet", "Serrano", "Green Bell"]],
    ["Lettuce", ["Buttercrunch", "Romaine", "Red Leaf"]],
    ["Cabbage", ["Green", "Purple / Red"]],
  ]) {
    const tiles = varieties.map(variety => {
      const art = getVaultBotanicalArt(name, variety);
      assert.ok(art);
      return `${art.src}:${art.column}:${art.row}`;
    });
    assert.equal(new Set(tiles).size, varieties.length);
  }
  assert.equal(getVaultBotanicalArt("Tomato", "Cream Sausage (Bush)"), null);
  assert.equal(getVaultBotanicalArt("Tomato", "Unknown yellow variety"), null);
  assert.equal(getVaultBotanicalArt("Hydrangea", "Blue"), null);
  assert.deepEqual(getVaultBotanicalArt("  cabbage ", " PURPLE / RED "), getVaultBotanicalArt("Cabbage", "Purple / Red"));
});

test("every collection subject resolves inside an existing botanical artwork asset", () => {
  const keys = new Set();
  for (const { name, variety } of vaultBotanicalSubjects) {
    const art = getVaultBotanicalArt(name, variety);
    assert.ok(art?.illustration);
    assert.ok(art.row >= 0 && art.row < art.columns);
    assert.ok(art.column >= 0 && art.column < art.columns);
    assert.ok(existsSync(new URL(`../public${art.src}`, import.meta.url)));
    const file = readFileSync(new URL(`../public${art.src}`, import.meta.url));
    assert.ok(file.length > 1000);
    assert.equal(file.toString("ascii", 0, 4), "RIFF");
    assert.equal(file.toString("ascii", 8, 12), "WEBP");
    const tile = `${art.src}:${art.row}:${art.column}`;
    assert.ok(!keys.has(tile), `${name} ${variety} repeats another tile`);
    keys.add(tile);
  }
  assert.equal(getVaultBotanicalArt("Long Cayenne Pepper").columns, 2);
  assert.equal(getVaultBotanicalArt("Jalapeno Peppers").row, 1);
});

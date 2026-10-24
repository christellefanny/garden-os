import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getFlowerGardenArt, cutFlowerSubjects } from "../lib/flower-garden-art.ts";

test("every encyclopedia flower has its own botanical illustration", () => {
  const source = readFileSync(new URL("../components/FlowersPage.tsx", import.meta.url), "utf8");
  const encyclopedia = source.split("const cutFlowerEncyclopedia = [")[1].split("] as const;")[0];
  const names = [...encyclopedia.matchAll(/name:\s*"([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(names, [...cutFlowerSubjects]);
  const tiles = names.map(name => {
    const art = getFlowerGardenArt(name);
    assert.ok(art);
    assert.ok(art.row < 4 && art.column < 4);
    return `${art.src}:${art.row}:${art.column}`;
  });
  assert.equal(new Set(tiles).size, 30);
  assert.notDeepEqual(getFlowerGardenArt("Rudbeckia"), getFlowerGardenArt("Rudbeckia Sahara"));
  assert.notDeepEqual(getFlowerGardenArt("Snapdragons"), getFlowerGardenArt("Chantilly Snapdragons"));
  assert.deepEqual(getFlowerGardenArt("  DAHLIAS "), getFlowerGardenArt("Dahlias"));
  assert.equal(getFlowerGardenArt("Unknown flower"), null);
});

test("both flower art files are complete WebP images", () => {
  for (const name of ["Dahlias", "Zinnias"]) {
    const art = getFlowerGardenArt(name);
    const bytes = readFileSync(new URL(`../public${art.src}`, import.meta.url));
    assert.ok(bytes.length > 1000);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  }
});

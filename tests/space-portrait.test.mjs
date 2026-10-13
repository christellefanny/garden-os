import { test } from "node:test";
import assert from "node:assert/strict";
import {
  spacePortraitCandidates,
  validPhotoUrl,
} from "../lib/space-portrait.ts";
const details = {
  garden_os: 1,
  notes: "Original note",
  plants: [
    {
      id: "one",
      name: "Tomato",
      variety: "Roma",
      status: "Growing",
      vaultPlantId: "v1",
    },
    { id: "two", name: "Garlic", variety: "Music", status: "Growing" },
  ],
  entries: [],
};
test("growing-space portraits use the exact connected vault photo and preserve source records", () => {
  const vault = [
    {
      id: "v1",
      name: "Tomato",
      variety: "Roma",
      photoUrl: "https://example.test/roma.jpg",
    },
  ];
  const original = structuredClone(details);
  const p = spacePortraitCandidates(details, vault);
  assert.equal(p[0].photoUrl, vault[0].photoUrl);
  assert.equal(p[0].art, null);
  assert.deepEqual(details, original);
});
test("another plant supplies verified artwork when the first cultivar has none", () => {
  const p = spacePortraitCandidates(details, []).find(
    (p) => p.art || p.photoUrl,
  );
  assert.equal(p.name, "Garlic");
});
test("photo matching never borrows a different variety and prefers growing/planned crops to finished ones", () => {
  assert.equal(
    spacePortraitCandidates(details, [
      {
        id: "other",
        name: "Tomato",
        variety: "Cherry",
        photoUrl: "https://example.test/cherry.jpg",
      },
    ])[0].photoUrl,
    undefined,
  );
  const d = structuredClone(details);
  d.plants[0].status = "Finished";
  assert.equal(spacePortraitCandidates(d, []).length, 1);
});
test("photo URLs reject executable, malformed and credential-containing values", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:image/png;base64,abc",
    "https://user:secret@example.test/image.jpg",
    "not a url",
    null,
  ])
    assert.equal(validPhotoUrl(value), false);
  assert.equal(validPhotoUrl("https://example.test/bed.jpg"), true);
});

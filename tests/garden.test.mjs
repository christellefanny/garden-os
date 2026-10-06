import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readDetails,
  spaceSummary,
  gridCapacity,
  spaceArea,
} from "../lib/garden.ts";

test("legacy notes remain intact and corrupt structured records block edits", () => {
  for (const notes of [
    null,
    "Original notes",
    "{unfinished",
    '{"ordinary":"notes"}',
  ]) {
    assert.equal(readDetails(notes).notes, notes ?? "");
    assert.deepEqual(readDetails(notes).plants, []);
  }
  assert.throws(() => readDetails('{"garden_os":2}'), /unsupported/);
  assert.throws(
    () =>
      readDetails(
        JSON.stringify({
          garden_os: 1,
          notes: "",
          plants: [null],
          entries: [],
        }),
      ),
    /invalid/,
  );
});

test("capacity uses active/planned plant spacing and excludes finished crops", () => {
  const plant = {
    id: "1",
    name: "Lettuce",
    variety: "",
    quantity: 4,
    spacing: 12,
    planted: "",
    status: "Growing",
  };
  const space = {
    type: "Raised Bed",
    length_feet: 4,
    width_feet: 2,
    diameter_inches: null,
    notes: JSON.stringify({
      garden_os: 1,
      notes: "",
      plants: [
        plant,
        { ...plant, id: "2", status: "Finished" },
        { ...plant, id: "3", quantity: 2, status: "Planned" },
      ],
      entries: [],
    }),
  };
  assert.equal(spaceSummary(space).plants, 6);
  assert.equal(spaceSummary(space).capacity, 75);
  assert.equal(spaceSummary({ ...space, width_feet: null }).capacity, null);
  assert.equal(spaceArea({ type: "Container", diameter_inches: 24 }), Math.PI);
});

test("planner handles invalid inputs and full grid boundaries", () => {
  assert.equal(gridCapacity(6, 3, 18), 8);
  assert.equal(gridCapacity(2, 2, 25), 0);
  assert.equal(gridCapacity(2.5, 2, 12), 4);
  for (const value of [0, -1, NaN, Infinity])
    assert.equal(gridCapacity(6, 3, value), null);
});

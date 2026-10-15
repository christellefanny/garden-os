import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  connectGardenPlants,
  dailyRecommendations,
  harvestTotals,
} from "../lib/connected-garden.ts";
const owner = "11111111-1111-4111-8111-111111111111",
  friend = "22222222-2222-4222-8222-222222222222";
test("cloud state is private, additive and protects concurrent device changes", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${owner}'),('${friend}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('app.uid',true),'')::uuid$$;grant usage on schema public,auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`,
    );
    const sql = await readFile(
      new URL("../supabase/garden-os-state.sql", import.meta.url),
      "utf8",
    );
    await db.exec(sql);
    await db.exec(sql);
    await db.exec(
      `set role authenticated;select set_config('app.uid','${owner}',false);`,
    );
    const key = `garden-os-plant-vault-${owner}`;
    await db.query("select * from garden_os_save_state($1,$2::jsonb,0)", [
      key,
      JSON.stringify([{ id: "first", name: "Tulips" }]),
    ]);
    await db.query("select * from garden_os_save_state($1,$2::jsonb,1)", [
      key,
      JSON.stringify([
        { id: "first", name: "Tulips" },
        { id: "second", name: "Garlic" },
      ]),
    ]);
    await assert.rejects(
      db.query("select * from garden_os_save_state($1,$2::jsonb,1)", [
        key,
        "[]",
      ]),
      /State changed/,
    );
    assert.equal(
      (await db.query("select value from garden_os_state")).rows[0].value
        .length,
      2,
    );
    await db.exec(`select set_config('app.uid','${friend}',false)`);
    assert.equal(
      (await db.query("select * from garden_os_state")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select * from garden_os_save_state($1,$2::jsonb,0)", [
        key,
        "[]",
      ]),
      /Invalid state/,
    );
    await db.exec("reset role;set role anon");
    await assert.rejects(
      db.query("select * from garden_os_state"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
test("growing-space updates reuse the vault identity and preserve unrelated entries", () => {
  const vault = [
    {
      id: "existing",
      name: "Tomato",
      variety: "Roma",
      category: "Vegetable",
      statuses: ["Have Seeds"],
      source: "saved",
      year: "2026",
      notes: "keep this",
    },
    {
      id: "flower",
      name: "Tulips",
      variety: "",
      category: "Flower",
      statuses: [],
      source: "",
      year: "",
      notes: "keep flowers",
    },
  ];
  const details = {
    garden_os: 1,
    notes: "bed",
    plants: [
      {
        id: "p",
        name: "Tomatoes",
        variety: "Roma",
        quantity: 6,
        spacing: 18,
        status: "Growing",
        planted: "2026-05-01",
      },
    ],
    entries: [],
  };
  const result = connectGardenPlants(details, vault, () => {
    throw new Error("should reuse");
  });
  assert.equal(result.details.plants[0].vaultPlantId, "existing");
  assert.equal(result.vault.length, 2);
  assert.equal(result.vault[0].notes, "keep this");
  assert.equal(result.vault[1].notes, "keep flowers");
  assert.ok(result.vault[0].statuses.includes("Growing Now"));
  assert.equal(
    connectGardenPlants(result.details, result.vault, () => "new").vault.length,
    2,
  );
});
test("recommendations use saved growing plants and do not invent weather or watering", () => {
  const space = { id: "bed", name: "Tomato bed" };
  const details = {
    plants: [{ name: "Tomato", status: "Growing" }],
    entries: [],
  };
  const advice = dailyRecommendations(
    [space],
    () => details,
    "fall",
    "2026-10-11",
    "10-15",
  );
  assert.ok(advice.find((t) => t.title === "Check soil moisture"));
  assert.match(
    advice.find((t) => t.title === "Plan harvest and frost protection").detail,
    /not a frost warning/,
  );
  details.entries.push({ kind: "Watering", date: "2026-10-11" });
  assert.equal(
    dailyRecommendations(
      [space],
      () => details,
      "fall",
      "2026-10-11",
      "10-15",
    ).some((t) => t.title === "Check soil moisture"),
    false,
  );
});
test("season yields separate units and ignore unmeasured observations", () => {
  const entries = [
    {
      kind: "Harvest",
      date: "2025-08-01",
      quantity: 2,
      unit: "lb",
      plantId: "Roma",
    },
    {
      kind: "Harvest",
      date: "2025-08-03",
      quantity: 3,
      unit: "lb",
      plantId: "Roma",
    },
    {
      kind: "Harvest",
      date: "2025-08-03",
      quantity: 8,
      unit: "oz",
      plantId: "Roma",
    },
    {
      kind: "Harvest",
      date: "2026-08-03",
      quantity: 7,
      unit: "lb",
      plantId: "Roma",
    },
    { kind: "Harvest", date: "2026-08-05", text: "Picked tomatoes" },
  ];
  const totals = harvestTotals(entries);
  assert.equal(totals.length, 3);
  assert.equal(
    totals.find((t) => t.year === "2025" && t.unit === "lb").quantity,
    5,
  );
  assert.equal(
    totals.find((t) => t.year === "2025" && t.unit === "oz").quantity,
    8,
  );
});

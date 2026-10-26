import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildWeeklyBrief,
  weekBounds,
  weeklyDue,
} from "../lib/weekly-brief.ts";
const garden = {
  id: "g1",
  name: "Vegetable garden",
  location: "Plainfield, IL",
  year: 2026,
};
const plant = (id, name, statuses = ["Growing Now"]) => ({
  id,
  name,
  variety: "",
  category: "Vegetable",
  statuses,
  source: "",
  year: "2026",
  notes: "",
});
const vault = [
  plant("tomato", "Tomato"),
  plant("pepper", "Bell Pepper"),
  plant("garlic", "Garlic", ["Have Seeds"]),
  plant("lettuce", "Lettuce"),
  plant("excluded", "Giant Marconi", ["Not Growing Again"]),
];
const spaces = [
  {
    id: "s1",
    garden_id: "g1",
    name: "North bed",
    type: "Raised Bed",
    notes: JSON.stringify({
      garden_os: 1,
      notes: "",
      plants: [
        {
          id: "t1",
          vaultPlantId: "tomato",
          name: "Tomato",
          variety: "",
          quantity: 3,
          spacing: 24,
          planted: "2026-05-20",
          status: "Growing",
        },
      ],
      entries: [],
    }),
  },
  {
    id: "s2",
    garden_id: "g1",
    name: "Indoor lettuce",
    type: "Hydroponic",
    notes: JSON.stringify({
      garden_os: 1,
      notes: "",
      plants: [
        {
          id: "l1",
          vaultPlantId: "lettuce",
          name: "Lettuce",
          variety: "",
          quantity: 3,
          spacing: 8,
          planted: "2026-09-30",
          status: "Growing",
        },
      ],
      entries: [],
    }),
  },
];
const calendar = {
  lastFrost: "05-15",
  firstFrost: "10-15",
  plants: { lettuce: { mode: "indoor" } },
  tasks: {},
};
const weather = {
  location: "Plainfield, IL",
  timezone: "America/Chicago",
  periods: [
    { name: "Monday", date: "2026-10-12", high: 86, rain: 0, summary: "Sunny" },
    {
      name: "Friday Night",
      date: "2026-10-16",
      low: 37,
      rain: 0,
      summary: "Clear",
    },
  ],
  alerts: [],
};
const input = {
  garden,
  vault,
  spaces,
  calendar,
  weather,
  today: "2026-10-12",
  generated: "2026-10-12T14:00:00Z",
};
test("weekly boundaries and delivery day follow Monday–Sunday and opt-in", () => {
  assert.deepEqual(weekBounds("2026-10-18"), {
    start: "2026-10-12",
    end: "2026-10-18",
  });
  assert.deepEqual(weekBounds("2026-12-31"), {
    start: "2026-12-28",
    end: "2027-01-03",
  });
  assert.equal(weeklyDue({ enabled: true, day: 1 }, "2026-10-12"), true);
  assert.equal(weeklyDue({ enabled: false, day: 1 }, "2026-10-12"), false);
  assert.equal(weeklyDue(undefined, "2026-10-12"), false);
});
test("cold weather prioritizes harvest and covers with actual bed details, not indoor lettuce", () => {
  const b = buildWeeklyBrief(input);
  assert.equal(b.priorities.length, 3);
  assert.equal(b.priorities[0].id, "cold-harvest");
  assert.ok(b.priorities[0].spaces.includes("North bed"));
  assert.ok(
    !b.priorities.find((a) => a.id === "cold-cover").plants.includes("Lettuce"),
  );
  assert.match(b.priorities[0].why, /precaution, not a confirmed frost/);
  assert.ok(b.prepare.some((a) => a.id === "indoor"));
  assert.ok(!JSON.stringify(b.wait).includes("Giant Marconi"));
  assert.ok(b.excluded.includes("Giant Marconi"));
});
test("missing weather never invents temperatures, frost or rain deadlines", () => {
  const b = buildWeeklyBrief({
    ...input,
    weather: { ...weather, periods: [], warning: "Live weather unavailable" },
  });
  assert.ok(
    !b.priorities.some((a) => a.id.startsWith("cold-") || a.id === "heat"),
  );
  assert.match(b.summary, /no temperatures/);
  assert.ok(b.limitations.includes("Live weather unavailable"));
});
test("finished crops and another garden do not trigger active harvest advice", () => {
  const s = structuredClone(spaces[0]);
  const details = JSON.parse(s.notes);
  details.plants[0].status = "Finished";
  s.notes = JSON.stringify(details);
  const b = buildWeeklyBrief({
    ...input,
    vault: [],
    spaces: [s, { ...spaces[0], garden_id: "another" }],
  });
  assert.equal(
    b.priorities.some((a) => a.id === "cold-harvest"),
    false,
  );
});
test("growing garlic changes planting into mulch review without duplicate planting", () => {
  const s = structuredClone(spaces[0]);
  const d = JSON.parse(s.notes);
  d.plants = [{ ...d.plants[0], name: "Garlic", vaultPlantId: "garlic" }];
  s.notes = JSON.stringify(d);
  const b = buildWeeklyBrief({ ...input, spaces: [s] });
  const garlic = [...b.priorities, ...b.prepare].find((a) => a.id === "garlic");
  assert.match(garlic.title, /mulch/);
  assert.match(garlic.why, /Do not replant/);
});
test("completed reminders are suppressed and custom steps remain distinguishable", () => {
  const b = buildWeeklyBrief({
    ...input,
    calendar: {
      ...calendar,
      reminders: [
        {
          id: "custom|a",
          plantId: "tomato",
          title: "Check support",
          date: "2026-10-14",
        },
        {
          id: "custom|b",
          plantId: "tomato",
          title: "Finished step",
          date: "2026-10-14",
        },
      ],
      tasks: { "custom|b": { status: "done" } },
    },
  });
  assert.ok(
    b.savedTasks.some((t) => t.id === "custom|a" && t.kind === "saved-task"),
  );
  assert.ok(!b.savedTasks.some((t) => t.id === "custom|b"));
});
test("old forecast periods cannot trigger current-week cold protection", () => {
  const b = buildWeeklyBrief({
    ...input,
    weather: {
      ...weather,
      periods: [{ name: "Old night", date: "2026-10-10", low: 29, rain: 100 }],
    },
  });
  assert.ok(!b.priorities.some((a) => a.id.startsWith("cold-")));
});
test("season history preserves recorded quantities and separates units without extrapolation", () => {
  const s = structuredClone(spaces[0]);
  const d = JSON.parse(s.notes);
  d.entries = [
    {
      id: "h1",
      kind: "Harvest",
      date: "2026-10-10",
      text: "Picked tomatoes",
      quantity: 2,
      unit: "lb",
      plantId: "Roma",
    },
    {
      id: "h2",
      kind: "Harvest",
      date: "2026-10-11",
      text: "Picked tomatoes",
      quantity: 3,
      unit: "count",
      plantId: "Roma",
    },
    {
      id: "h3",
      kind: "Harvest",
      date: "2025-10-10",
      text: "Last season",
      quantity: 100,
      unit: "lb",
      plantId: "Roma",
    },
  ];
  s.notes = JSON.stringify(d);
  const b = buildWeeklyBrief({ ...input, spaces: [s] });
  assert.deepEqual(
    b.harvests.map((h) => [h.unit, h.quantity]),
    [
      ["lb", 2],
      ["count", 3],
    ],
  );
  assert.ok(b.prepare.some((a) => a.id === "season-history"));
});
test("rain before the cold advances the harvest deadline and excluded overrides stay out of planting milestones", () => {
  const b = buildWeeklyBrief({
    ...input,
    calendar: {
      ...calendar,
      plants: { ...calendar.plants, excluded: { included: true } },
    },
    weather: {
      ...weather,
      periods: [
        ...weather.periods,
        { name: "Thursday", date: "2026-10-15", high: 60, rain: 80 },
      ],
    },
  });
  assert.match(b.priorities[0].when, /Before 2026-10-15 rain/);
  assert.ok(!JSON.stringify(b.wait).includes("Giant Marconi"));
});

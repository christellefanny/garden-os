import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildGrowingTasks,
  calendarDefaults,
  localDay,
  shiftDay,
  reminderSnapshot,
} from "../lib/growing-calendar.ts";
const p = (name, extra = {}) => ({
  id: name,
  name,
  variety: "",
  category: "Vegetable",
  statuses: ["Have Seeds"],
  source: "",
  year: "",
  notes: "",
  ...extra,
});
test("calendar uses Central dates, including year and leap-day boundaries", () => {
  assert.equal(localDay(new Date("2027-01-01T02:00:00Z")), "2026-12-31");
  assert.equal(shiftDay("2028-02-28", 1), "2028-02-29");
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
});
test("excluded and past-only plants are omitted; explicit inclusion works", () => {
  const plants = [
    p("Pepper", { statuses: ["Not Growing Again", "Wishlist"] }),
    p("Tomato", { statuses: ["Previously Grown"] }),
  ];
  assert.equal(buildGrowingTasks(plants, 2027).length, 0);
  assert.ok(
    buildGrowingTasks(plants, 2027, {
      ...calendarDefaults,
      plants: { Tomato: { included: true } },
    }).length,
  );
});
test("garlic, bulbs and sweet potatoes have appropriate tasks", () => {
  const tasks = buildGrowingTasks(
    [
      p("Garlic"),
      p("Tulips", { category: "Flower" }),
      p("Gladiator allium", { category: "Flower" }),
      p("Sweet Potato"),
    ],
    2027,
  );
  assert.ok(tasks.some((t) => t.plant === "Garlic" && t.date === "2027-10-15"));
  assert.equal(
    tasks.filter((t) => t.title === "Plant spring-flowering bulbs").length,
    2,
  );
  assert.ok(tasks.some((t) => t.title === "Review sweet-potato slip planting"));
  assert.equal(new Set(tasks.map((t) => t.id)).size, tasks.length);
});
test("indoor plants do not receive outdoor transplant tasks", () => {
  const tasks = buildGrowingTasks(
    [p("Lettuce", { notes: "Selected for indoor growing." })],
    2027,
  );
  assert.equal(
    tasks.filter((t) => t.title === "Check indoor growing conditions").length,
    12,
  );
  assert.ok(!tasks.some((t) => /transplant|Harden/.test(t.title)));
});
test("varieties share tasks while retaining variety descriptions", () => {
  const tasks = buildGrowingTasks(
    [
      p("Tomato", { id: "a", variety: "Roma" }),
      p("Tomato", { id: "b", variety: "Brandywine" }),
    ],
    2027,
  );
  assert.equal(
    tasks.filter((t) => t.title === "Review transplanting window").length,
    1,
  );
  assert.ok(tasks[0].detail.includes("Roma, Brandywine"));
});
test("completion, skip and postponement persist by stable task ID", () => {
  const plants = [p("Garlic")],
    tasks = buildGrowingTasks(plants, 2027);
  const first = tasks[0];
  const result = buildGrowingTasks(plants, 2027, {
    ...calendarDefaults,
    tasks: { [first.id]: { status: "done", date: "2027-02-01" } },
  });
  const edited = result.find((t) => t.id === first.id);
  assert.equal(edited.status, "done");
  assert.equal(edited.date, "2027-02-01");
  assert.equal(tasks[0].status, undefined);
});
test("frost planning changes move outdoor tasks without mutating the vault", () => {
  const plant = p("Tomato");
  const old = buildGrowingTasks([plant], 2027).find(
    (t) => t.title === "Review transplanting window",
  );
  const next = buildGrowingTasks([plant], 2027, {
    ...calendarDefaults,
    lastFrost: "05-22",
  }).find((t) => t.title === "Review transplanting window");
  assert.equal(next.date, shiftDay(old.date, 7));
  assert.equal(plant.name, "Tomato");
});

test("custom plant reminders retain variety, inclusion independence and calendar overrides", () => {
  const plant=p("Tulips",{id:"bulb",variety:"Queen of Night",statuses:["Not Growing Again"]});
  const options={...calendarDefaults,reminders:[{id:"custom|one",plantId:"bulb",title:"Check bulbs",date:"2026-10-15"}]};
  const tasks=buildGrowingTasks([plant],2026,options);
  assert.equal(tasks.length,1);assert.equal(tasks[0].plant,"Tulips · Queen of Night");
  const moved={...options,tasks:{"custom|one":{date:"2028-03-01"}}};
  assert.equal(buildGrowingTasks([plant],2026,moved).length,0);
  assert.equal(buildGrowingTasks([plant],2028,moved)[0].date,"2028-03-01");
  assert.equal(reminderSnapshot([plant],moved,"2026-10-10")[0].date,"2028-03-01");
  assert.equal(reminderSnapshot([plant],{...options,tasks:{"custom|one":{status:"done"}}},"2026-10-10").length,0);
  assert.equal(buildGrowingTasks([],2026,options).length,0);
});

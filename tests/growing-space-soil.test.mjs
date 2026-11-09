import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveSoilContext, soilGuides, soilMaterials, spaceSoilSummary } from "../lib/growing-space-soil.ts";

test("explicit space types resolve without guessing construction", () => {
  assert.equal(resolveSoilContext("In-ground Bed"), "ground");
  for (const label of ["Container", "Grow Bag", "Growing Bag", "  GROWING   BAG  "]) {
    assert.equal(resolveSoilContext(label), "container", label);
  }
  assert.equal(resolveSoilContext("  IN-GROUND   BED "), "ground");
  assert.equal(resolveSoilContext("Raised Bed", "open-soil"), "raised");
  assert.equal(resolveSoilContext("  RAISED   BED ", "closed-base"), "container");
  for (const base of [undefined, null, "", "unknown", true, {}, [], "open", "Open-soil"]) {
    assert.equal(resolveSoilContext("Raised Bed", base), null);
  }
});

test("unknown and hydroponic spaces never receive a soil assumption", () => {
  for (const label of [undefined, null, "", "  ", "Hydroponic", "Other", "Bed", "Raised Bed on legs", 42]) {
    for (const base of [undefined, "open-soil", "closed-base"]) {
      assert.equal(resolveSoilContext(label, base), null);
    }
  }
  assert.equal(resolveSoilContext("Container", "open-soil"), "container");
  assert.equal(resolveSoilContext("In-ground Bed", "closed-base"), "ground");
});

test("all contexts have complete practical guidance and matching summaries", () => {
  assert.deepEqual(Object.keys(soilGuides).sort(), ["container", "ground", "raised"]);
  for (const [context, guide] of Object.entries(soilGuides)) {
    for (const field of ["title", "intro", "caution"]) assert.ok(guide[field].trim());
    assert.ok(guide.steps.length >= 3);
    for (const step of guide.steps) assert.ok(step.title.trim() && step.body.trim());
    const summary = spaceSoilSummary(context);
    assert.ok(summary.title.trim() && summary.body.trim());
  }
  assert.deepEqual(spaceSoilSummary("raised"), {
    title: "Start with the soil beneath your bed.",
    body: "If you need more fill, use suitable garden soil or topsoil. Add finished compost if the soil needs it.",
  });
  assert.match(spaceSoilSummary("ground").body, /soil test/);
  assert.match(spaceSoilSummary("container").body, /drain/);
});

test("safety copy distinguishes existing soil, container drainage and reservoirs", () => {
  const ground = JSON.stringify(soilGuides.ground);
  const raised = JSON.stringify(soilGuides.raised);
  const container = JSON.stringify(soilGuides.container);
  assert.match(ground, /existing soil/);
  assert.match(ground, /finished compost if/);
  assert.match(raised, /open to the soil below/);
  assert.match(raised, /no single fill recipe/);
  assert.match(container, /lightweight potting mix/);
  assert.match(container, /drainage outlets/);
  assert.match(container, /ordinary saucer/);
  assert.match(container, /self-watering reservoir is different/);
  assert.match(container, /Do not add a gravel layer/);
});

test("six materials explain distinct roles and limitations without a shopping recipe", () => {
  assert.deepEqual(soilMaterials.map(item => item.id), ["compost", "vermiculite", "coco-coir", "perlite", "sand", "gravel"]);
  const byId = Object.fromEntries(soilMaterials.map(item => [item.id, item]));
  for (const item of soilMaterials) {
    for (const field of ["name", "role", "helps", "caution"]) assert.ok(item[field].trim());
  }
  assert.match(byId.compost.caution, /only as needed/);
  assert.match(byId.vermiculite.role, /Moisture/);
  assert.match(byId.perlite.role, /Aeration/);
  assert.match(byId["coco-coir"].caution, /low-salt horticultural/);
  assert.match(byId["coco-coir"].caution, /hydrate/);
  assert.match(byId["coco-coir"].caution, /not fertilizer/);
  assert.match(byId.sand.caution, /Do not add sand as a quick fix for clay/);
  assert.match(byId.gravel.caution, /does not improve container drainage/);
  assert.doesNotMatch(JSON.stringify([soilGuides, soilMaterials]), /\b\d+\s*(?:%|parts?\b)|\b\d+:\d+\b/);
});

test("every guide and material links to named university extension sources", () => {
  for (const item of [...Object.values(soilGuides), ...soilMaterials]) {
    assert.ok(item.sources.length);
    assert.equal(new Set(item.sources.map(source => source.url)).size, item.sources.length);
    for (const source of item.sources) {
      assert.ok(source.title.length > 10);
      const url = new URL(source.url);
      assert.equal(url.protocol, "https:");
      assert.ok(url.hostname.endsWith(".edu"));
      assert.ok(!url.username && !url.password);
    }
  }
});

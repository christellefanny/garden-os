import { catalogCategory } from "./plant-picker.ts";
import type { Space, SpaceDetails } from "./garden";
import type { VaultPlant } from "../components/PlantVault";
const normalized = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/tomatoes/g, "tomato")
    .replace(/peppers/g, "pepper")
    .replace(/\s+/g, " ");
export function connectGardenPlants(
  details: SpaceDetails,
  vault: VaultPlant[],
  id: () => string,
) {
  const next = [...vault];
  const plants = details.plants.map((plant) => {
    let record =
      next.find((p) => p.id === plant.vaultPlantId) ||
      next.find(
        (p) =>
          normalized(p.name) === normalized(plant.name) &&
          normalized(p.variety) === normalized(plant.variety),
      );
    if (!record) {
      record = {
        id: plant.vaultPlantId || id(),
        name: plant.name,
        variety: plant.variety,
        category: plant.category || catalogCategory(plant.name) || "Other",
        statuses: [],
        source: "Growing space",
        year: plant.planted.slice(0, 4),
        notes: "Connected from a saved growing-space plant.",
      };
      next.push(record);
    }
    if (
      plant.status === "Growing" &&
      !record.statuses.includes("Growing Now")
    ) {
      record = { ...record, statuses: [...record.statuses, "Growing Now"] };
      next[next.findIndex((p) => p.id === record!.id)] = record;
    }
    return { ...plant, vaultPlantId: record.id };
  });
  return { details: { ...details, plants }, vault: next };
}
export function dailyRecommendations(
  spaces: Space[],
  read: (s: Space) => SpaceDetails,
  season: string,
  today: string,
  firstFrost: string,
) {
  const growing = spaces.flatMap((space) =>
    read(space)
      .plants.filter((p) => p.status === "Growing")
      .map((plant) => ({ plant, space })),
  );
  const indoor = (space: Space) =>
    space.type === "Hydroponic" ||
    /indoor|windowsill|kitchen/i.test(
      `${space.name} ${read(space).notes || ""}`,
    );
  const soil = growing.filter((p) => p.space.type !== "Hydroponic");
  const advice: {
    id: string;
    title: string;
    plant: string;
    detail: string;
    date: string;
    status?: "done" | "skipped";
  }[] = [];
  const moistureChecks = soil.filter(
    ({ space }) =>
      !read(space).entries.some(
        (e) => e.kind === "Watering" && e.date === today,
      ),
  );
  if (moistureChecks.length)
    advice.push({
      id: `advice|${today}|moisture`,
      date: today,
      title: "Check soil moisture",
      plant: [...new Set(moistureChecks.map((p) => p.space.name))].join(", "),
      detail:
        "Feel soil below the surface before watering. This is a recommendation, not a measurement or weather forecast.",
    });
  const hydro = growing.filter((p) => p.space.type === "Hydroponic");
  if (hydro.length)
    advice.push({
      id: `advice|${today}|reservoir`,
      date: today,
      title: "Check reservoir and roots",
      plant: [...new Set(hydro.map((p) => p.space.name))].join(", "),
      detail:
        "Inspect water level and roots against your hydroponic setup’s instructions. No soil-moisture reading is assumed.",
    });
  const harvest = growing.filter((p) =>
    /tomato|pepper|okra|lettuce|bean|cucumber/i.test(p.plant.name),
  );
  if (
    harvest.length &&
    (["summer", "fall"].includes(season) ||
      harvest.some((p) => indoor(p.space)))
  )
    advice.push({
      id: `advice|${today}|harvest`,
      date: today,
      title: "Check harvest readiness",
      plant: [...new Set(harvest.map((p) => p.plant.name))].join(", "),
      detail:
        "Inspect ripeness and size against your variety’s instructions. Record only what you actually pick.",
    });
  if (growing.length)
    advice.push({
      id: `advice|${today}|inspect`,
      date: today,
      title: "Inspect leaves and new growth",
      plant: [...new Set(growing.map((p) => p.plant.name))].join(", "),
      detail:
        "Look for pests, damage, and changes. Save an observation if you notice something; no pest diagnosis is assumed.",
    });
  if (
    season === "fall" &&
    growing.some(
      (p) => !indoor(p.space) && /tomato|pepper|okra/i.test(p.plant.name),
    )
  )
    advice.push({
      id: `advice|${today}|frost`,
      date: today,
      title: "Plan harvest and frost protection",
      plant: [
        ...new Set(
          growing
            .filter(
              (p) =>
                !indoor(p.space) && /tomato|pepper|okra/i.test(p.plant.name),
            )
            .map((p) => p.plant.name),
        ),
      ].join(", "),
      detail: `Your planning frost anchor is ${firstFrost}. Check the actual forecast before deciding to cover or harvest. This is not a frost warning.`,
    });
  return advice;
}
export function harvestTotals(
  entries: Array<{
    kind: string;
    date: string;
    quantity?: number;
    unit?: string;
    plantId?: string;
  }>,
) {
  const groups = new Map<
    string,
    {
      year: string;
      plant: string;
      unit: string;
      quantity: number;
      harvests: number;
    }
  >();
  for (const e of entries) {
    if (
      e.kind !== "Harvest" ||
      !Number.isFinite(e.quantity) ||
      !e.quantity ||
      e.quantity <= 0 ||
      !e.unit
    )
      continue;
    const year = e.date.slice(0, 4),
      plant = e.plantId || "Unspecified variety",
      key = `${year}|${plant}|${e.unit}`;
    const total = groups.get(key) || {
      year,
      plant,
      unit: e.unit,
      quantity: 0,
      harvests: 0,
    };
    total.quantity += e.quantity;
    total.harvests++;
    groups.set(key, total);
  }
  return [...groups.values()].sort(
    (a, b) => b.year.localeCompare(a.year) || a.plant.localeCompare(b.plant),
  );
}

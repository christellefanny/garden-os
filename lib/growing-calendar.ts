import type { VaultPlant } from "../components/PlantVault";
export type CalendarOptions = {
  lastFrost: string;
  firstFrost: string;
  plants: Record<string, { included?: boolean; mode?: "indoor" | "outdoor" }>;
  tasks: Record<string, { status?: "done" | "skipped"; date?: string }>;
};
export type GrowingTask = {
  id: string;
  date: string;
  title: string;
  plant: string;
  detail: string;
  status?: "done" | "skipped";
};
export const calendarDefaults: CalendarOptions = {
  lastFrost: "05-15",
  firstFrost: "10-15",
  plants: {},
  tasks: {},
};
export function localDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function shiftDay(day: string, days: number) {
  const d = new Date(day + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function includedByDefault(p: VaultPlant) {
  return (
    !p.statuses.includes("Not Growing Again") &&
    p.statuses.some((s) =>
      ["Growing Now", "Have Seeds", "Have Plant", "Wishlist"].includes(s),
    )
  );
}
export function defaultMode(p: VaultPlant): "indoor" | "outdoor" {
  return p.category === "Houseplant / Indoor" ||
    /selected for indoor|included in the indoor|hydroponic|windowsill/i.test(
      p.notes,
    )
    ? "indoor"
    : "outdoor";
}
const perennial =
  /salvia|hollyhock|painted daisy|dianthus|sedum|catmint|nepeta|echinacea|coneflower|yarrow|aster|rudbeckia|astilbe|hosta|heuchera|anemone|lamb.s ear|hydrangea|agastache|penstemon|forest grass|brunnera|epimedium|rose/i;
export function buildGrowingTasks(
  plants: VaultPlant[],
  year: number,
  options: CalendarOptions = calendarDefaults,
): GrowingTask[] {
  const last = `${year}-${options.lastFrost}`,
    first = `${year}-${options.firstFrost}`;
  const result: GrowingTask[] = [];
  // Each plant type shares a task across its included varieties, keeping reminders manageable.
  const groups = new Map<string, VaultPlant[]>();
  for (const p of plants) {
    if (!(options.plants[p.id]?.included ?? includedByDefault(p))) continue;
    const mode = options.plants[p.id]?.mode ?? defaultMode(p);
    const key = p.name.trim().toLowerCase() + "|" + mode;
    groups.set(key, [...(groups.get(key) || []), p]);
  }
  for (const [key, group] of groups) {
    const p = group[0],
      name = p.name.trim(),
      n = name.toLowerCase(),
      indoor = key.endsWith("|indoor");
    const varieties = [
      ...new Set(group.map((x) => x.variety).filter(Boolean)),
    ].join(", ");
    const add = (date: string, title: string, detail: string) => {
      const id = `${year}|${key}|${title}|${date}`;
      const change = options.tasks[id];
      result.push({
        id,
        date: change?.date || date,
        title,
        plant: name,
        detail: detail + (varieties ? ` Varieties: ${varieties}.` : ""),
        status: change?.status,
      });
    };
    const on = (md: string, title: string, detail: string) =>
      add(`${year}-${md}`, title, detail);
    if (indoor) {
      for (let m = 1; m <= 12; m++)
        on(
          `${String(m).padStart(2, "0")}-05`,
          "Check indoor growing conditions",
          "Check light, moisture and pests. For hydroponics, check water level and follow your nutrient label. Adjust to the plant's growth; do not fertilize automatically.",
        );
      on(
        "01-15",
        "Plan your next indoor sowing",
        "Review seed packets, growing space and lighting. Choose a sowing date suitable for your setup.",
      );
      continue;
    }
    on(
      "01-15",
      "Review seeds and next-season plan",
      "Check what you own, germination instructions and supplies before buying or sowing.",
    );
    if (/garlic/.test(n)) {
      on(
        "10-15",
        "Prepare and plant garlic",
        "Use the fall planting window as a starting point; plant before soil freezes, following your supplier's depth and spacing.",
      );
      on(
        "11-01",
        "Check garlic mulch",
        "After cooler weather settles in, check that mulch protects the bed without burying emerging shoots.",
      );
      on(
        "06-10",
        "Check for garlic scapes",
        "For hardneck varieties, watch for curled scapes and harvest as appropriate.",
      );
      on(
        "07-10",
        "Check garlic harvest readiness",
        "Inspect lower-leaf browning and a test bulb. Harvest timing varies; cure in a dry, shaded, ventilated place.",
      );
    } else if (/tulip|allium/.test(n)) {
      on(
        "10-15",
        "Plant spring-flowering bulbs",
        "Check bulb-specific instructions and plant in the autumn window before soil freezes.",
      );
      on(
        "05-20",
        "Care for fading bulb flowers",
        "Remove spent flowers if desired, but let foliage yellow naturally before removing it.",
      );
    } else if (p.category === "Fruit & Berry") {
      on(
        "03-15",
        "Review fruit-specific spring care",
        "Identify the species, cultivar and cane or tree age before pruning. Check an appropriate pruning guide; different fruits need different methods.",
      );
      on(
        "04-20",
        "Check fruit plants and mulch",
        "Check new growth, drainage and mulch spacing around stems. Inspect leaves for disease.",
      );
      on(
        "07-01",
        "Watch fruit ripeness and pests",
        "Harvest according to your fruit type and variety. Inspect berries and fruit regularly.",
      );
      on(
        "10-15",
        "Prepare fruit plants for winter",
        "Remove diseased fallen fruit, check water needs and winter protection appropriate to the plant.",
      );
    } else if (perennial.test(n) && p.category === "Flower") {
      if (
        group.some(
          (x) =>
            x.statuses.includes("Have Seeds") ||
            x.statuses.includes("Wishlist"),
        )
      )
        on(
          "03-15",
          "Review perennial seed instructions",
          "Check whether seeds require stratification, special light or a long germination period. Do not assume all perennial seeds share a sowing method.",
        );
      on(
        "04-15",
        "Check perennial spring growth",
        "Identify emerging growth and remove damaged material when appropriate. Leave habitat where possible.",
      );
      on(
        "05-10",
        "Review perennial planting or division",
        "Check the species' planting, division and moisture requirements before disturbing established plants.",
      );
      on(
        "07-01",
        "Check blooms and watering",
        "Inspect flowers, soil moisture and pests. Deadheading depends on the species and whether you want seeds.",
      );
      on(
        "10-20",
        "Prepare perennial beds for winter",
        "Keep useful standing seed heads; remove diseased growth and check species-specific winter protection.",
      );
    } else {
      const cool =
        /lettuce|broccoli|cabbage|kale|spinach|arugula|radish|carrot|onion|leek|pansy|^potato$/.test(
          n,
        );
      const direct =
        /bean|corn|radish|carrot|spinach|arugula|potato|wildflower|shade flower/.test(
          n,
        );
      const warmDate = shiftDay(last, 10),
        plantDate = cool ? shiftDay(last, -21) : warmDate;
      if (!direct)
        add(
          shiftDay(
            plantDate,
            /pepper|celery|onion|leek/.test(n)
              ? 70
              : /tomato|basil|zinnia|cosmos|marigold/.test(n)
                ? 42
                : 56,
          ),
          "Review seed-starting window",
          "Check the seed packet for timing, germination needs and light. This is an estimated planning date, not a weather forecast.",
        );
      if (!direct)
        add(
          shiftDay(plantDate, -7),
          "Harden off seedlings",
          "Gradually introduce seedlings to outdoor conditions, protecting them from wind, cold and harsh sun.",
        );
      add(
        plantDate,
        /sweet potato/.test(n)
          ? "Review sweet-potato slip planting"
          : direct
            ? "Review outdoor sowing window"
            : "Review transplanting window",
        /sweet potato/.test(n)
          ? "Use slips, not ordinary seeds. Wait for reliably warm soil and nights, and follow the supplier's instructions."
          : "Check actual weather, soil conditions and the seed packet before planting. Warm-season plants need frost-free, warm conditions.",
      );
      if (/lettuce|broccoli|cabbage|kale|spinach|arugula|radish/.test(n)) {
        on(
          "07-15",
          "Plan a fall succession",
          "Count back from your fall frost planning date using days to maturity. Broccoli after garlic, followed by lettuce, can fit your plan.",
        );
        on(
          "08-15",
          "Check fall sowing or transplants",
          "Choose a variety and timing that can mature before cold weather; keep germinating seeds moist.",
        );
      }
      if (p.category === "Flower") {
        on(
          "07-15",
          "Check flowers and save-seed plans",
          "Deadhead for more blooms or leave selected healthy flowers to mature for seed saving.",
        );
        on(
          "09-15",
          "Check seed maturity",
          "Collect only mature, dry seed heads you can identify. Mixes may not reproduce the same assortment.",
        );
      } else {
        on(
          "07-15",
          "Check harvest readiness",
          "Use your variety's maturity and ripeness signs; the calendar cannot know the actual planting date or weather.",
        );
      }
      add(
        shiftDay(first, -14),
        /sweet potato/.test(n)
          ? "Plan sweet-potato harvest"
          : "Plan harvest and frost protection",
        "Watch the local forecast. Harvest tender crops or arrange suitable protection before frost; use actual conditions.",
      );
      on(
        "10-25",
        "Review end-of-season cleanup",
        "Remove diseased material, save useful records and plan soil care. Keep habitat and healthy seed heads where appropriate.",
      );
    }
    for (const md of ["06-05", "07-05", "08-05", "09-05"])
      on(
        md,
        "Check soil moisture and pests",
        "Check soil before watering, inspect leaves and growing tips, and log what you notice. Adjust care to rainfall and the plant.",
      );
    on(
      "12-05",
      "Review this year's notes",
      "Record successes, problems and varieties to keep or change next year.",
    );
  }
  return result.sort(
    (a, b) => a.date.localeCompare(b.date) || a.plant.localeCompare(b.plant),
  );
}

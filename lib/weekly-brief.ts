import type { VaultPlant } from "../components/PlantVault";
import type { Garden, Space } from "./garden";
import { readDetails } from "./garden.ts";
import {
  buildGrowingTasks,
  defaultMode,
  includedByDefault,
  shiftDay,
  type CalendarOptions,
} from "./growing-calendar.ts";
export type WeeklyPreferences = {
  enabled: boolean;
  day: number;
  gardenId: string;
  latitude?: number;
  longitude?: number;
  planningNotes?: string;
};
export type ForecastPeriod = {
  name: string;
  date: string;
  low?: number;
  high?: number;
  rain: number;
  summary: string;
};
export type BriefSource = {
  id: string;
  title: string;
  url: string;
  checked?: string;
  available?: boolean;
};
export type WeatherContext = {
  location: string;
  timezone: string;
  updated?: string;
  retrieved?: string;
  periods: ForecastPeriod[];
  alerts: string[];
  warning?: string;
  latitude?: number;
  longitude?: number;
};
export type BriefAction = {
  id: string;
  title: string;
  when: string;
  why: string;
  steps: string[];
  plants: string[];
  spaces: string[];
  sources: string[];
  taskIds?: string[];
  kind: "recommendation" | "saved-task";
};
export type WeeklyBrief = {
  generated: string;
  start: string;
  end: string;
  garden: string;
  location: string;
  summary: string;
  weather: WeatherContext;
  priorities: BriefAction[];
  prepare: BriefAction[];
  wait: BriefAction[];
  savedTasks: BriefAction[];
  observations: { date: string; kind: string; text: string; space: string }[];
  sources: BriefSource[];
  limitations: string[];
  excluded: string[];
  planningNotes: string;
  harvests: {
    plant: string;
    unit: string;
    quantity: number;
    records: number;
  }[];
};
export const briefSources: BriefSource[] = [
  {
    id: "garlic",
    title: "Illinois Extension · Growing garlic",
    url: "https://extension.illinois.edu/blogs/good-growing/2019-09-17-how-grow-garlic",
  },
  {
    id: "harvest",
    title: "Illinois Extension · Vegetable harvest readiness",
    url: "https://extension.illinois.edu/blogs/good-growing/2024-06-28-harvesting-vegetables-when-and-how-pick-your-vegetables-best-quality",
  },
  {
    id: "cover",
    title: "Illinois Extension · Row covers",
    url: "https://extension.illinois.edu/blogs/good-growing/2021-03-12-use-row-cover-protect-plants-more-just-frost",
  },
  {
    id: "seeds",
    title: "Illinois Extension · Saving flower seeds",
    url: "https://extension.illinois.edu/blogs/flowers-fruits-and-frass/2023-09-01-cherish-favorite-flowers-and-challenge-your-green-thumb",
  },
  {
    id: "hydro",
    title: "Illinois Extension · Home hydroponics",
    url: "https://extension.illinois.edu/blogs/good-growing/2026-01-16-growing-without-soil-getting-started-hydroponics-home",
  },
  {
    id: "planting",
    title: "Illinois Extension · Planting dates",
    url: "https://extension.illinois.edu/gardening/when-plant",
  },
];
export function weekBounds(today: string) {
  const weekday = new Date(today + "T12:00:00Z").getUTCDay();
  const start = shiftDay(today, -((weekday + 6) % 7));
  return { start, end: shiftDay(start, 6) };
}
export function weeklyDue(
  preferences: WeeklyPreferences | undefined,
  day: string,
) {
  return (
    preferences?.enabled === true &&
    preferences.day === new Date(day + "T12:00:00Z").getUTCDay()
  );
}
export function buildWeeklyBrief(input: {
  garden: Garden;
  spaces: Space[];
  vault: VaultPlant[];
  calendar: CalendarOptions;
  weather: WeatherContext;
  today: string;
  generated?: string;
  sources?: BriefSource[];
}): WeeklyBrief {
  const { garden, vault, calendar, weather, today } = input;
  const bounds = weekBounds(today),
    spaces = input.spaces.filter((s) => s.garden_id === garden.id);
  const limitations = [
    "Recommendations are source-based planning guidance, not confirmed work, measurements, or diagnoses. Check your seed packet and actual conditions before acting.",
  ];
  const records = spaces.flatMap((space) => {
    try {
      const d = readDetails(space.notes);
      return d.archived ? [] : [{ space, details: d }];
    } catch {
      limitations.push(
        `Could not interpret records for ${space.name}; those plants were left out.`,
      );
      return [];
    }
  });
  const excluded = vault.filter(
    (p) =>
      p.statuses.includes("Not Growing Again") ||
      calendar.plants[p.id]?.included === false,
  );
  const included = (p: VaultPlant) =>
    !excluded.some((e) => e.id === p.id) &&
    (calendar.plants[p.id]?.included ?? includedByDefault(p));
  const active = records.flatMap(({ space, details }) =>
    details.plants
      .filter((p) => p.status === "Growing")
      .map((p) => {
        const v = vault.find(
          (v) =>
            v.id === p.vaultPlantId ||
            (v.name === p.name && v.variety === p.variety),
        );
        const indoor =
          space.type === "Hydroponic" ||
          /indoor|windowsill|garage/i.test(space.name + " " + details.notes) ||
          (v && (calendar.plants[v.id]?.mode ?? defaultMode(v)) === "indoor");
        return {
          name: [v?.name || p.name, v?.variety || p.variety]
            .filter(Boolean)
            .join(" · "),
          space: space.name,
          indoor,
          p,
          v,
        };
      }),
  );
  // A vault-only growing record is considered only when it has no connected space.
  for (const v of vault.filter(
    (p) => included(p) && p.statuses.includes("Growing Now"),
  )) {
    if (
      !active.some(
        (p) =>
          p.v?.id === v.id ||
          (p.p.name === v.name && p.p.variety === v.variety),
      )
    )
      active.push({
        name: [v.name, v.variety].filter(Boolean).join(" · "),
        space: "Space not assigned",
        indoor: (calendar.plants[v.id]?.mode ?? defaultMode(v)) === "indoor",
        p: {
          id: v.id,
          name: v.name,
          variety: v.variety,
          quantity: 1,
          spacing: 1,
          planted: "",
          status: "Growing",
        },
        v,
      });
  }
  const future = weather.periods.filter(
    (p) => p.date >= today && p.date <= bounds.end,
  );
  const cold = future
    .filter((p) => p.low !== undefined && p.low <= 38)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const rain = future.find((p) => p.rain >= 60);
  const hot = future.find((p) => p.high !== undefined && p.high >= 85);
  const month = Number(today.slice(5, 7)),
    fall = month >= 9 && month <= 11;
  const priorities: BriefAction[] = [],
    prepare: BriefAction[] = [],
    wait: BriefAction[] = [];
  type Active = typeof active;
  const names = (list: Active) => [...new Set(list.map((p) => p.name))];
  const beds = (list: Active) => [...new Set(list.map((p) => p.space))];
  const add = (
    to: BriefAction[],
    id: string,
    title: string,
    when: string,
    why: string,
    steps: string[],
    plants: string[] = [],
    locations: string[] = [],
    sources: string[] = [],
  ) =>
    to.push({
      id,
      title,
      when,
      why,
      steps,
      plants,
      spaces: locations,
      sources,
      kind: "recommendation",
    });
  const tender = active.filter(
    (p) =>
      !p.indoor &&
      /tomato|pepper|okra|basil|zinnia|marigold|cosmos/i.test(p.name),
  );
  const fruit = tender.filter((p) => /tomato|pepper|okra/i.test(p.name));
  if (cold && tender.length) {
    if (fruit.length)
      add(
        priorities,
        "cold-harvest",
        "Harvest usable tender crops",
        rain && rain.date < cold.date
          ? `Before ${rain.date} rain, while crops are dry`
          : `Before ${cold.date} evening`,
        `${cold.name} is forecast near ${cold.low}°F. Ground-level temperatures can be colder; this is a precaution, not a confirmed frost.`,
        [
          ...(fruit.some((p) => /tomato/i.test(p.name))
            ? [
                "Pick ripe and blushing tomatoes, plus mature-green fruit you want to finish indoors. Sort out damaged fruit and check stored tomatoes regularly.",
              ]
            : []),
          ...(fruit.some((p) => /pepper/i.test(p.name))
            ? [
                "Pick full-sized bell peppers and usable hot peppers. Judge maturity from the variety and fruit, not a calendar date.",
              ]
            : []),
          ...(fruit.some((p) => /okra/i.test(p.name))
            ? [
                "Pick tender, usable okra pods; leave oversized woody pods out of the harvest.",
              ]
            : []),
        ],
        names(fruit),
        beds(fruit),
        ["harvest"],
      );
    add(
      priorities,
      "cold-cover",
      "Choose what to protect",
      `Before sunset ${cold.date}`,
      "Outdoor tender plants have a cold night in the forecast. Protection depends on the cover, wind, and your garden's microclimate.",
      [
        "Protect plants worth keeping with suitable row cover on supports. Secure the edges to the ground; avoid crushing foliage.",
        "Move manageable containers into shelter. Check the cover rating; it does not guarantee survival in a hard freeze.",
        "Remove or vent covers when temperatures rise. Inspect damage after plants thaw before deciding what to remove.",
      ],
      names(tender),
      beds(tender),
      ["cover"],
    );
    add(
      prepare,
      "cold-kit",
      "Prepare the harvest and protection kit",
      `Before ${cold.date}`,
      "Gathering supplies first makes the cold-night response easier.",
      [
        "Set out breathable harvest boxes, labels, row cover, supports, and clips or weights.",
        "After the cold, assess each plant. Remove dead material; keep visibly diseased debris out of a home compost pile.",
      ],
      names(tender),
      beds(tender),
      ["harvest", "cover"],
    );
  }
  const garlic = vault.filter((p) => included(p) && /garlic/i.test(p.name));
  const plantedGarlic = active.filter((p) => /garlic/i.test(p.name));
  const garlicTasks = buildGrowingTasks(
    garlic,
    Number(today.slice(0, 4)),
    calendar,
  );
  const garlicDone = garlicTasks.some(
    (t) => /plant garlic/i.test(t.title) && t.status === "done",
  );
  if (garlic.length && fall) {
    const regional = /illinois|\bIL\b/i.test(
      weather.location + " " + (garden.location || ""),
    );
    add(
      priorities,
      "garlic",
      plantedGarlic.length || garlicDone
        ? "Check the garlic bed's mulch"
        : "Plan the fall garlic planting",
      rain ? `Use a workable-soil window before ${rain.date}` : "This week",
      plantedGarlic.length || garlicDone
        ? "Your records already show growing garlic or completed garlic planting. Do not replant it."
        : regional
          ? "Fall is the Illinois garlic-planting season. Confirm workable, well-drained soil and the planting window for your location."
          : "Your collection includes garlic. Confirm your local Extension fall planting window before planting.",
      plantedGarlic.length || garlicDone
        ? [
            "Check bare spots and top up the insulating mulch without digging up cloves. Avoid soggy, poorly drained conditions.",
          ]
        : [
            "Select large, healthy cloves and separate them just before planting. Use the linked garlic guide and variety instructions for depth and spacing.",
            "Plant point-up in a sunny, well-drained space; Illinois Extension describes a 4–6-inch layer of organic mulch to moderate soil temperature.",
          ],
      garlic.map((p) => [p.name, p.variety].filter(Boolean).join(" · ")),
      beds(plantedGarlic),
      ["garlic"],
    );
  }
  const hydro = active.filter((p) => p.indoor);
  if (hydro.length)
    add(
      priorities,
      "indoor",
      "Check the indoor crop setup",
      "This week",
      hot
        ? `Outdoor heat reaches ${hot.high}°F ${hot.date}; a garage may overheat, but its temperature is not measured.`
        : "Indoor growing continues independently of outdoor frost.",
      [
        "Check actual room temperature, light, leaf growth, and root health. Change the setup only if your measurements or plant condition justify it.",
        "For hydroponics, inspect the water level and follow your nutrient product's replacement and dilution instructions. Do not automatically add fertilizer.",
        "Review the last sowing date before starting a succession batch; do not assume seedlings are two weeks old.",
      ],
      names(hydro),
      beds(hydro),
      ["hydro"],
    );
  const flowers = active.filter((p) =>
    /marigold|calendula|zinnia|cosmos|sunflower/i.test(p.name),
  );
  if (flowers.length && fall)
    add(
      prepare,
      "flower-seeds",
      "Save ripe flower seeds",
      rain ? `Before ${rain.date} rain, if heads are dry` : "On a dry day",
      "Seed maturity and dryness matter more than the calendar.",
      [
        "Collect mature, dry heads. Finish drying in an airy place, label species/variety and date, and store only fully dry seed.",
        "Hybrids may not grow true to the parent; keep that limitation with your seed record.",
      ],
      names(flowers),
      beds(flowers),
      ["seeds"],
    );
  const soil = active.filter((p) => !p.indoor);
  if (hot && soil.length)
    add(
      priorities,
      "heat",
      "Check moisture during the hot spell",
      hot.date,
      `${hot.name} is forecast near ${hot.high}°F; pots and raised beds may dry faster.`,
      [
        "Feel soil below the surface in each space. Water at the root zone only where dry; a forecast does not tell us current soil moisture.",
        "Recheck containers and new transplants. Avoid a blanket watering schedule across all beds.",
      ],
      names(soil),
      beds(soil),
      ["planting"],
    );
  if (!cold && fruit.length)
    add(
      priorities,
      "harvest",
      "Check harvest readiness",
      "Every few days this week",
      "Growing crop records identify these vegetables; fruit maturity has not been observed.",
      [
        "Inspect tomatoes for color change, peppers for the intended harvest stage, and okra for tender pods. Pick only what is ready.",
        "Log the variety, date, quantity, and unit so future briefings can use your season history.",
      ],
      names(fruit),
      beds(fruit),
      ["harvest"],
    );
  const observations = records
    .flatMap(({ space, details }) =>
      details.entries
        .filter((e) => e.date >= shiftDay(today, -14) && e.date <= today)
        .map((e) => ({ ...e, space: space.name })),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const pests = observations.filter((e) => e.kind === "Pests");
  if (pests.length)
    add(
      priorities,
      "pests",
      "Follow up on recent pest observations",
      "This week",
      "Your journal has recent pest entries; the app is not diagnosing the cause.",
      [
        "Revisit the affected leaves and new growth, compare with the saved observation, and photograph any change.",
        "Identify the organism or damage before choosing treatment. Ask local Extension if the cause remains unclear.",
      ],
      [],
      [...new Set(pests.map((e) => e.space))],
      [],
    );
  if (soil.length && !priorities.some((a) => a.id === "heat"))
    add(
      prepare,
      "moisture",
      "Check before watering",
      "When you inspect the beds",
      rain
        ? `Rain probability reaches ${rain.rain}% on ${rain.date}; actual rainfall and soil moisture are unknown.`
        : "No soil-moisture sensor reading is available.",
      [
        "Check below the surface before watering, and recheck after rain. Skip irrigation where the root zone is already moist.",
      ],
      [],
      beds(soil),
      [],
    );
  if (fall) {
    const warm = vault.filter(
      (p) =>
        included(p) &&
        /tomato|pepper|okra|sweet potato/i.test(p.name) &&
        (calendar.plants[p.id]?.mode ?? defaultMode(p)) === "outdoor",
    );
    if (warm.length)
      add(
        wait,
        "warm-sowing",
        "Hold outdoor warm-season planting",
        "Until the next suitable warm-soil window",
        "Your outdoor growing calendar is entering the cool part of the year.",
        [
          "Do not start a new outdoor warm-season crop on the basis of a brief warm spell. Plan using your frost anchor, seed packet, and measured soil temperature.",
          "Review saved harvests and varieties before buying next season's seed.",
        ],
        warm.map((p) => [p.name, p.variety].filter(Boolean).join(" · ")),
        [],
        ["planting"],
      );
  }
  const taskVault = vault.filter((p) => !excluded.some((e) => e.id === p.id));
  const allTasks = [
    ...buildGrowingTasks(taskVault, Number(today.slice(0, 4)), calendar),
    ...buildGrowingTasks(taskVault, Number(today.slice(0, 4)) + 1, calendar),
  ];
  const tasks = allTasks.filter(
    (t) => !t.status && t.date >= today && t.date <= bounds.end,
  );
  const upcoming = allTasks
    .filter(
      (t) => !t.status && !t.id.startsWith("custom|") && t.date > bounds.end,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  if (upcoming.length)
    add(
      wait,
      "next-calendar",
      "Next planting milestones",
      "After this week",
      "Dates come from your saved growing calendar and frost anchors; they are planning targets, not guarantees.",
      upcoming.map((t) => `${t.date}: ${t.title} — ${t.plant}. ${t.detail}`),
      [],
      [],
      ["planting"],
    );
  const totals = new Map<
    string,
    { plant: string; unit: string; quantity: number; records: number }
  >();
  for (const { details } of records)
    for (const e of details.entries) {
      if (
        e.kind !== "Harvest" ||
        e.date.slice(0, 4) !== today.slice(0, 4) ||
        e.date > today ||
        !e.unit ||
        !Number.isFinite(e.quantity) ||
        e.quantity! <= 0
      )
        continue;
      const plant = e.plantId || "Unspecified variety",
        key = plant + "|" + e.unit;
      const t = totals.get(key) || {
        plant,
        unit: e.unit,
        quantity: 0,
        records: 0,
      };
      t.quantity += e.quantity!;
      t.records++;
      totals.set(key, t);
    }
  const harvests = [...totals.values()];
  if (fall && harvests.length)
    add(
      prepare,
      "season-history",
      "Review the season before buying seed",
      "When planning the next season",
      "Your saved harvest logs provide measured yields, without assuming unrecorded harvests or comparing incompatible units.",
      harvests
        .slice(0, 6)
        .map(
          (h) =>
            `${h.plant}: ${h.quantity.toLocaleString()} ${h.unit} from ${h.records} recorded harvest${h.records === 1 ? "" : "s"}. Review these records alongside taste, pests, and available bed space.`,
        ),
      [],
      [],
      [],
    );
  const seen = new Set<string>();
  const savedTasks = tasks
    .filter((t) => !seen.has(t.id) && !!seen.add(t.id))
    .map((t) => ({
      id: t.id,
      title: t.title,
      when: t.date,
      why: t.id.startsWith("custom|")
        ? "You saved this reminder."
        : "This is a planning-calendar step, not a forecast or observed plant stage.",
      steps: [t.detail],
      plants: [t.plant],
      spaces: [],
      sources: [],
      taskIds: [t.id],
      kind: t.id.startsWith("custom|")
        ? ("saved-task" as const)
        : ("recommendation" as const),
    }));
  if (weather.warning) limitations.push(weather.warning);
  if (!active.length)
    limitations.push(
      "No current growing plants are recorded for this garden. Add or connect plants to get bed-specific care and harvest advice.",
    );
  const summary = future.length
    ? `${weather.location}: ${future
        .map(
          (p) =>
            `${p.name} ${p.high !== undefined ? `${p.high}°F high` : `${p.low}°F low`}${p.rain >= 60 ? `, ${p.rain}% precipitation chance` : ""}`,
        )
        .slice(0, 4)
        .join(
          "; ",
        )}.${cold ? ` Cold-night precautions are relevant from ${cold.date}.` : ""}`
    : "Live weather is unavailable; no temperatures, rain timing, or frost warning have been inferred.";
  // Ranking is deterministic, preserves all additional useful actions, and never silently drops a fourth priority.
  const rank: Record<string, number> = {
    "cold-harvest": 100,
    "cold-cover": 95,
    pests: 90,
    garlic: 85,
    heat: 80,
    indoor: 75,
    harvest: 70,
  };
  priorities.sort((a, b) => (rank[b.id] || 0) - (rank[a.id] || 0));
  const overflow = priorities.splice(3);
  prepare.unshift(...overflow);
  return {
    generated: input.generated || new Date().toISOString(),
    ...bounds,
    garden: garden.name,
    location: weather.location || garden.location || "Location not set",
    summary,
    weather,
    priorities,
    prepare,
    wait,
    savedTasks,
    observations: observations.slice(0, 12).map((e) => ({
      date: e.date,
      kind: e.kind,
      text: e.text,
      space: e.space,
    })),
    sources: input.sources || briefSources,
    limitations,
    excluded: excluded.map((p) =>
      [p.name, p.variety].filter(Boolean).join(" · "),
    ),
    planningNotes: calendar.weekly?.planningNotes || "",
    harvests,
  };
}

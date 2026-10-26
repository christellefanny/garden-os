import type { SupabaseClient } from "@supabase/supabase-js";
import type { Garden, Space } from "./garden";
import type { VaultPlant } from "../components/PlantVault";
import { calendarDefaults, type CalendarOptions } from "./growing-calendar.ts";
import {
  briefSources,
  buildWeeklyBrief,
  type WeeklyPreferences,
  type WeatherContext,
  type ForecastPeriod,
} from "./weekly-brief.ts";
const headers = {
  "User-Agent": "GardenOS (https://garden-os-beta.vercel.app)",
  Accept: "application/geo+json",
};
const allowed = new Set([
  "api.weather.gov",
  "geocoding-api.open-meteo.com",
  "extension.illinois.edu",
]);
export async function publicFetch(url: string, revalidate = 600) {
  const u = new URL(url);
  if (
    u.protocol !== "https:" ||
    !allowed.has(u.hostname) ||
    u.port ||
    u.username ||
    u.password
  )
    throw new Error("Unsupported source.");
  const r = await fetch(url, {
    headers: {
      ...headers,
      Accept:
        u.hostname === "extension.illinois.edu" ? "text/html" : headers.Accept,
    },
    signal: AbortSignal.timeout(6000),
    redirect: "error",
    next: { revalidate },
  });
  if (!r.ok) throw new Error("Source unavailable.");
  return r;
}
export async function loadBriefContext(
  db: SupabaseClient,
  userId: string,
  gardenId?: string,
) {
  const [gardenResult, stateResult] = await Promise.all([
    db.from("gardens").select("*").eq("user_id", userId),
    db.from("garden_os_state").select("key,value").eq("user_id", userId),
  ]);
  if (gardenResult.error || stateResult.error)
    throw new Error(
      "Could not read your cloud garden records. Your saved data has not been changed.",
    );
  const states = new Map((stateResult.data || []).map((r) => [r.key, r.value]));
  const raw = states.get(`garden-os-calendar-${userId}`);
  const calendar: CalendarOptions = {
    ...calendarDefaults,
    ...(raw && typeof raw === "object" ? raw : {}),
  };
  calendar.plants = calendar.plants || {};
  calendar.tasks = calendar.tasks || {};
  const gardens = (gardenResult.data || []) as Garden[];
  const selected = gardenId || calendar.weekly?.gardenId;
  const garden = selected ? gardens.find((g) => g.id === selected) : gardens[0];
  if (!garden)
    throw new Error("Choose an existing garden for your weekly briefing.");
  const spaceResult = await db
    .from("growing_spaces")
    .select("*")
    .eq("garden_id", garden.id);
  if (spaceResult.error)
    throw new Error("Could not read the garden’s growing spaces.");
  const vault = states.get(`garden-os-plant-vault-${userId}`);
  if (vault !== undefined && !Array.isArray(vault))
    throw new Error("Your cloud Plant Vault format could not be read safely.");
  return {
    garden,
    spaces: (spaceResult.data || []) as Space[],
    vault: (vault || []) as VaultPlant[],
    calendar,
  };
}
function finiteCoords(p: WeeklyPreferences | undefined) {
  return (
    p &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.latitude!) <= 90 &&
    Math.abs(p.longitude!) <= 180
  );
}
export async function getGardenWeather(
  location: string | null,
  preferences?: WeeklyPreferences,
  now = new Date(),
): Promise<WeatherContext> {
  const empty: WeatherContext = {
    location: location || "Location not set",
    timezone: "America/Chicago",
    periods: [],
    alerts: [],
  };
  try {
    let latitude = preferences?.latitude,
      longitude = preferences?.longitude;
    if (!finiteCoords(preferences)) {
      if (!location)
        throw new Error(
          "Set a garden location or coordinates to enable local weather.",
        );
      const [city, state] = location.split(",").map((s) => s.trim());
      if (!state)
        throw new Error(
          "Use City, State (for example Plainfield, IL), or enter coordinates to avoid choosing the wrong town.",
        );
      const geo = await (
        await publicFetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=100&language=en&format=json`,
          86400,
        )
      ).json();
      const abbreviations: Record<string, string> = {
        IL: "Illinois",
        IN: "Indiana",
        WI: "Wisconsin",
        MI: "Michigan",
        IA: "Iowa",
        MO: "Missouri",
        MN: "Minnesota",
        OH: "Ohio",
        CA: "California",
        TX: "Texas",
        FL: "Florida",
        NY: "New York",
        PA: "Pennsylvania",
        NJ: "New Jersey",
        MA: "Massachusetts",
        CT: "Connecticut",
        WA: "Washington",
        OR: "Oregon",
        CO: "Colorado",
        KS: "Kansas",
        NE: "Nebraska",
        ND: "North Dakota",
        SD: "South Dakota",
        KY: "Kentucky",
        TN: "Tennessee",
        NC: "North Carolina",
        SC: "South Carolina",
        VA: "Virginia",
        WV: "West Virginia",
        GA: "Georgia",
        AL: "Alabama",
        AR: "Arkansas",
        LA: "Louisiana",
        MS: "Mississippi",
        OK: "Oklahoma",
        NM: "New Mexico",
        AZ: "Arizona",
        UT: "Utah",
        NV: "Nevada",
        ID: "Idaho",
        MT: "Montana",
        WY: "Wyoming",
        ME: "Maine",
        NH: "New Hampshire",
        VT: "Vermont",
        RI: "Rhode Island",
        DE: "Delaware",
        MD: "Maryland",
        AK: "Alaska",
        HI: "Hawaii",
        DC: "District of Columbia",
      };
      const wanted = abbreviations[state.toUpperCase()] || state;
      const matches = (geo.results || []).filter(
        (r: { country_code: string; name: string; admin1: string }) =>
          r.country_code === "US" &&
          r.name.toLowerCase() === city.toLowerCase() &&
          r.admin1?.toLowerCase() === wanted.toLowerCase(),
      );
      if (matches.length !== 1)
        throw new Error(
          "Your location is ambiguous or outside supported U.S. weather coverage. Enter garden coordinates in weekly settings.",
        );
      latitude = matches[0].latitude;
      longitude = matches[0].longitude;
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
      throw new Error("Garden coordinates are invalid.");
    const point = await (
      await publicFetch(
        `https://api.weather.gov/points/${latitude!.toFixed(4)},${longitude!.toFixed(4)}`,
        86400,
      )
    ).json();
    const endpoint = point.properties?.forecast;
    if (
      typeof endpoint !== "string" ||
      new URL(endpoint).hostname !== "api.weather.gov"
    )
      throw new Error("No supported forecast is available for this garden.");
    const [forecast, alerts] = await Promise.all([
      publicFetch(endpoint).then((r) => r.json()),
      publicFetch(
        `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`,
      )
        .then((r) => r.json())
        .catch(() => null),
    ]);
    const updated = forecast.properties?.updated;
    if (
      !updated ||
      !Number.isFinite(Date.parse(updated)) ||
      now.getTime() - Date.parse(updated) > 18 * 3600000
    )
      throw new Error(
        "The available forecast is stale. No weather-specific recommendations were generated.",
      );
    const periods: ForecastPeriod[] = (forecast.properties.periods || [])
      .filter(
        (p: {
          temperature: number;
          temperatureUnit: string;
          startTime: string;
        }) =>
          Number.isFinite(p.temperature) &&
          ["F", "C"].includes(p.temperatureUnit) &&
          /^\d{4}-\d{2}-\d{2}T/.test(p.startTime),
      )
      .map(
        (p: {
          name: string;
          temperature: number;
          temperatureUnit: string;
          isDaytime: boolean;
          startTime: string;
          probabilityOfPrecipitation?: { value: number | null };
          shortForecast: string;
        }) => ({
          name: p.name,
          date: p.startTime.slice(0, 10),
          [p.isDaytime ? "high" : "low"]:
            p.temperatureUnit === "C"
              ? Math.round((p.temperature * 9) / 5 + 32)
              : p.temperature,
          rain: p.probabilityOfPrecipitation?.value ?? 0,
          summary: p.shortForecast,
        }),
      );
    return {
      ...empty,
      latitude,
      longitude,
      timezone: point.properties.timeZone || empty.timezone,
      updated,
      retrieved: now.toISOString(),
      periods,
      alerts: (alerts?.features || [])
        .map((a: { properties: { headline: string } }) => a.properties.headline)
        .filter(Boolean),
      ...(!alerts
        ? {
            warning:
              "Official weather alerts could not be checked. Consult weather.gov before weather-sensitive work.",
          }
        : {}),
    };
  } catch (e) {
    return {
      ...empty,
      warning: e instanceof Error ? e.message : "Live weather is unavailable.",
    };
  }
}
export async function generateWeeklyBrief(
  context: Awaited<ReturnType<typeof loadBriefContext>>,
  now = new Date(),
) {
  const weather = await getGardenWeather(
    context.garden.location,
    context.calendar.weekly,
    now,
  );
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: weather.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  // Verify only sources actually used; do not send garden notes or account information to a third party.
  const brief = buildWeeklyBrief({
    ...context,
    weather,
    today,
    generated: now.toISOString(),
  });
  const used = new Set(
    [...brief.priorities, ...brief.prepare, ...brief.wait].flatMap(
      (a) => a.sources,
    ),
  );
  brief.sources = await Promise.all(
    briefSources
      .filter((s) => used.has(s.id))
      .map(async (s) => {
        try {
          await publicFetch(s.url, 86400);
          return { ...s, checked: now.toISOString(), available: true };
        } catch {
          return { ...s, available: false };
        }
      }),
  );
  if (brief.sources.some((s) => !s.available))
    brief.limitations.push(
      "Some Extension links could not be checked live. Their reviewed guidance is retained and the unavailable links are marked.",
    );
  return brief;
}

import { plantingSuggestions, validClimate, validDay, type PlantingClimate } from "./planting-now.ts";

export type BeginnerGoal = "flowers" | "food" | "mixed";
export type BeginnerZone = { zone: string; zip: string; place: string };
export const beginnerClimateMaxAge = 18 * 60 * 60 * 1000;
export function beginnerClimateKey(userId: string, gardenId: string, savedLocation: string) {
  return `garden-atelier-beginner-climate-v1:${JSON.stringify([userId, gardenId, savedLocation.trim().toLowerCase()])}`;
}
export function verifiedBeginnerClimate(value: unknown): value is PlantingClimate {
  if (!validClimate(value)) return false;
  return Number.isInteger(value.startYear) && Number.isInteger(value.endYear) &&
    value.startYear >= 1900 && value.endYear >= value.startYear && value.endYear - value.startYear < 30 &&
    value.years <= value.endYear - value.startYear + 1 &&
    value.meanLow.every((low, index) => low <= value.meanHigh[index]) &&
    (!value.lastSpringFrost || (value.lastSpringFrost <= "06-30" && value.firstFallFrost! >= "07-01"));
}
export function readBeginnerClimate(raw: string | null, savedLocation: string) {
  try {
    const value = JSON.parse(raw || "null");
    if (!value || typeof value.location !== "string" || !value.location.trim() || value.location.length > 120 || !verifiedBeginnerClimate(value.climate)) return null;
    if (savedLocation && value.location.trim().toLowerCase() !== savedLocation.trim().toLowerCase()) return null;
    return value as { location: string; climate: PlantingClimate };
  } catch { return null; }
}
export function currentBeginnerClimate(climate: PlantingClimate, now = new Date()) {
  const age = now.getTime() - Date.parse(climate.resolvedAt);
  return age >= 0 && age < beginnerClimateMaxAge ? climate : { ...climate, forecast: [] };
}

// Reuse the existing independent zone and weather services. No browser coordinates are requested.
export async function loadBeginnerClimate(location: string, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<{ zone: BeginnerZone; climate?: PlantingClimate; error?: string }> {
  async function request(path: string, input: object) {
    const response = await fetcher(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal });
    const result = await response.json();
    if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Local growing information is unavailable. Please try again.");
    return result;
  }
  const zone = await request("/api/garden-zone", { location: location.trim() });
  if (!/^(?:[1-9]|1[0-3])[ab]$/.test(zone.zone) || !/^\d{5}$/.test(zone.zip) || typeof zone.place !== "string") throw new Error("The growing zone could not be verified. Try a U.S. ZIP code.");
  try {
    const climate = await request("/api/planting-location", { zip: zone.zip });
    if (!verifiedBeginnerClimate(climate) || climate.zip !== zone.zip) throw new Error("The historical climate data could not be verified.");
    return { zone, climate };
  } catch (error) {
    if (signal.aborted) throw error;
    return { zone, error: error instanceof Error ? error.message : "Historical frost estimates are unavailable. Please try again." };
  }
}

export function beginnerPriorities(climate: PlantingClimate, today: string, goal: BeginnerGoal = "mixed") {
  if (!validDay(today)) throw new Error("Invalid planning date");
  const year = today.slice(0, 4), last = climate.lastSpringFrost && `${year}-${climate.lastSpringFrost}`, first = climate.firstFallFrost && `${year}-${climate.firstFallFrost}`;
  const daysLeft = first ? Math.ceil((Date.parse(first + "T12:00:00Z") - Date.parse(today + "T12:00:00Z")) / 86400000) : null;
  let title = "Choose a small planting that fits the conditions";
  let detail = "The frost dates give you a starting window. Plant needs, warm soil, and today’s weather still decide what can go outside.";
  if (!last || !first) {
    title = "Plan around temperatures, not a fixed frost season";
    detail = "Frost is too irregular here for dependable annual dates. Local heat, rainfall, and the needs of each plant matter more than a frost countdown.";
  } else if (today < last) {
    title = "Prepare now; wait on tender outdoor plants";
    detail = "The spring frost planning date is still ahead. Check sunlight and drainage, choose a small space, and start seeds indoors only when the packet’s timing fits.";
  } else if (today >= first) {
    title = "Prioritize protection and your next growing season";
    detail = "The fall frost planning date has arrived or passed. Check the forecast, protect tender plants you already have, and plan next season rather than count on a new warm-season outdoor crop.";
  } else if (daysLeft !== null && daysLeft <= 60) {
    title = "Time is getting short for a new outdoor crop";
    detail = `About ${daysLeft} days remain before the fall frost planning date. Compare each variety’s time to harvest or bloom, allow extra establishment time, and avoid starting long-season tender plants.`;
  }
  const suggestions = plantingSuggestions(climate, today).filter(advice =>
    advice.status !== "wait" && advice.status !== "unknown" && (goal === "mixed" || (goal === "flowers" ? advice.crop.kind === "Flower" : advice.crop.kind !== "Flower"))
  ).slice(0, 3);
  return { title, detail, suggestions };
}

import type { VaultPlant } from "../components/PlantVault";
import { packetSeedTiming } from "./seed-timing.ts";
import { localDay, type CalendarOptions } from "./growing-calendar.ts";

export type SeedStartSuggestion = {
  title: string;
  date: string;
  explanation: string;
};

// Iowa State Extension: weeks indoors before transplanting.
// https://yardandgarden.extension.iastate.edu/faq/when-should-i-sow-my-flower-and-vegetable-seeds-indoors
const cropWindows = [
  { names: /\b(?:tomato|cabbage|broccoli|cauliflower)\b/i, weeks: "5–7" },
  { names: /\b(?:marigold|pepper|eggplant)\b/i, weeks: "6–8" },
  { names: /\b(?:cucumber|watermelon|muskmelon|cantaloupe|squash)\b/i, weeks: "3–4" },
];

/** Use packet timing first, then a supported crop estimate regardless of vault status. */
export function seedStartSuggestion(
  plant: VaultPlant,
  options: CalendarOptions,
  today = localDay(),
): SeedStartSuggestion | null {
  const explicitWindow = /(?:start|sow)[^\n]*indoors?[^\n]*weeks?\s+before/i.test(plant.notes);
  const fallback = !explicitWindow && !/direct sow|do not transplant|sow after (?:danger of )?frost|sow when soil/i.test(plant.notes)
    ? cropWindows.find(crop => crop.names.test(plant.name)) : undefined;
  const fallbackPlant = fallback ? {...plant, notes: `Start indoors ${fallback.weeks} weeks before outdoor planting`} : null;
  const timingFor = (year: number) => packetSeedTiming(plant, options.lastFrost, year)
    || (fallbackPlant ? packetSeedTiming(fallbackPlant, options.lastFrost, year) : null);
  let year = Number(today.slice(0, 4));
  let timing = timingFor(year);
  if (!timing) return null;
  const fromPacket = !!packetSeedTiming(plant, options.lastFrost, year);
  if (timing.date < today) timing = timingFor(++year)!;
  const { date, window, frost, cool, range } = timing;
  const anchor = frost ? "last frost" : "estimated outdoor planting";
  return {
    title: "Start seeds indoors",
    date,
    explanation: `${fromPacket ? "Packet" : "General crop estimate"}: ${window} before ${anchor}.${range ? " Date uses the middle of that window." : ""} Based on your Growing Calendar last-frost date (${options.lastFrost})${frost ? "." : cool ? ", with outdoor planting estimated 3 weeks earlier." : ", with outdoor planting estimated 10 days later."} Edit as needed; saved only when you add the reminder.`,
  };
}

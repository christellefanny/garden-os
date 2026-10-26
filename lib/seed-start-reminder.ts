import type { VaultPlant } from "../components/PlantVault";
import { packetSeedTiming } from "./seed-timing.ts";
import { localDay, type CalendarOptions } from "./growing-calendar.ts";

export type SeedStartSuggestion = {
  title: string;
  date: string;
  explanation: string;
};

/** Suggest only when this owned seed's packet supplies an indoor starting window. */
export function seedStartSuggestion(
  plant: VaultPlant,
  options: CalendarOptions,
  today = localDay(),
): SeedStartSuggestion | null {
  if (
    !plant.statuses.includes("Have Seeds") ||
    plant.statuses.includes("Not Growing Again")
  )
    return null;
  let year = Number(today.slice(0, 4));
  let timing = packetSeedTiming(plant, options.lastFrost, year);
  if (!timing) return null;
  if (timing.date < today)
    timing = packetSeedTiming(plant, options.lastFrost, ++year)!;
  const { date, window, frost, cool, range } = timing;
  const anchor = frost ? "last frost" : "estimated outdoor planting";
  return {
    title: "Start seeds indoors",
    date,
    explanation: `Packet: ${window} before ${anchor}.${range ? " Date uses the middle of that window." : ""} Based on your Growing Calendar last-frost date (${options.lastFrost})${frost ? "." : cool ? ", with outdoor planting estimated 3 weeks earlier." : ", with outdoor planting estimated 10 days later."} Edit as needed; saved only when you add the reminder.`,
  };
}

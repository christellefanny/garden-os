import type { VaultPlant } from "../components/PlantVault";
import { localDay, shiftDay, type CalendarOptions } from "./growing-calendar.ts";

export type SeedStartSuggestion = { title: string; date: string; explanation: string };

/** Suggest only when this owned seed's packet supplies an indoor starting window. */
export function seedStartSuggestion(
  plant: VaultPlant,
  options: CalendarOptions,
  today = localDay(),
): SeedStartSuggestion | null {
  if (!plant.statuses.includes("Have Seeds") || plant.statuses.includes("Not Growing Again")) return null;
  const instruction = plant.notes.split(/[\n.]/).find(line =>
    /(?:start|sow)[^\n]*indoors?\b/i.test(line) &&
    /\d+(?:\s*[-–—]\s*\d+)?\s+weeks?\s+before/i.test(line),
  );
  if (!instruction) return null;
  const match = instruction.match(/(\d+)(?:\s*[-–—]\s*(\d+))?\s+weeks?\s+before\s+(.+)/i);
  if (!match) return null;
  const low = Number(match[1]), high = Number(match[2] || match[1]);
  if (low < 1 || high < low || high > 52) return null;
  const weeks = (low + high) / 2;
  const frost = /last (?:killing )?frost/i.test(match[3]);
  const transplant = /outdoor planting|planting outdoors|transplant|warm weather/i.test(match[3]);
  if (!frost && !transplant) return null;
  const cool = /cauliflower|broccoli|cabbage|kale|lettuce|pansy/i.test(plant.name);
  const outdoorOffset = frost ? 0 : cool ? -21 : 10;
  const dateFor = (year: number) => shiftDay(shiftDay(`${year}-${options.lastFrost}`, outdoorOffset), -Math.round(weeks * 7));
  let year = Number(today.slice(0, 4));
  let date = dateFor(year);
  if (date < today) date = dateFor(++year);
  const window = low === high ? `${low} weeks` : `${low}–${high} weeks`;
  const anchor = frost ? "last frost" : "estimated outdoor planting";
  return {
    title: "Start seeds indoors",
    date,
    explanation: `Packet: ${window} before ${anchor}.${low !== high ? " Date uses the middle of that window." : ""} Based on your Growing Calendar last-frost date (${options.lastFrost})${frost ? "." : cool ? ", with outdoor planting estimated 3 weeks earlier." : ", with outdoor planting estimated 10 days later."} Edit as needed; saved only when you add the reminder.`,
  };
}

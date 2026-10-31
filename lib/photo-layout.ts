import type { Layout, LayoutItem } from "./layout-design.ts";
import { containerStyles } from "./container-art.ts";

export const PHOTO_LAYOUT_MAX_ITEMS = 30;
export const PHOTO_LAYOUT_IMAGE_LIMIT = 1400000;
export const photoLayoutKinds = ["Bed", "Container", "Path", "Border"] as const;
export type PhotoArea = Pick<LayoutItem, "name" | "x" | "y" | "w" | "h" | "containerStyle"> & {kind: typeof photoLayoutKinds[number]};
export type PhotoAnalysis = { summary: string; notes: string[]; areas: PhotoArea[] };

/** Never trust model-generated coordinates, IDs, markup or record links. */
export function parsePhotoAnalysis(value: unknown): PhotoAnalysis {
  if (!value || typeof value !== "object") throw Error("The photo could not be mapped. Mark the areas yourself or try another photo.");
  const data = value as Partial<PhotoAnalysis>;
  if (typeof data.summary !== "string" || data.summary.length > 600 || !Array.isArray(data.notes) || data.notes.length > 8 || data.notes.some(n => typeof n !== "string" || n.length > 400) || !Array.isArray(data.areas) || data.areas.length > PHOTO_LAYOUT_MAX_ITEMS) throw Error("The photo returned an incomplete map. You can mark the areas yourself.");
  const areas = data.areas.map(area => {
    if (!area || typeof area.name !== "string" || !area.name.trim() || area.name.length > 80 || !photoLayoutKinds.includes(area.kind) || ![area.x, area.y, area.w, area.h].every(Number.isFinite) || area.x < 0 || area.y < 0 || area.w < 4 || area.h < 4 || area.x + area.w > 100.001 || area.y + area.h > 100.001) throw Error("The suggested areas did not fit the map. Mark the areas yourself or try another photo.");
    return { name: area.name.trim(), kind: area.kind, x: area.x, y: area.y, w: Math.min(area.w, 100-area.x), h: Math.min(area.h, 100-area.y), ...(area.kind==="Container"&&containerStyles.some(style=>style.id===area.containerStyle)?{containerStyle:area.containerStyle}:{}) };
  });
  return { summary: data.summary, notes: [...data.notes], areas };
}

export function validAnalysisImage(value: unknown): value is string {
  return typeof value === "string" && value.length <= PHOTO_LAYOUT_IMAGE_LIMIT && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

export function photoLayoutDraft(analysis: PhotoAnalysis, name: string, source: Layout["source"], uuid: () => string = () => crypto.randomUUID()): Layout {
  const checked = parsePhotoAnalysis(analysis);
  if (!name.trim() || name.length > 100 || !checked.areas.length) throw Error("Name your layout and add at least one area.");
  return { id: uuid(), name: name.trim(), items: checked.areas.map(area => ({ ...area, id: uuid(), spaceId: "" })), source };
}

export function photoQuota(value: unknown, now = Date.now()) {
  const old = value as { count?: number; lastAt?: number } | null;
  const count = Number.isInteger(old?.count) && old!.count! >= 0 ? old!.count! : 0;
  if (count >= 5) throw Error("You’ve used today’s five photo scans. You can still mark areas yourself, or scan again tomorrow.");
  if (typeof old?.lastAt === "number" && now - old.lastAt < 30000) throw Error("Please wait a moment before scanning another photo.");
  return { count: count + 1, lastAt: now };
}

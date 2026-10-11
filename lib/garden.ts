export type Garden = {
  id: string;
  name: string;
  year: number;
  location: string | null;
  hardiness_zone: string | null;
};
export const spaceTypes = [
  "Raised Bed",
  "In-ground Bed",
  "Container",
  "Growing Bag",
  "Hydroponic",
] as const;
export type Plant = {
  id: string;
  name: string;
  variety: string;
  quantity: number;
  spacing: number;
  planted: string;
  status: "Growing" | "Planned" | "Finished";
};
export type Entry = {
  id: string;
  kind: "Note" | "Watering" | "Harvest" | "Pests";
  date: string;
  text: string;
};
export type SpaceDetails = {
  garden_os: 1;
  notes: string;
  plants: Plant[];
  entries: Entry[];
  archived?: boolean;
  sourceLegacyId?: string;
};
export type Space = {
  id: string;
  garden_id: string;
  name: string;
  type: string;
  length_feet: number | null;
  width_feet: number | null;
  depth_feet: number | null;
  diameter_inches: number | null;
  sun_exposure: string | null;
  irrigation: string | null;
  soil_type: string | null;
  notes: string | null;
  updated_at: string;
};

export function readDetails(notes: string | null): SpaceDetails {
  const empty: SpaceDetails = {
    garden_os: 1,
    notes: notes ?? "",
    plants: [],
    entries: [],
  };
  if (!notes?.trim().startsWith("{")) return empty;
  let value;
  try {
    value = JSON.parse(notes);
  } catch {
    return empty;
  }
  if (!value || typeof value !== "object" || !Object.hasOwn(value, "garden_os"))
    return empty;
  if (
    value.garden_os !== 1 ||
    typeof value.notes !== "string" ||
    !Array.isArray(value.plants) ||
    !Array.isArray(value.entries)
  )
    throw new Error(
      "This space uses an unsupported record format. Export a backup before editing it.",
    );
  for (const p of value.plants) {
    if (
      !p ||
      typeof p.id !== "string" ||
      typeof p.name !== "string" ||
      typeof p.variety !== "string" ||
      !Number.isInteger(p.quantity) ||
      p.quantity < 1 ||
      p.quantity > 10000 ||
      !Number.isFinite(p.spacing) ||
      p.spacing <= 0 ||
      typeof p.planted !== "string" ||
      !["Growing", "Planned", "Finished"].includes(p.status)
    )
      throw new Error(
        "A saved plant record is invalid. Export a backup before editing this space.",
      );
  }
  for (const e of value.entries) {
    if (
      !e ||
      typeof e.id !== "string" ||
      !["Note", "Watering", "Harvest", "Pests"].includes(e.kind) ||
      typeof e.date !== "string" ||
      typeof e.text !== "string"
    )
      throw new Error(
        "A saved log record is invalid. Export a backup before editing this space.",
      );
  }
  return value as SpaceDetails;
}

export function spaceArea(
  space: Pick<Space, "type" | "diameter_inches" | "length_feet" | "width_feet">,
): number {
  if (["Container", "Growing Bag"].includes(space.type))
    return Math.PI * ((Number(space.diameter_inches) || 0) / 24) ** 2;
  return (Number(space.length_feet) || 0) * (Number(space.width_feet) || 0);
}

export function spaceSummary(space: Space) {
  const details = readDetails(space.notes);
  const active = details.plants.filter((p) => p.status !== "Finished");
  const occupied = active.reduce(
    (sum, p) => sum + p.quantity * (p.spacing / 12) ** 2,
    0,
  );
  const area = spaceArea(space);
  return {
    plants: active.reduce((sum, p) => sum + p.quantity, 0),
    capacity: area > 0 ? Math.round((occupied / area) * 100) : null,
    area,
    occupied,
    details,
  };
}

export function gridCapacity(
  length: number,
  width: number,
  spacing: number,
): number | null {
  if (![length, width, spacing].every((n) => Number.isFinite(n) && n > 0))
    return null;
  return (
    Math.floor((length * 12) / spacing) * Math.floor((width * 12) / spacing)
  );
}

export function spaceSize(space: Space): string {
  if (["Container", "Growing Bag"].includes(space.type))
    return space.diameter_inches
      ? `${space.diameter_inches}-inch diameter`
      : "Dimensions not set";
  return space.length_feet && space.width_feet
    ? `${space.length_feet} × ${space.width_feet} ft${space.depth_feet ? ` · ${space.depth_feet} ft deep` : ""}`
    : "Dimensions not set";
}

export function localDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Editable spacing examples retained from the existing crop-aware planner.
// The seed packet/variety's instructions take precedence.
export const cropOptions = [
  { name: "Garlic", spacing: 5 },
  { name: "Onion", spacing: 4 },
  { name: "Lettuce", spacing: 8 },
  { name: "Broccoli", spacing: 18 },
  { name: "Tomato", spacing: 24 },
  { name: "Bell Pepper", spacing: 18 },
  { name: "Hot Pepper", spacing: 18 },
  { name: "Okra", spacing: 12 },
  { name: "Strawberry", spacing: 10 },
  { name: "Sweet Potato", spacing: 12 },
  { name: "Herbs", spacing: 10 },
];
export function roundCapacity(
  diameter: number,
  spacing: number,
): number | null {
  if (![diameter, spacing].every((n) => Number.isFinite(n) && n > 0))
    return null;
  return Math.floor((Math.PI * (diameter / 2) ** 2) / spacing ** 2);
}

export function suggestedSpacing(name: string): number | undefined {
  const normalized = name.trim().toLowerCase();
  if (/\bpeppers?\b/.test(normalized)) return 18;
  return cropOptions.find(crop => crop.name.toLowerCase() === normalized)?.spacing;
}

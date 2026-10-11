"use client";

import { useState, useSyncExternalStore } from "react";
import Dialog from "@/components/ui/Dialog";
import { cropOptions, spaceTypes, type Space } from "@/lib/garden";

type Legacy = {
  id: string;
  name: string;
  type: string;
  size: string;
  plants: number;
  crop?: string;
};
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function LegacySpaces({
  gardenId,
  importedIds,
  busy,
  onImport,
}: {
  gardenId: string;
  importedIds: string[];
  busy: boolean;
  onImport: (space: Space) => void;
}) {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem("garden-os-growing-spaces") ?? "[]";
      } catch {
        return "[]";
      }
    },
    () => "[]",
  );
  const [open, setOpen] = useState(false);
  let legacy: Legacy[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      legacy = parsed.filter(
        (s) =>
          s &&
          typeof s.id === "string" &&
          typeof s.name === "string" &&
          typeof s.size === "string" &&
          typeof s.type === "string" &&
          Number.isInteger(s.plants) &&
          s.plants >= 0 &&
          s.plants <= 10000,
      );
  } catch {
    /* Old storage is never overwritten. */
  }
  if (!legacy.length || !gardenId) return null;
  function choose(item: Legacy) {
    const dimensions = item.size.match(
      /([\d.]+)\s*[×x]\s*([\d.]+)(?:\s*[×x]\s*([\d.]+))?/,
    );
    const diameter = item.size.match(/([\d.]+)[- ]?inch/i);
    const type = spaceTypes.includes(item.type as (typeof spaceTypes)[number])
      ? item.type
      : "Raised Bed";
    const round = ["Container", "Growing Bag"].includes(type);
    onImport({
      id: "import",
      garden_id: gardenId,
      name: item.name,
      type,
      length_feet: !round && dimensions ? Number(dimensions[1]) : null,
      width_feet: !round && dimensions ? Number(dimensions[2]) : null,
      depth_feet: dimensions?.[3] ? Number(dimensions[3]) : null,
      diameter_inches: round && diameter ? Number(diameter[1]) : null,
      sun_exposure: null,
      irrigation: null,
      soil_type: null,
      updated_at: "",
      notes: JSON.stringify({
        garden_os: 1,
        notes: `Imported from earlier browser space. Original size: ${item.size}`,
        plants: item.plants
          ? [
              {
                id: crypto.randomUUID(),
                name: item.crop || "Plants from earlier space",
                variety: "",
                quantity: item.plants,
                spacing:
                  cropOptions.find((c) => c.name === item.crop)?.spacing ?? 12,
                planted: "",
                status: "Growing",
              },
            ]
          : [],
        entries: [],
        sourceLegacyId: item.id,
      }),
    });
    setOpen(false);
  }
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="seasonal-link min-h-11 text-sm font-semibold underline"
      >
        Review earlier browser spaces ({legacy.length})
      </button>
      {open && (
        <Dialog
          title="Your earlier browser spaces"
          onClose={() => setOpen(false)}
        >
          <p className="seasonal-muted text-sm">
            These are records from the earlier version on this browser, which
            may include demo spaces. Choose only the ones you want in this
            garden. Review dimensions and plant spacing before saving. The
            original browser records are kept.
          </p>
          <ul className="mt-4 space-y-3">
            {legacy.map((item) => (
              <li key={item.id} className="seasonal-icon rounded-xl p-4">
                <p className="font-bold">{item.name}</p>
                <p className="seasonal-muted mt-1 text-sm">
                  {item.type} · {item.size} · {item.plants} plants
                  {item.crop ? ` · ${item.crop}` : ""}
                </p>
                <button
                  type="button"
                  disabled={busy || importedIds.includes(item.id)}
                  onClick={() => choose(item)}
                  className="seasonal-link mt-2 min-h-11 text-sm font-bold"
                >
                  {importedIds.includes(item.id)
                    ? "Already imported"
                    : "Review and import"}
                </button>
              </li>
            ))}
          </ul>
        </Dialog>
      )}
    </div>
  );
}

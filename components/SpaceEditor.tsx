"use client";

import { useRef, useState, type FormEvent } from "react";
import Dialog from "@/components/ui/Dialog";
import {
  readDetails,
  spaceTypes,
  type Space,
  type SpaceDetails,
} from "@/lib/garden";

export type SpaceInput = Omit<Space, "id" | "garden_id" | "updated_at">;
export default function SpaceEditor({
  space,
  title,
  busy,
  onSave,
  onClose,
  onAddPlant,
  onAddPhotos,
}: {
  space?: Space;
  title?: string;
  busy: boolean;
  onSave: (input: SpaceInput, photos?: File[]) => Promise<boolean>;
  onAddPhotos?: () => void;
  onClose: () => void;
  onAddPlant?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const addingPlant = useRef(false);
  const [type, setType] = useState(space?.type === "Grow Bag" ? "Grow Bag" : space?.type ?? "Raised Bed");
  const growBag = type === "Grow Bag" || type === "Growing Bag";
  const round = type === "Container";
  const [error, setError] = useState("");
  const [chosenPhotos, setChosenPhotos] = useState<File[]>([]);
  const [diameterUnit, setDiameterUnit] = useState<"inches" | "feet">("inches");
  const [depthUnit, setDepthUnit] = useState<"inches" | "feet">("feet");
  const details = space
    ? readDetails(space.notes)
    : ({ garden_os: 1, notes: "", plants: [], entries: [] } as SpaceDetails);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const dimension = (key: string) => {
      const v = form.get(key);
      return v ? Number(v) : null;
    };
    const length = dimension("length"),
      width = dimension("width"),
      diameter = dimension("diameter"),
      depth = dimension("depth");
    if (
      !name ||
      [length, width, diameter, depth].some(
        (n) => n !== null && (!Number.isFinite(n) || n <= 0 || n > 10000),
      )
    ) {
      setError("Enter a name and positive dimensions.");
      return;
    }
    if (!growBag && (round ? !diameter : !length || !width)) {
      setError("Enter the dimensions for this space.");
      return;
    }
    const gallons = dimension("gallons");
    if (growBag && (!gallons || !Number.isFinite(gallons) || gallons <= 0 || gallons > 10000)) { setError("Enter grow bag capacity in gallons."); return; }
    setError("");
    const saved = await onSave({
      name,
      type,
      length_feet: round || growBag ? null : length,
      width_feet: round || growBag ? null : width,
      diameter_inches: round && diameter !== null ? (diameterUnit === "feet" ? diameter * 12 : diameter) : growBag ? space?.diameter_inches ?? null : null,
      depth_feet: growBag ? null : round && depth !== null && depthUnit === "inches" ? depth / 12 : depth,
      sun_exposure: String(form.get("sun") || "") || null,
      irrigation: String(form.get("irrigation") || "").trim() || null,
      soil_type: String(form.get("soil") || "").trim() || null,
      notes: JSON.stringify({
        ...details,

        growBagGallons: growBag ? gallons ?? undefined : undefined,
        notes: String(form.get("notes") || "").trim(),
      }),
    }, chosenPhotos);
    if (saved) {
      if (addingPlant.current) onAddPlant?.();
      else onClose();
      addingPlant.current = false;
    }
    else
      setError(
        "The space was not saved. Check the dashboard message and try again.",
      );
  }
  return (
    <Dialog
      title={title ?? (space ? "Edit Growing Space" : "Add Growing Space")}
      onClose={onClose}
      headerActions={onAddPlant && <button type="button" disabled={busy} onClick={() => { addingPlant.current = true; formRef.current?.requestSubmit(); }} className="seasonal-button min-h-11 rounded-lg px-3 text-sm whitespace-nowrap">+ Add plant</button>}
    >
      <form ref={formRef} onSubmit={submit} className="space-y-4">
        <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
          <Field
            label="Name"
            name="name"
            value={space?.name}
            required
            maxLength={100}
            placeholder="Garlic Bed"
          />
          <label className="block text-sm font-bold">
            Type
            <select
              aria-label="Type"
              className="seasonal-input mt-1 w-full rounded-xl border p-3"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {spaceTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {growBag ? (
              <Field key="gallons" label="Capacity (gallons)" name="gallons" value={details.growBagGallons ?? undefined} type="number" required />
            ) : round ? (
              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                <Field
                  key={`diameter-${diameterUnit}`}
                  label={`Diameter (${diameterUnit})`}
                  name="diameter"
                  value={space?.diameter_inches != null ? (diameterUnit === "feet" ? space.diameter_inches / 12 : space.diameter_inches) : undefined}
                  type="number"
                  required
                />
                <label className="block text-sm font-bold">Diameter unit
                  <select className="seasonal-input mt-1 w-full rounded-xl border p-3" value={diameterUnit} onChange={e=>setDiameterUnit(e.target.value as "inches" | "feet")}>
                    <option value="inches">Inches</option><option value="feet">Feet</option>
                  </select>
                </label>
              </div>
            ) : (
              <>
                <Field
                  key="length"
                  label="Length (feet)"
                  name="length"
                  value={space?.length_feet ?? undefined}
                  type="number"
                  required
                />
                <Field
                  key="width"
                  label="Width (feet)"
                  name="width"
                  value={space?.width_feet ?? undefined}
                  type="number"
                  required
                />
              </>
            )}
            {!growBag && (round ? (
              <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                <Field key={`depth-${depthUnit}`} label={`Depth (${depthUnit}, optional)`} name="depth" value={space?.depth_feet != null ? (depthUnit === "inches" ? space.depth_feet * 12 : space.depth_feet) : undefined} type="number" />
                <label className="block text-sm font-bold">Depth unit
                  <select className="seasonal-input mt-1 w-full rounded-xl border p-3" value={depthUnit} onChange={e=>setDepthUnit(e.target.value as "inches" | "feet")}>
                    <option value="inches">Inches</option><option value="feet">Feet</option>
                  </select>
                </label>
              </div>
            ) : <Field label="Depth (feet, optional)" name="depth" value={space?.depth_feet ?? undefined} type="number" />)}

            <label className="block text-sm font-bold">
              Sun exposure
              <select
                aria-label="Sun exposure"
                name="sun"
                defaultValue={space?.sun_exposure ?? ""}
                className="seasonal-input mt-1 w-full rounded-xl border p-3"
              >
                <option value="">Not set</option>
                <option>Full sun</option>
                <option>Part sun</option>
                <option>Shade</option>
                <option>Grow lights</option>
              </select>
            </label>
          </div>
          <Field
            label="Watering setup (optional)"
            name="irrigation"
            value={space?.irrigation ?? ""}
            placeholder="Hand watering, drip irrigation…"
            maxLength={200}
          />
          <Field
            label="Soil or growing medium (optional)"
            name="soil"
            value={space?.soil_type ?? ""}
            maxLength={200}
          />
          <div className="space-y-2">
            <label className="block text-sm font-bold">Upload photos (optional)
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple className="seasonal-input mt-2 block w-full rounded-xl border p-3" onChange={e => setChosenPhotos(Array.from(e.target.files || []))} />
            </label>
            <p className="seasonal-muted text-xs">{chosenPhotos.length ? `${chosenPhotos.length} picture(s) selected. Photos will be saved with this space.` : "Choose photos from your phone or computer. Add more over time in this space’s Pictures gallery."}</p>
            {space && onAddPhotos && <button type="button" className="seasonal-outline rounded-lg border px-4 py-2 text-sm" onClick={onAddPhotos}>View progression pictures</button>}
          </div>
          <label className="block text-sm font-bold">
            Notes
            <textarea
              name="notes"
              rows={3}
              defaultValue={details.notes}
              maxLength={5000}
              className="seasonal-input mt-1 w-full rounded-xl border p-3"
            />
          </label>
          <button
            type="submit"
            onClick={() => { addingPlant.current = false; }}
            className="seasonal-button w-full rounded-xl px-5 py-3 font-bold text-white"
          >
            {busy ? "Saving…" : "Save Growing Space"}
          </button>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm font-semibold">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}

export function Field({
  label,
  name,
  value,
  type = "text",
  required = false,
  placeholder,
  maxLength,
}: {
  label: string;
  name: string;
  value?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        min={type === "number" ? "0.01" : undefined}
        max={type === "number" ? "10000" : undefined}
        step={type === "number" ? "any" : undefined}
        className="seasonal-input mt-1 w-full rounded-xl border p-3"
      />
    </label>
  );
}

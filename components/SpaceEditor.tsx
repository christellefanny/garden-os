"use client";

import { useState, type FormEvent } from "react";
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
  busy,
  onSave,
  onClose,
}: {
  space?: Space;
  busy: boolean;
  onSave: (input: SpaceInput) => Promise<boolean>;
  onClose: () => void;
}) {
  const [type, setType] = useState(space?.type ?? "Raised Bed");
  const [error, setError] = useState("");
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
    if (type === "Container" ? !diameter : !length || !width) {
      setError("Enter the dimensions for this space.");
      return;
    }
    setError("");
    const saved = await onSave({
      name,
      type,
      length_feet: type === "Container" ? null : length,
      width_feet: type === "Container" ? null : width,
      diameter_inches: type === "Container" ? diameter : null,
      depth_feet: depth,
      sun_exposure: String(form.get("sun") || "") || null,
      irrigation: String(form.get("irrigation") || "").trim() || null,
      soil_type: String(form.get("soil") || "").trim() || null,
      notes: JSON.stringify({
        ...details,
        notes: String(form.get("notes") || "").trim(),
      }),
    });
    if (saved) onClose();
    else
      setError(
        "The space was not saved. Check the dashboard message and try again.",
      );
  }
  return (
    <Dialog
      title={space ? "Edit Growing Space" : "Add Growing Space"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
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
            {type === "Container" ? (
              <Field
                key="diameter"
                label="Diameter (inches)"
                name="diameter"
                value={space?.diameter_inches ?? undefined}
                type="number"
                required
              />
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
            <Field
              label="Depth (feet, optional)"
              name="depth"
              value={space?.depth_feet ?? undefined}
              type="number"
            />
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

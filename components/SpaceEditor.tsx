"use client";

import { useState, type FormEvent } from "react";
import { validPhotoUrl } from "@/lib/space-portrait";
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
}: {
  space?: Space;
  title?: string;
  busy: boolean;
  onSave: (input: SpaceInput) => Promise<boolean>;
  onClose: () => void;
}) {
  const [type, setType] = useState(space?.type === "Grow Bag" ? "Grow Bag" : space?.type ?? "Raised Bed");
  const growBag = type === "Growing Bag";
  const round = type === "Container";
  const [error, setError] = useState("");
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
    const photoUrl=String(form.get("photoUrl")||"").trim();
    if(photoUrl && !validPhotoUrl(photoUrl)){setError("Use a valid http or https image URL, or leave the photo blank.");return;}
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
        photoUrl: photoUrl || undefined,
        growBagGallons: growBag ? gallons ?? undefined : undefined,
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
      title={title ?? (space ? "Edit Growing Space" : "Add Growing Space")}
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


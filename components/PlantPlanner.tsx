"use client";

import { useState } from "react";
import Dialog from "@/components/ui/Dialog";
import {
  cropOptions,
  gridCapacity,
  roundCapacity,
  type Space,
} from "@/lib/garden";

export default function PlantPlanner({
  spaces,
  onClose,
  onPlant,
}: {
  spaces: Space[];
  onClose: () => void;
  onPlant: (space: Space, spacing: number) => void;
}) {
  const [spaceId, setSpaceId] = useState("");
  const [shape, setShape] = useState("Rectangular bed");
  const [crop, setCrop] = useState("");
  const [length, setLength] = useState("6");
  const [width, setWidth] = useState("3");
  const [diameter, setDiameter] = useState("22");
  const [spacing, setSpacing] = useState("18");
  const [quantity, setQuantity] = useState("1");
  const selected = spaces.find((s) => s.id === spaceId);
  const round = shape === "Round container or bag";
  const capacity = round
    ? roundCapacity(Number(diameter), Number(spacing))
    : gridCapacity(Number(length), Number(width), Number(spacing));
  function select(id: string) {
    setSpaceId(id);
    const s = spaces.find((s) => s.id === id);
    if (s) {
      setLength(String(s.length_feet ?? 0));
      setWidth(String(s.width_feet ?? 0));
      setDiameter(String(s.diameter_inches ?? 0));
      setShape(
        ["Container", "Growing Bag"].includes(s.type)
          ? "Round container or bag"
          : "Rectangular bed",
      );
    }
  }
  const valid =
    capacity !== null &&
    Number(quantity) > 0 &&
    Number.isInteger(Number(quantity));
  return (
    <Dialog title="Plant Planner" onClose={onClose}>
      <p className="seasonal-muted mb-4">
        Choose a crop or enter your own spacing. Use your seed packet or plant
        tag for the final layout.
      </p>
      <label className="block text-sm font-bold">
        Growing space
        <select
          aria-label="Growing space"
          value={spaceId}
          onChange={(e) => select(e.target.value)}
          className="seasonal-input mt-1 w-full rounded-xl border p-3"
        >
          <option value="">Try custom dimensions</option>
          {spaces
            .filter((s) => s.type !== "Hydroponic")
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Space shape
          <select
            aria-label="Space shape"
            value={shape}
            onChange={(e) => {
              setShape(e.target.value);
              setSpaceId("");
            }}
            className="seasonal-input mt-1 w-full rounded-xl border p-3"
          >
            <option>Rectangular bed</option>
            <option>Round container or bag</option>
          </select>
        </label>
        <label className="block text-sm font-bold">
          Crop
          <select
            aria-label="Crop"
            value={crop}
            onChange={(e) => {
              setCrop(e.target.value);
              const preset = cropOptions.find((c) => c.name === e.target.value);
              if (preset) setSpacing(String(preset.spacing));
            }}
            className="seasonal-input mt-1 w-full rounded-xl border p-3"
          >
            <option value="">Custom spacing</option>
            {cropOptions.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {round ? (
          <NumberField
            label="Top diameter (in)"
            value={diameter}
            onChange={setDiameter}
          />
        ) : (
          <>
            <NumberField
              label="Length (ft)"
              value={length}
              onChange={setLength}
            />
            <NumberField label="Width (ft)" value={width} onChange={setWidth} />
          </>
        )}
        <NumberField
          label="Spacing (in)"
          value={spacing}
          onChange={setSpacing}
        />
        <NumberField
          label="Planned quantity"
          value={quantity}
          onChange={setQuantity}
          integer
        />
      </div>
      <div
        aria-live="polite"
        className="seasonal-icon mt-5 rounded-2xl p-5 text-center"
      >
        <p className="seasonal-muted text-sm">Estimated capacity</p>
        <p className="seasonal-heading mt-1 text-4xl font-black">
          {capacity ?? "—"}
        </p>
        <p className="mt-2">
          {!valid
            ? "Enter positive dimensions, spacing, and a whole plant quantity."
            : Number(quantity) > capacity!
              ? `Your plan exceeds capacity by ${Number(quantity) - capacity!} plants.`
              : `Your plan fits with room for ${capacity! - Number(quantity)} more plants.`}
        </p>
      </div>
      <p className="seasonal-muted mt-4 text-sm">
        {round
          ? "Round containers use an approximate surface-area estimate. Measure the top diameter; gallons describe root volume and don’t determine spacing by themselves. Root depth, airflow, and the crop’s needs still matter."
          : "Rectangular beds use a square grid. This estimates an empty bed; leave room for paths and existing plants."}{" "}
        Crop presets are starting examples; spacing is editable. Hydroponic
        setups need their own checks.
      </p>
      {selected && valid && (
        <button
          type="button"
          onClick={() => onPlant(selected, Number(spacing))}
          className="seasonal-button mt-5 w-full rounded-xl p-3 font-bold text-white"
        >
          Add a plant to {selected.name}
        </button>
      )}
    </Dialog>
  );
}

function NumberField({
  label,
  value,
  onChange,
  integer = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  integer?: boolean;
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        type="number"
        min={integer ? 1 : 0.01}
        max="10000"
        step={integer ? 1 : "any"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="seasonal-input mt-1 w-full rounded-xl border p-3"
      />
    </label>
  );
}

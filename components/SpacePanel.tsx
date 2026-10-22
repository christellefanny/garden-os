"use client";

import { useState, type FormEvent } from "react";
import type { VaultPlant } from "@/components/PlantVault";
import { plantChoices } from "@/lib/plant-picker";
import { CompanionPlanting, CompanionBedCheck } from "@/components/CompanionPlanting";
import Dialog from "@/components/ui/Dialog";
import { Field } from "@/components/SpaceEditor";
import {
  localDate,
  suggestedSpacing,
  spaceSize,
  spaceSummary,
  type Space,
  type SpaceDetails,
  type Plant,
  type Entry,
} from "@/lib/garden";

export default function SpacePanel({
  space,
  vault = [],
  busy,
  initialSpacing,
  initialCrop,
  onClose,
  onEdit,
  onSave,
}: {
  space: Space;
  vault?: VaultPlant[];
  gardenName?: string;
  busy: boolean;
  initialSpacing?: number;
  initialCrop?: string;
  onClose: () => void;
  onEdit: () => void;
  onSave: (details: SpaceDetails) => Promise<boolean>;
}) {
  const summary = spaceSummary(space),
    details = summary.details;
  const [plantEditor, setPlantEditor] = useState<string | null>(
    initialSpacing ? "new" : null,
  );
  const [selection, setSelection] = useState("");
  const choices = plantChoices(vault, "All");
  const selected = plantChoices(vault, "All").find(p => p.id === selection);
  const [plantName, setPlantName] = useState(initialCrop ?? "");
  const [plantSpacing, setPlantSpacing] = useState(String(initialSpacing ?? 12));
  const [plantStatus, setPlantStatus] = useState<Plant["status"]>("Growing");
  const suggested = suggestedSpacing(plantName);
  const [message, setMessage] = useState("");
  const [panel,setPanel]=useState("plants");
  const [removing, setRemoving] = useState<string | null>(null);
  const editedPlant = details.plants.find((p) => p.id === plantEditor);
  async function savePlant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget),
      quantity = Number(f.get("quantity")),
      spacing = Number(f.get("spacing"));
    const name = String(f.get("name") || "").trim();
    if (
      !name ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10000 ||
      !Number.isFinite(spacing) ||
      spacing <= 0 ||
      spacing > 10000
    ) {
      setMessage(
        "Use a plant name, a positive whole quantity, and positive spacing.",
      );
      return;
    }
    const variety = String(f.get("variety") || "").trim();
    const plant: Plant = {
      id: editedPlant?.id ?? crypto.randomUUID(),
      name,
      vaultPlantId: selected?.source === "vault" && selected.variety === variety ? selected.id.slice(6) : editedPlant?.name === name && editedPlant.variety === variety ? editedPlant.vaultPlantId : undefined,
      category: selected?.category || editedPlant?.category,
      variety,
      quantity,
      spacing,
      planted: String(f.get("planted") || ""),
      status: String(f.get("status")) as Plant["status"],
    };
    const saved = await onSave({
      ...details,
      plants: editedPlant
        ? details.plants.map((p) => (p.id === plant.id ? plant : p))
        : [...details.plants, plant],
    });
    setMessage(
      saved
        ? "Plant saved."
        : "Plant was not saved. Check the dashboard message.",
    );
    if (saved) setPlantEditor(null);
  }
  async function saveLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      f = new FormData(form);
    const kind = String(f.get("kind")) as Entry["kind"];
    const text = String(f.get("text") || "").trim() || `${kind} recorded.`;
    const entry: Entry = {
      id: crypto.randomUUID(),
      date: String(f.get("date")),
      kind,
      text,
    };
    const saved = await onSave({
      ...details,
      entries: [entry, ...details.entries],
    });
    setMessage(
      saved
        ? "Activity saved."
        : "Activity was not saved. Check the dashboard message.",
    );
    if (saved) form.reset();
  }
  return (
    <Dialog title={space.name} onClose={onClose}>
      <p className="seasonal-muted">
        {space.type} · {spaceSize(space)}
        {space.sun_exposure ? ` · ${space.sun_exposure}` : ""}
      </p>
      <p className="mt-2">
        {summary.plants} active/planned plants ·{" "}
        {summary.capacity === null
          ? "Set dimensions to estimate capacity"
          : `${summary.capacity}% estimated capacity`}
      </p>
      {summary.capacity !== null && <details className="capacity-explanation"><summary>How capacity is estimated</summary><p className="seasonal-muted mt-2 text-sm">
        {summary.occupied.toFixed(2)} sq ft needed ÷ {summary.area.toFixed(2)} sq ft of bed surface. Each plant uses its saved spacing × spacing; depth does not increase planting room.
        {summary.capacity > 100 && <span className="block font-bold">This plan exceeds the available surface area. Review spacing or move some plants to another space.</span>}
      </p></details>}
      {details.notes && (
        <p className="mt-3 whitespace-pre-wrap break-words">{details.notes}</p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onEdit}
        className="seasonal-link mt-3 min-h-11 font-bold underline"
      >
        Edit space details
      </button>
      {message && (
        <p role="status" className="seasonal-icon mt-3 rounded-xl p-3 text-sm">
          {message}
        </p>
      )}

      <div className="detail-tabs" role="group" aria-label="Growing space views"><button aria-pressed={panel==="plants"} onClick={()=>setPanel("plants")}>Plants</button><button aria-pressed={panel==="log"} onClick={()=>setPanel("log")}>Garden Log</button></div>
      <section hidden={panel!=="plants"} className="space-plants-panel mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="seasonal-heading text-xl font-bold">Plants</h3>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPlantEditor("new");
              setPlantName("");
              setPlantStatus("Growing");
              setSelection("");
              setPlantSpacing(String(initialSpacing ?? 12));
              setMessage("");
            }}
            className="seasonal-outline min-h-11 rounded-xl border px-3 py-2 font-bold"
          >
            + Add Plant
          </button>
        </div>
        {!details.plants.length && (
          <p className="seasonal-muted mt-3">
            No plants recorded. Add what you’re growing or planning.
          </p>
        )}
        <CompanionBedCheck plants={details.plants} />
        <ul className="mt-3 space-y-3">
          {details.plants.map((p) => (
            <li key={p.id} className="rounded-xl bg-black/5 p-4">
              <p className="break-words font-bold">
                {p.name}
                {p.variety ? ` · ${p.variety}` : ""}
              </p>
              <p className="seasonal-muted text-sm">
                {p.quantity} plants · {p.spacing}-inch spacing · {p.status}
                {p.planted ? ` · ${p.planted}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {setPlantEditor(p.id);setSelection("");setPlantName(p.name);setPlantStatus(p.status);setPlantSpacing(String(p.spacing));}}
                  className="seasonal-link min-h-11 font-bold underline"
                  aria-label={`Edit ${p.name}`}
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setRemoving(p.id)}
                  className="seasonal-muted min-h-11 underline"
                  aria-label={`Remove ${p.name}`}
                >
                  Remove
                </button>
              </div>
              <details className="mt-2"><summary className="seasonal-link cursor-pointer text-sm">Companion planting for {p.name}</summary><CompanionPlanting name={p.name} /></details>
              {removing === p.id && (
                <div className="mt-2">
                  <p className="text-sm">
                    Remove this plant record? Mark it Finished instead to keep
                    its history.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    className="seasonal-link mr-4 min-h-11 font-bold"
                    onClick={async () => {
                      if (
                        await onSave({
                          ...details,
                          plants: details.plants.filter(
                            (item) => item.id !== p.id,
                          ),
                        })
                      ) {
                        setRemoving(null);
                        setPlantEditor(null);
                        setMessage("Plant removed.");
                      }
                    }}
                  >
                    Confirm removal
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoving(null)}
                    className="min-h-11 underline"
                  >
                    Keep plant
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {plantEditor && (
          <form
            key={plantEditor}
            onChange={event => {
              const target = event.target;
              if (target instanceof HTMLInputElement && target.name === "name") setPlantName(target.value);
            }}
            onSubmit={savePlant}
            className="space-plant-form seasonal-icon mt-4 rounded-2xl p-4"
          >
            <h4 className="mb-3 font-bold">
              {editedPlant ? "Edit Plant" : "Add Plant"}
            </h4>
            <fieldset disabled={busy} className="space-y-3 disabled:opacity-60">
              <label className="block text-sm font-bold">Choose a plant
                <select aria-label="Choose a plant" value={selection} onChange={e => {
                  setSelection(e.target.value);
                  const choice = choices.find(p => p.id === e.target.value);
                  if (choice) {setPlantName(choice.name);const spacing=suggestedSpacing(choice.name);if(spacing)setPlantSpacing(String(spacing));} else {setPlantName(editedPlant?.name ?? "");}
                }} className="seasonal-input mt-1 w-full rounded-xl border p-3">
                  <option value="">Enter a custom plant below</option>
                  {selected && !choices.some(p => p.id === selected.id) && <option value={selected.id}>{selected.name} · selected</option>}
                  {["vault","catalog"].map(source => <optgroup key={source} label={source === "vault" ? "Your Plant Vault" : "Plant catalog"}>{choices.filter(p => p.source === source).map(p => <option key={p.id} value={p.id}>{p.name}{p.variety ? ` · ${p.variety}` : ""}</option>)}</optgroup>)}
                </select>
              </label>
              <p className="seasonal-muted text-sm">Choose from your Vault or the plant catalog. Catalog selections join your Vault when saved.</p>
              {selected ? <>
                <input type="hidden" name="name" value={selected.name} />
                <Field key={selected.id} name="variety" label="Variety (optional)" value={selected.variety} maxLength={100} />
              </> : <>
                <label className="block text-sm font-bold">Plant name<input name="name" value={plantName} onChange={event => setPlantName(event.target.value)} required maxLength={100} placeholder="Enter a plant not listed…" className="seasonal-input mt-1 w-full rounded-xl border p-3" /></label>
                <Field name="variety" label="Variety (optional)" value={editedPlant?.variety} maxLength={100} />
              </>}
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-bold">
                  Quantity
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    max="10000"
                    step="1"
                    defaultValue={editedPlant?.quantity ?? 1}
                    required
                    className="seasonal-input mt-1 w-full rounded-xl border p-3"
                  />
                </label>
                <label className="block text-sm font-bold">Spacing (inches)
                  <input name="spacing" type="number" min="0.01" max="10000" step="any" required value={plantSpacing} onChange={event => setPlantSpacing(event.target.value)} className="seasonal-input mt-1 w-full rounded-xl border p-3" />
                </label>
              </div>
              <p className="seasonal-muted text-xs">
                Spacing is the distance between plant centers, in inches—not the number of plants. Follow your seed packet or variety’s instructions.
                {suggested !== undefined && <span className="mt-2 block">Suggested starting spacing: {suggested} inches. <button type="button" onClick={() => setPlantSpacing(String(suggested))} className="seasonal-link min-h-11 font-bold underline">Use {suggested}-inch spacing</button></span>}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  name="planted"
                  label="Planting date (optional)"
                  value={editedPlant?.planted ?? ""}
                  type="date"
                />
                <label className="block text-sm font-bold">
                  Status
                  <select
                    aria-label="Status"
                    name="status"
                    value={plantStatus}
                    onChange={event => setPlantStatus(event.target.value as Plant["status"])}
                    className="seasonal-input mt-1 w-full rounded-xl border p-3"
                  >
                    <option>Growing</option>
                    <option>Planned</option>
                    <option>Finished</option>
                  </select>
                </label>
              </div>
              <CompanionBedCheck plants={details.plants} candidate={plantName} excludeId={editedPlant?.id} candidateStatus={plantStatus} />
              {plantName.trim() && <details><summary className="seasonal-link cursor-pointer text-sm">See companion guide for {plantName}</summary><CompanionPlanting name={plantName} /></details>}
              <div className="flex flex-wrap gap-3">
                <button
                  className="seasonal-button rounded-xl px-4 py-3 font-bold text-white"
                  type="submit"
                >
                  {busy ? "Saving…" : "Save Plant"}
                </button>
                <button
                  type="button"
                  onClick={() => setPlantEditor(null)}
                  className="min-h-11 px-3 underline"
                >
                  Cancel
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </section>

      <section hidden={panel!=="log"} className="space-log-panel mt-6">
        <h3 className="seasonal-heading text-xl font-bold">Garden Log</h3>
        <form onSubmit={saveLog} className="mt-3 space-y-3">
          <fieldset disabled={busy} className="space-y-3 disabled:opacity-60">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                Activity
                <select
                  aria-label="Activity"
                  name="kind"
                  className="seasonal-input mt-1 w-full rounded-xl border p-3"
                >
                  <option>Note</option>
                  <option>Watering</option>
                  <option>Harvest</option>
                  <option>Pests</option>
                </select>
              </label>
              <Field
                label="Activity date"
                name="date"
                type="date"
                value={localDate()}
                required
              />
            </div>
            <label className="block text-sm font-bold">
              What happened?
              <textarea
                name="text"
                rows={2}
                maxLength={5000}
                placeholder="Picked 2 lb of tomatoes, watered the bed…"
                className="seasonal-input mt-1 w-full rounded-xl border p-3"
              />
            </label>
            <p className="seasonal-muted text-xs">
              Description is optional. Save Plant above saves your plant without a garden log entry.
            </p>
            <button
              type="submit"
              className="seasonal-button rounded-xl px-4 py-3 font-bold text-white"
            >
              {busy ? "Saving…" : "Save Activity"}
            </button>
          </fieldset>
        </form>
        {!details.entries.length && (
          <p className="seasonal-muted mt-4">No activity recorded yet.</p>
        )}
        <ul className="mt-4 space-y-3">
          {details.entries.map((e) => (
            <li key={e.id} className="rounded-xl bg-black/5 p-4">
              <p className="text-sm font-bold">
                {e.kind} · {e.date}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words">{e.text}</p>
            </li>
          ))}
        </ul>
      </section>
      <details className="mt-6 border-t border-[var(--border)] pt-4">
        <summary className="min-h-11 cursor-pointer font-bold">
          Archive this space
        </summary>
        <p className="seasonal-muted mt-2 text-sm">
          Archive removes this space from active totals. Its plants and log are
          kept, and you can restore it.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (await onSave({ ...details, archived: true })) onClose();
          }}
          className="seasonal-outline mt-3 rounded-xl border px-4 py-3 font-bold"
        >
          Archive Space
        </button>
      </details>
    </Dialog>
  );
}

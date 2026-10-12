"use client";

import { useMemo, useState, type FormEvent } from "react";
import Dialog from "@/components/ui/Dialog";
import PlantReminders from "@/components/PlantReminders";
import PhoneReminders from "@/components/PhoneReminders";
import {
  loadCalendarOptions,
  reminderSnapshot,
  type CalendarOptions,
} from "@/lib/growing-calendar";
import PlantPortrait from "@/components/PlantPortrait";
import { readVaultBackup, mergeVaultPlants } from "@/lib/vault-transfer";

export type VaultPlant = {
  id: string;
  name: string;
  variety: string;
  category: string;
  statuses: string[];
  source: string;
  year: string;
  notes: string;
  photoUrl?: string;
};

const statuses = [
  "Growing Now",
  "Have Seeds",
  "Have Plant",
  "Wishlist",
  "Previously Grown",
  "Not Growing Again",
];
const categories = [
  "Vegetable",
  "Herb",
  "Flower",
  "Fruit & Berry",
  "Houseplant / Indoor",
  "Other",
];
const keyFor = (userId: string) => `garden-os-plant-vault-${userId}`;
export default function PlantVault({
  userId,
  onClose,
  initialQuery="",
}: {
  userId: string;
  onClose: () => void;
  initialQuery?:string;
}) {
  const [plants, setPlants] = useState<VaultPlant[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(keyFor(userId));
      if (raw) return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  });
  const [calendar, setCalendar] = useState(() => loadCalendarOptions(userId));
  const reminderTasks = useMemo(
    () => reminderSnapshot(plants, calendar),
    [plants, calendar],
  );
  function saveCalendar(next: CalendarOptions) {
    try {
      localStorage.setItem(
        `garden-os-calendar-${userId}`,
        JSON.stringify(next),
      );
      setCalendar(next);
      return true;
    } catch {
      setTransferMessage("Could not save your reminder in this browser.");
      return false;
    }
  }
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState("All");
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const viewedPlant = plants.find((p) => p.id === viewing);
  const [editing, setEditing] = useState<VaultPlant | null>(null);
  const [transferMessage, setTransferMessage] = useState("");
  const [pendingImport, setPendingImport] = useState<VaultPlant[] | null>(null);
  function save(next: VaultPlant[]) {
    try {
      localStorage.setItem(keyFor(userId), JSON.stringify(next));
      setPlants(next);
      return true;
    } catch {
      setTransferMessage(
        "Your browser could not save this collection. Export a backup before trying again.",
      );
      return false;
    }
  }
  function exportVault() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              garden_os_plant_vault: 1,
              exported_at: new Date().toISOString(),
              plants,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "garden-os-plant-vault.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function chooseBackup(file?: File) {
    setPendingImport(null);
    setTransferMessage("");
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Choose a backup smaller than 5 MB.");
      setPendingImport(readVaultBackup(await file.text()));
    } catch (error) {
      setTransferMessage(
        error instanceof Error ? error.message : "Could not read this backup.",
      );
    }
  }
  function importVault() {
    if (!pendingImport) return;
    const result = mergeVaultPlants(plants, pendingImport);
    try {
      localStorage.setItem(
        `${keyFor(userId)}-before-import`,
        JSON.stringify(plants),
      );
    } catch {
      setTransferMessage(
        "Could not create a safety backup. Nothing was imported.",
      );
      return;
    }
    if (save(result.plants)) {
      setPendingImport(null);
      setQuery("");
      setFilter("All");
      setTransferMessage(
        `Imported ${result.added} new plants. Matching entries were combined without duplicating them.`,
      );
    }
  }
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    if (!name) return;
    const plant: VaultPlant = {
      id: editing?.id || crypto.randomUUID(),
      name,
      variety: String(f.get("variety") || "").trim(),
      category: String(f.get("category") || "Other"),
      statuses: f.getAll("status").map(String),
      source: String(f.get("source") || "").trim(),
      year: String(f.get("year") || "").trim(),
      notes: String(f.get("notes") || "").trim(),
      photoUrl: String(f.get("photoUrl") || "").trim(),
    };
    if (
      save(
        editing
          ? plants.map((p) => (p.id === plant.id ? plant : p))
          : [plant, ...plants],
      )
    ) {
      setAdding(false);
      setEditing(null);
    }
  }
  const shown = useMemo(
    () =>
      plants
        .filter((p) => {
          const matches =
            !query ||
            `${p.name} ${p.variety} ${p.category} ${p.statuses.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase());
          const status =
            filter === "All" ||
            (filter === "Seeds"
              ? p.statuses.includes("Have Seeds")
              : filter === "Wishlist"
                ? p.statuses.includes("Wishlist")
                : filter === "Growing"
                  ? p.statuses.includes("Growing Now")
                  : filter === "Past"
                    ? p.statuses.includes("Previously Grown")
                    : p.category === filter);
          return matches && status;
        })
        .sort(
          (a, b) =>
            a.name
              .trim()
              .localeCompare(b.name.trim(), "en", {
                sensitivity: "base",
                numeric: true,
              }) ||
            a.variety
              .trim()
              .localeCompare(b.variety.trim(), "en", {
                sensitivity: "base",
                numeric: true,
              }),
        ),
    [plants, query, filter],
  );
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow seasonal-muted">Your growing collection</p>
          <h2 className="editorial-title seasonal-heading mt-2 text-4xl">
            Plant Vault
          </h2>
          <p className="seasonal-muted mt-2 max-w-2xl">
            A botanical record of your vegetables, herbs, flowers, and future
            plantings.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAdding(true)}
            className="seasonal-button rounded-xl px-5 py-3 font-bold text-white"
          >
            + Add plant
          </button>
          <button
            onClick={onClose}
            className="seasonal-outline rounded-xl border px-4 py-3 font-bold"
          >
            Back to garden
          </button>
        </div>
      </div>
      <div className="seasonal-card mt-5 rounded-2xl border p-4">
        <p className="seasonal-muted text-sm">
          Moving between Garden OS links? Export your collection from the old
          page, then import it here. Your original collection stays on the old
          page.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={exportVault}
            className="seasonal-outline rounded-xl border px-4 py-2 text-sm font-bold"
          >
            Export Plant Vault
          </button>
          <label className="min-w-0 max-w-full text-sm font-bold">
            Import Plant Vault
            <input
              aria-label="Import Plant Vault backup"
              type="file"
              accept=".json,application/json"
              className="mt-1 block max-w-full text-sm"
              onChange={(e) => {
                void chooseBackup(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {pendingImport && (
          <div className="mt-3">
            <p className="text-sm">
              Ready to combine {pendingImport.length} plants with your current
              collection. Existing details take priority; notes and statuses are
              combined.
            </p>
            <div className="mt-2 flex gap-3">
              <button
                onClick={importVault}
                className="seasonal-button rounded-xl px-4 py-2 text-sm font-bold text-white"
              >
                Import collection
              </button>
              <button
                onClick={() => setPendingImport(null)}
                className="seasonal-link text-sm font-bold"
              >
                Cancel import
              </button>
            </div>
          </div>
        )}
        {transferMessage && (
          <p role="status" className="mt-3 text-sm">
            {transferMessage}
          </p>
        )}
      </div>
      <div className="seasonal-card mt-6 rounded-2xl border p-4">
        <input
          aria-label="Search Plant Vault"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plants, varieties, flowers, seeds…"
          className="seasonal-input w-full rounded-xl border p-3"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {["All", "Growing", "Seeds", "Wishlist", "Past", ...categories].map(
            (x) => (
              <button
                key={x}
                onClick={() => setFilter(x)}
                className={`rounded-full border px-3 py-2 text-xs font-bold ${filter === x ? "seasonal-button text-white" : "seasonal-outline"}`}
              >
                {x}
              </button>
            ),
          )}
        </div>
      </div>
      <PhoneReminders
        userId={userId}
        tasks={reminderTasks}
        showControls={false}
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {!shown.length && (
          <div className="seasonal-card rounded-2xl border p-8 col-span-full">
            <p className="seasonal-heading text-xl font-bold">
              {plants.length
                ? "Nothing matches this view yet."
                : "Your vault is ready for its first plant."}
            </p>
            <p className="seasonal-muted mt-2">
              Add something you grow now, seeds you already own, an old
              favorite, or something on your wishlist.
            </p>
          </div>
        )}
        {shown.map((p) => (
          <article
            key={p.id}
            className="seasonal-card relative rounded-2xl border p-5 transition hover:shadow-md"
          >
            <PlantPortrait
              key={`${p.name}-${p.variety}-${p.photoUrl}`}
              name={p.name}
              variety={p.variety}
              photoUrl={p.photoUrl}
            />
            <div className="mt-4 flex justify-between gap-3">
              <div>
                <p className="eyebrow seasonal-muted">{p.category}</p>
                <h3 className="seasonal-heading mt-1 text-xl font-bold">
                  {p.name}
                </h3>
                {p.variety && (
                  <p className="seasonal-muted text-sm">{p.variety}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.statuses.map((s) => (
                <span
                  key={s}
                  className="seasonal-icon rounded-md px-3 py-1 text-xs font-semibold"
                >
                  {s}
                </span>
              ))}
            </div>
            {(p.source || p.year) && (
              <p className="seasonal-muted mt-4 text-xs">
                {p.source}
                {p.source && p.year ? " · " : ""}
                {p.year}
              </p>
            )}
            {p.notes && <p className="mt-3 text-sm leading-6">{p.notes}</p>}
            <button
              type="button"
              aria-label={`Open ${p.name}${p.variety ? ` ${p.variety}` : ""}`}
              onClick={() => setViewing(p.id)}
              className="absolute inset-0 cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)]"
            />
          </article>
        ))}
      </div>
      {viewedPlant && (
        <Dialog
          title={[viewedPlant.name, viewedPlant.variety]
            .filter(Boolean)
            .join(" · ")}
          onClose={() => setViewing(null)}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow seasonal-muted">{viewedPlant.category}</p>
            <button
              type="button"
              aria-label={`Edit ${viewedPlant.name}${viewedPlant.variety ? ` ${viewedPlant.variety}` : ""}`}
              onClick={() => {
                setViewing(null);
                setEditing(viewedPlant);
              }}
              className="seasonal-button rounded-xl px-4 py-3 font-bold text-white"
            >
              Edit
            </button>
          </div>
          <div className="mt-4">
            <PlantPortrait
              name={viewedPlant.name}
              variety={viewedPlant.variety}
              photoUrl={viewedPlant.photoUrl}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {viewedPlant.statuses.map((status) => (
              <span
                key={status}
                className="seasonal-icon rounded-md px-3 py-1 text-xs font-semibold"
              >
                {status}
              </span>
            ))}
          </div>
          {(viewedPlant.source || viewedPlant.year) && (
            <p className="seasonal-muted mt-4 text-sm">
              {[viewedPlant.source, viewedPlant.year]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          {viewedPlant.notes && (
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6">
              {viewedPlant.notes}
            </p>
          )}
          <PlantReminders
            key={viewedPlant.id}
            plant={viewedPlant}
            options={calendar}
            onSave={saveCalendar}
          />
        </Dialog>
      )}
      {(adding || editing) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              setAdding(false);
              setEditing(null);
            }
          }}
        >
          <form
            onSubmit={submit}
            className="seasonal-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 sm:p-8"
          >
            <div className="flex justify-between">
              <div>
                <p className="eyebrow seasonal-muted">Plant Vault</p>
                <h3 className="seasonal-heading mt-1 text-2xl font-bold">
                  {editing ? "Edit plant" : "Add to your collection"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                }}
                className="text-2xl"
              >
                ×
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold">
                Plant name
                <input
                  name="name"
                  required
                  defaultValue={editing?.name}
                  placeholder="Garlic"
                  className="seasonal-input mt-1 w-full rounded-xl border p-3"
                />
              </label>
              <label className="text-sm font-bold">
                Variety
                <input
                  name="variety"
                  defaultValue={editing?.variety}
                  placeholder="Music"
                  className="seasonal-input mt-1 w-full rounded-xl border p-3"
                />
              </label>
              <label className="text-sm font-bold">
                Category
                <select
                  name="category"
                  defaultValue={editing?.category || "Vegetable"}
                  className="seasonal-input mt-1 w-full rounded-xl border p-3"
                >
                  {categories.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-bold">
                Source / seller
                <input
                  name="source"
                  defaultValue={editing?.source}
                  placeholder="Saved, nursery, seed company…"
                  className="seasonal-input mt-1 w-full rounded-xl border p-3"
                />
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Plant photograph URL (optional)
                <input
                  name="photoUrl"
                  type="url"
                  defaultValue={editing?.photoUrl || ""}
                  placeholder="https://example.com/my-plant-photo.jpg"
                  className="seasonal-input mt-1 w-full rounded-xl border p-3"
                />
                <span className="seasonal-muted mt-1 block text-xs font-normal">
                  Paste a direct link to a photo of this plant growing. Each
                  variety can have its own picture.
                </span>
              </label>
              <label className="text-sm font-bold">
                Year acquired
                <input
                  name="year"
                  type="number"
                  min="1900"
                  max="2200"
                  defaultValue={editing?.year}
                  className="seasonal-input mt-1 w-full rounded-xl border p-3"
                />
              </label>
            </div>
            <fieldset className="mt-5">
              <legend className="text-sm font-bold">
                What describes this plant?
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {statuses.map((s) => (
                  <label
                    key={s}
                    className="seasonal-icon flex cursor-pointer items-center gap-2 rounded-xl p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="status"
                      value={s}
                      defaultChecked={editing?.statuses.includes(s)}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-5 block text-sm font-bold">
              Notes
              <textarea
                name="notes"
                defaultValue={editing?.notes}
                rows={3}
                placeholder="Why you like it, where it grew well, what to remember…"
                className="seasonal-input mt-1 w-full rounded-xl border p-3"
              />
            </label>
            {editing && (
              <PlantReminders
                key={editing.id}
                plant={editing}
                options={calendar}
                onSave={saveCalendar}
              />
            )}
            <button className="seasonal-button mt-5 w-full rounded-xl py-3 font-bold text-white">
              Save to Plant Vault
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

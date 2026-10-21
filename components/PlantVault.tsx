"use client";

import { useMemo, useState, type FormEvent } from "react";
import InteriorHeader from "@/components/InteriorHeader";
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
  initialQuery="",
}: {
  userId: string;
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
  const [collection, setCollection] = useState("Vault");
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
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
  function deletePlant() {
    if (!pendingDelete) return;
    if (save(plants.filter((plant) => plant.id !== pendingDelete))) {
      setViewing(null);
      setEditing(null);
      setPendingDelete(null);
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
      setCollection("Vault");
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
          const categoryMatches =
            filter === "All" ||
            (filter === "Seeds" ? p.statuses.includes("Have Seeds") : p.category === filter);
          const owned = p.statuses.some((status) =>
            ["Have Seeds", "Have Plant", "Growing Now"].includes(status),
          );
          const collectionMatches = collection === "Wishlist"
            ? p.statuses.includes("Wishlist")
            : owned || !p.statuses.includes("Wishlist");
          return matches && categoryMatches && collectionMatches;
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
    [plants, query, filter, collection],
  );
  return (
    <section className="interior-page vault-page atelier-welcoming-page">
      <InteriorHeader illustration="vault" title="Plant Vault" eyebrow="A little collection. Endless possibility." description="The varieties you love, the seeds you’re saving, and the plants you can’t wait to grow.">
        <button onClick={() => setAdding(true)} className="seasonal-button">Add plant</button>
      <div className="header-tools">
        <button type="button" popoverTarget="vault-collection-tools" className="seasonal-outline">Collection tools</button>
      <div id="vault-collection-tools" popover="auto" className="vault-tools-popup seasonal-card rounded-xl border p-5">
        <p className="seasonal-muted text-sm">
          Your collection syncs with your account when cloud storage is connected. Keep an optional backup or combine a collection saved at an older Garden OS address.
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
      </div>
      </InteriorHeader>
      <div className="collection-tabs" role="group" aria-label="Plant Vault sections">
        {[
          { value: "Vault", label: "In My Vault" },
          { value: "Wishlist", label: "Wishlist" },
        ].map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setCollection(value);
              setFilter("All");
              setQuery("");
            }}
            aria-pressed={collection === value}
            className={`collection-tab ${collection === value ? "is-active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="interior-toolbar vault-toolbar">
        <input
          aria-label="Search Plant Vault"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search plants, varieties, flowers, seeds…"
          className="seasonal-input w-full rounded-xl border p-3"
        />
        <div className="collection-tabs" role="group" aria-label="Filter collection">
          {["All", "Seeds", ...categories].map(
            (x) => (
              <button
                key={x}
                type="button"
                onClick={() => setFilter(x)}
                aria-pressed={filter === x}
                className={`collection-tab ${filter === x ? "is-active" : ""}`}
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
      <div className="collection-results"><p>{shown.length} {shown.length===1?"variety":"varieties"} · Alphabetical order</p></div>
      <div className="vault-collection-grid">
        {!shown.length && (
          <div className="seasonal-card rounded-2xl border p-8 col-span-full">
            <p className="seasonal-heading text-xl font-bold">
              {plants.length
                ? collection === "Wishlist" ? "Your wishlist is ready for its first plant." : "Nothing matches this view yet."
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
            className="vault-plant-card"
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
              {p.statuses.slice(0,2).map((s) => (
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
            <button
              type="button"
              onClick={() => setPendingDelete(viewedPlant.id)}
              className="rounded-xl border border-red-300 px-4 py-3 font-bold text-red-700"
            >
              Delete plant
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
      {pendingDelete && (
        <Dialog title="Delete this plant?" onClose={() => setPendingDelete(null)}>
          <p className="text-sm leading-6">
            Remove <strong>{[plants.find((p) => p.id === pendingDelete)?.name, plants.find((p) => p.id === pendingDelete)?.variety].filter(Boolean).join(" · ")}</strong> from your Plant Vault? This cannot be undone.
          </p>
          <p className="seasonal-muted mt-2 text-sm">
            This only removes the Plant Vault entry. It does not delete your garden beds or growing spaces.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button type="button" className="seasonal-outline rounded-xl px-4 py-3 font-bold" onClick={() => setPendingDelete(null)}>Cancel</button>
            <button type="button" className="rounded-xl bg-red-700 px-4 py-3 font-bold text-white" onClick={deletePlant}>Yes, delete plant</button>
          </div>
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
                      defaultChecked={editing
                        ? editing.statuses.includes(s)
                        : s === (collection === "Wishlist"
                          ? "Wishlist"
                          : filter === "Seeds" ? "Have Seeds" : "Have Plant")}
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

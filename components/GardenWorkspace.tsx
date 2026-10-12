"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import LegacySpaces from "@/components/LegacySpaces";
import { connectGardenPlants } from "@/lib/connected-garden";
import { useCloudData } from "@/components/CloudDataBoundary";
import {
  ConservatoryNavigation,
  ConservatoryTopbar,
  ModernDashboard,
  TasksPage,
  JournalPage,
  useVault,
  type Destination,
} from "@/components/ConservatoryUI";
import NewGardenModal from "@/components/NewGardenModal";
import SpaceEditor, { type SpaceInput } from "@/components/SpaceEditor";
import SpacePanel from "@/components/SpacePanel";
import PlantPlanner from "@/components/PlantPlanner";
import GrowingCalendar from "@/components/GrowingCalendar";
import PlantVault from "@/components/PlantVault";
import { layoutSpaceDrafts, type Bed } from "@/lib/garden-layout";
import GardenLayout from "@/components/GardenLayout";
import {
  spaceSize,
  spaceSummary,
  type Garden,
  type Space,
  type SpaceDetails,
} from "@/lib/garden";

function inspect(space: Space) {
  try {
    return { ...spaceSummary(space), error: "" };
  } catch (error) {
    return {
      plants: 0,
      capacity: null,
      area: 0,
      details: null,
      error: error instanceof Error ? error.message : "Unsupported record",
    };
  }
}

export default function GardenWorkspace({
  initialGardens,
  initialSpaces,
  initialError,
  userId,
  onSignOut,
}: {
  initialGardens: Garden[];
  initialSpaces: Space[];
  initialError: string;
  userId: string;
  onSignOut: () => Promise<void>;
}) {
  const sync = useCloudData();
  const [page, setPage] = useState<Destination>(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("view") === "calendar"
      ? "Growing Calendar"
      : "Dashboard",
  );
  const [vaultQuery,setVaultQuery]=useState("");
  const [search, setSearch] = useState("");
  const vault = useVault(userId, page);
  const [gardens, setGardens] = useState(initialGardens);
  const [storedSpaces, setSpaces] = useState(initialSpaces);
  const spaces = useMemo(
    () =>
      storedSpaces.map((space) => {
        try {
          const d = spaceSummary(space).details;
          const plants = d.plants.map((plant) => {
            const record = vault.find((p) => p.id === plant.vaultPlantId);
            return record
              ? { ...plant, name: record.name, variety: record.variety }
              : plant;
          });
          return { ...space, notes: JSON.stringify({ ...d, plants }) };
        } catch {
          return space;
        }
      }),
    [storedSpaces, vault],
  );
  const [layoutBed, setLayoutBed] = useState<string | undefined>();
  const [gardenId, setGardenId] = useState(initialGardens[0]?.id ?? "");
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [importCandidate, setImportCandidate] = useState<Space | null>(null);
  const [editor, setEditor] = useState<"new" | string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [plantSpacing, setPlantSpacing] = useState<number | undefined>();
  const [planner, setPlanner] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("view") === "calendar",
  );
  const [vaultOpen, setVaultOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [gardenForm, setGardenForm] = useState<"new" | "edit" | null>(
    initialGardens.length ? null : "new",
  );
  function navigate(next: Destination) {
    setPage(next);
    setVaultOpen(next === "Plant Vault");
    setLayoutOpen(next === "Garden Layout");
    setCalendarOpen(next === "Growing Calendar");
    setSearch("");
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  const [loaded, setLoaded] = useState(!initialError);
  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const saved = localStorage.getItem(`garden-os-active-garden-${userId}`);
        if (initialGardens.some((g) => g.id === saved)) setGardenId(saved!);
      } catch {
        /* Garden selection remains available for this visit. */
      }
    });
  }, [initialGardens, userId]);
  const garden = gardens.find((g) => g.id === gardenId);
  const gardenSpaces = spaces.filter((s) => s.garden_id === gardenId);
  const summaries = useMemo(
    () => new Map(spaces.map((s) => [s.id, inspect(s)])),
    [spaces],
  );
  const activeSpaces = gardenSpaces.filter(
    (s) => !summaries.get(s.id)?.details?.archived,
  );
  const archivedSpaces = gardenSpaces.filter(
    (s) => summaries.get(s.id)?.details?.archived,
  );
  const recentEntries = activeSpaces
    .flatMap((s) =>
      (summaries.get(s.id)?.details?.entries ?? []).map((e) => ({
        ...e,
        space: s,
      })),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const opened = activeSpaces.find((s) => s.id === openId);
  const editing = activeSpaces.find((s) => s.id === editor);

  function selectGarden(id: string) {
    setGardenId(id);
    setOpenId(null);
    setEditor(null);
    setGardenForm(null);
    setNotice("");
    try {
      localStorage.setItem(`garden-os-active-garden-${userId}`, id);
    } catch {
      /* Selection works without browser storage. */
    }
  }
  async function reload() {
    setBusy(true);
    try {
      const g = await supabase
        .from("gardens")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (g.error) throw new Error(g.error.message);
      const ids = g.data.map((item) => item.id);
      const s = ids.length
        ? await supabase
            .from("growing_spaces")
            .select("*")
            .in("garden_id", ids)
            .order("created_at", { ascending: true })
        : { data: [], error: null };
      if (s.error) throw new Error(s.error.message);
      setGardens(g.data as Garden[]);
      setSpaces(s.data as Space[]);
      setLoaded(true);
      setError("");
      setNotice("Saved garden refreshed.");
      if (!g.data.some((item) => item.id === gardenId))
        setGardenId(g.data[0]?.id ?? "");
    } catch (error) {
      setError(
        `Could not refresh: ${error instanceof Error ? error.message : "Connection failed"}`,
      );
    } finally {
      setBusy(false);
    }
  }
  async function saveSpace(
    input: SpaceInput,
    existing?: Space,
  ): Promise<boolean> {
    if (busy || !garden || !loaded) return false;
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const query = existing
        ? supabase
            .from("growing_spaces")
            .update({ ...input, updated_at: new Date().toISOString() })
            .eq("id", existing.id)
            .eq("garden_id", gardenId)
            .eq("updated_at", existing.updated_at)
        : supabase
            .from("growing_spaces")
            .insert({ ...input, garden_id: gardenId });
      const { data, error } = await query.select("*").maybeSingle();
      if (error) throw new Error(error.message);
      if (!data)
        throw new Error(
          "This space changed in another tab or you no longer have access. Close the editor, refresh your garden, and try again.",
        );
      setSpaces((current) =>
        existing
          ? current.map((s) => (s.id === existing.id ? (data as Space) : s))
          : [...current, data as Space],
      );
      setNotice("Changes saved.");
      return true;
    } catch (error) {
      setError(
        `Not saved: ${error instanceof Error ? error.message : "Connection failed. Your changes have not been saved."}`,
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function createLayoutSpaces(
    beds: Bed[],
    excludePeppers = true,
  ): Promise<number | null> {
    if (busy || !garden || !loaded) return null;
    setBusy(true);
    setError("");
    try {
      const current = await supabase
        .from("growing_spaces")
        .select("*")
        .eq("garden_id", gardenId);
      if (current.error) throw new Error(current.error.message);
      const drafts = layoutSpaceDrafts(
        beds,
        current.data as Space[],
        excludePeppers,
      );
      if (!drafts.length) return 0;
      const { data, error } = await supabase
        .from("growing_spaces")
        .insert(drafts.map((draft) => ({ ...draft, garden_id: gardenId })))
        .select("*");
      if (error) throw new Error(error.message);
      setSpaces((previous) => [
        ...previous.filter((space) => space.garden_id !== gardenId),
        ...(current.data as Space[]),
        ...(data as Space[]),
      ]);
      setNotice(`${data.length} growing spaces created from your layout.`);
      return data.length;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Spaces could not be saved.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function saveDetails(space: Space, details: SpaceDetails) {
    const {
      id: _id,
      garden_id: _gardenId,
      updated_at: _updated,
      ...input
    } = space;
    void _id;
    void _gardenId;
    void _updated;
    let vault = [];
    try {
      vault = JSON.parse(
        localStorage.getItem(`garden-os-plant-vault-${userId}`) || "[]",
      );
    } catch {}
    const connected = connectGardenPlants(details, vault, () =>
      crypto.randomUUID(),
    );
    const saved = await saveSpace(
      { ...input, notes: JSON.stringify(connected.details) },
      space,
    );
    if (saved) {
      try {
        localStorage.setItem(
          `garden-os-plant-vault-${userId}`,
          JSON.stringify(connected.vault),
        );
        window.dispatchEvent(new Event("garden-os-data-change"));
      } catch {
        setNotice(
          "Growing-space plants saved. Browser storage prevented updating the vault; try again after exporting a backup.",
        );
      }
    }
    return saved;
  }
  function exportGarden() {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              version: 1,
              exportedAt: new Date().toISOString(),
              garden,
              spaces: gardenSpaces,
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
    a.download = `garden-os-${garden?.year ?? "backup"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Garden backup downloaded.");
  }

  return (
    <main className="seasonal-page min-h-screen text-[var(--foreground)]">
      <ConservatoryNavigation
        page={page}
        navigate={navigate}
        onSignOut={() => void onSignOut()}
      />
      <div className="conservatory-content">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 lg:px-9">
          <ConservatoryTopbar
            location={garden?.location ?? ""}
            onSearch={setSearch}
            navigate={navigate}
          />
          {search && (
            <section className="modern-card search-results">
              <h2>Search results</h2>
              {vault
                .filter((plant) =>
                  `${plant.name} ${plant.variety} ${plant.notes}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((plant) => (
                  <button
                    key={plant.id}
                    onClick={() => navigate("Plant Vault")}
                  >
                    {plant.name} · {plant.variety} <small>Plant Vault →</small>
                  </button>
                ))}
              {activeSpaces
                .filter((space) =>
                  `${space.name} ${space.notes}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((space) => (
                  <button
                    key={space.id}
                    onClick={() => {
                      setSearch("");
                      setOpenId(space.id);
                    }}
                  >
                    {space.name}
                    <small>Growing space →</small>
                  </button>
                ))}
              <p className="empty-copy">
                Search checks your saved plants, spaces, and notes.
              </p>
            </section>
          )}
          {error&&page!=="My Gardens"&&<p role="alert" className="modern-card mb-4">{error}</p>}
          {page === "Dashboard" && (
            <ModernDashboard
              userId={userId}
              garden={garden}
              gardens={gardens}
              spaces={activeSpaces}
              vault={vault}
              navigate={navigate}
              onSpace={setOpenId}
              onVault={query=>{setVaultQuery(query);navigate("Plant Vault");}}
              onBed={(id) => {
                setLayoutBed(id);
                navigate("Garden Layout");
              }}
            />
          )}
          {page === "Tasks" && (
            <TasksPage
              spaces={activeSpaces}
              userId={userId}
              vault={vault}
              onCalendar={() => navigate("Growing Calendar")}
            />
          )}
          {page === "Journal" && (
            <JournalPage
              historySpaces={spaces}
              spaces={activeSpaces}
              busy={busy}
              onSave={saveDetails}
            />
          )}
          {page === "Settings" && (
            <section className="modern-page">
              <p className="modern-eyebrow">Make it yours</p>
              <h1>Settings</h1>
              <div className="modern-card">
                <h2>Account synchronization</h2>
                <p role="status">{sync.status}</p>
                <button
                  className="seasonal-outline border rounded-xl p-3 mt-3"
                  onClick={sync.retry}
                >
                  Retry cloud synchronization
                </button>
                {sync.conflicts.length > 0 && (
                  <p className="mt-3">
                    {sync.conflicts.length} local versions are preserved in
                    migration/conflict backups. Download a browser backup before
                    reconciling edits from another device.
                  </p>
                )}
                <button
                  className="seasonal-outline border rounded-xl p-3 mt-3 ml-3"
                  onClick={sync.download}
                >
                  Download full browser backup
                </button>
                {sync.conflicts.map((key) => (
                  <div className="mt-3 rounded-xl border p-3 text-sm" key={key}>
                    <p>
                      {key.startsWith("garden-os-plant-vault")
                        ? "Plant Vault"
                        : key.includes("calendar")
                          ? "Calendar preferences"
                          : "Saved layout"}{" "}
                      has different local and cloud versions. Your current local
                      version remains visible and backed up.
                    </p>
                    <button
                      className="seasonal-link underline min-h-11"
                      onClick={() => sync.useCloud(key)}
                    >
                      Use cloud version (keep local backup)
                    </button>
                  </div>
                ))}
                <h2 className="mt-6">Seasonal appearance</h2>
                <p>
                  Choose Automatic or a season in the top navigation. Your
                  choice is remembered.
                </p>
                <h2 className="mt-6">Your garden account</h2>
                <p>
                  {gardens.length} gardens · {spaces.length} growing spaces.
                  Manage your location and gardening year in My Gardens.
                </p>
                <button
                  className="seasonal-outline rounded-xl border px-4 py-3 mt-4"
                  onClick={() => navigate("My Gardens")}
                >
                  Manage gardens
                </button>
                <button
                  className="seasonal-button rounded-xl px-4 py-3 ml-3"
                  onClick={exportGarden}
                >
                  Download garden backup
                </button>
                <button
                  className="seasonal-outline rounded-xl border px-4 py-3 mt-4"
                  onClick={() => void onSignOut()}
                >
                  Sign out
                </button>
                <h2 className="mt-6">Phone reminders</h2>
                <p>
                  Enable, test, or turn off phone delivery in Growing Calendar →
                  Add reminder.
                </p>
                <button
                  className="seasonal-outline rounded-xl border px-4 py-3 mt-4"
                  onClick={() => navigate("Growing Calendar")}
                >
                  Notification settings
                </button>

              </div>
            </section>
          )}
          {page === "Help" && (
            <section className="modern-page">
              <h1>A little guidance</h1>
              <div className="modern-card">
                <h2>Your connected garden</h2>
                <p>
                  Start with My Gardens to create a garden and growing spaces.
                  Keep your seeds and varieties in Plant Vault. Select a layout
                  bed and link it to a growing space to see the same plants in
                  both places.
                </p>
                <h2 className="mt-6">Planning dates, not promises</h2>
                <p>
                  Calendar recommendations use adjustable frost anchors. Check
                  seed packets, soil temperature, and your local forecast.
                  Garden OS does not invent weather observations.
                </p>
                <h2 className="mt-6">Remember your season</h2>
                <p>
                  Journal records notes, watering, pests, and measured harvests.
                  Enter a quantity and unit for harvest comparisons. Previous
                  years remain visible in Season History.
                </p>
                <button
                  className="seasonal-button rounded-xl px-4 py-3 mt-4"
                  onClick={() => navigate("My Gardens")}
                >
                  Start in My Gardens
                </button>
              </div>
            </section>
          )}
          {!vaultOpen && !calendarOpen && layoutOpen && (
            <GardenLayout
              userId={userId}
              gardenId={gardenId || "planning"}
              initialBedId={layoutBed}
              gardenName={garden?.name ?? "your garden"}
              spaces={activeSpaces}
              onOpenSpace={(spaceId) => {
                setPlantSpacing(undefined);
                setOpenId(spaceId);
              }}
              onCreateSpaces={createLayoutSpaces}
              onClose={() => navigate("Dashboard")}
            />
          )}
          {calendarOpen && (
            <GrowingCalendar
              userId={userId}
              onClose={() => navigate("Dashboard")}
            />
          )}
          {vaultOpen && (
            <PlantVault key={vaultQuery} initialQuery={vaultQuery} userId={userId} onClose={() => navigate("Dashboard")} />
          )}
          {page === "My Gardens" && (
            <>
              <div
                className={
                  vaultOpen || layoutOpen || calendarOpen
                    ? "hidden"
                    : "mt-6 flex flex-wrap items-end justify-between gap-4"
                }
              >
                <label className="block min-w-0 flex-1 text-xs font-bold uppercase tracking-widest sm:max-w-sm">
                  Your garden
                  <select
                    aria-label="Your garden"
                    value={gardenId}
                    onChange={(e) => selectGarden(e.target.value)}
                    className="seasonal-input mt-2 w-full rounded-xl border px-3 py-3 text-sm font-semibold normal-case tracking-normal"
                  >
                    {!gardens.length && (
                      <option value="">Create your first garden</option>
                    )}
                    {gardens.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} · {g.year}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy || !loaded}
                    onClick={() =>
                      setGardenForm(gardenForm === "new" ? null : "new")
                    }
                    className="seasonal-link min-h-11 px-2 text-sm font-bold"
                  >
                    New garden
                  </button>
                  {garden && (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setGardenForm(gardenForm === "edit" ? null : "edit")
                        }
                        className="seasonal-link min-h-11 px-2 text-sm font-bold"
                      >
                        Edit garden
                      </button>
                      <button
                        type="button"
                        onClick={exportGarden}
                        className="seasonal-link min-h-11 px-2 text-sm font-bold"
                      >
                        Export backup
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={reload}
                    className="seasonal-outline min-h-11 rounded-xl border px-4 text-sm font-bold"
                  >
                    {busy ? "Working…" : "Refresh"}
                  </button>
                </div>
              </div>
              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-[var(--accent-2)] bg-[var(--surface)] p-4 text-sm font-semibold"
                >
                  {error}
                </div>
              )}
              {notice && (
                <p role="status" className="seasonal-muted mt-3 text-sm">
                  {notice}
                </p>
              )}
              <LegacySpaces
                gardenId={gardenId}
                busy={busy}
                importedIds={Array.from(summaries.values())
                  .map((s) => s.details?.sourceLegacyId)
                  .filter((id): id is string => !!id)}
                onImport={setImportCandidate}
              />
              {gardenForm && loaded && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
                  role="dialog"
                  aria-modal="true"
                  aria-label={
                    gardenForm === "edit" ? "Edit garden" : "New garden"
                  }
                  onPointerDown={(e) => {
                    if (e.target === e.currentTarget && !busy)
                      setGardenForm(null);
                  }}
                >
                  <div className="relative w-full max-w-2xl">
                    <button
                      type="button"
                      aria-label="Close"
                      disabled={busy}
                      onClick={() => setGardenForm(null)}
                      className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-xl font-bold hover:bg-black/10"
                    >
                      ×
                    </button>
                    <NewGardenModal
                      key={`${gardenForm}-${gardenId}`}
                      garden={gardenForm === "edit" ? garden : undefined}
                      onCancel={() => setGardenForm(null)}
                      onSaved={(g) => {
                        setGardens((current) => [
                          g,
                          ...current.filter((item) => item.id !== g.id),
                        ]);
                        selectGarden(g.id);
                        setNotice("Garden saved.");
                      }}
                    />
                  </div>
                </div>
              )}
              <section className="mt-10">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow seasonal-muted">Make room to grow</p>
                    <h2 className="seasonal-heading mt-2 text-3xl font-bold">
                      Growing Spaces
                    </h2>
                    <p className="seasonal-muted mt-2 text-sm">
                      {garden?.location ? `${garden.location} · ` : ""}
                      {garden?.hardiness_zone
                        ? `Zone ${garden.hardiness_zone} · `
                        : ""}
                      Beds, containers, and the plants you’re tending.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!garden || busy || !loaded}
                    onClick={() => setEditor("new")}
                    className="seasonal-button rounded-xl px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Add Growing Space
                  </button>
                </div>
                {!activeSpaces.length && (
                  <div className="seasonal-card mt-6 rounded-3xl border p-8">
                    <p className="seasonal-heading text-xl font-bold">
                      A little space. A lot of possibility.
                    </p>
                    <p className="seasonal-muted mt-2">
                      {garden
                        ? "Add your first bed or container. Your spaces and plant records will stay together in your account."
                        : "Create a garden to start planning your beds and containers."}
                    </p>
                  </div>
                )}
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  {activeSpaces.map((s) => {
                    const summary = summaries.get(s.id)!;
                    return (
                      <article
                        key={s.id}
                        className="seasonal-card rounded-3xl border p-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="eyebrow seasonal-muted">{s.type}</p>
                            <h3 className="seasonal-heading mt-2 break-words text-2xl font-bold">
                              <button
                                type="button"
                                disabled={!!summary.error}
                                onClick={() => {
                                  setPlantSpacing(undefined);
                                  setOpenId(s.id);
                                }}
                                className="min-h-11 max-w-full rounded-lg text-left break-words hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--primary)] disabled:cursor-not-allowed"
                              >
                                {s.name}
                              </button>
                            </h3>
                          </div>
                          {(summary.capacity ?? 0) >= 75 && (
                            <span className="rounded-full bg-[var(--highlight)] px-3 py-1 text-xs font-bold text-[var(--foreground)]">
                              Review spacing
                            </span>
                          )}
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-[var(--primary-soft)]/50 p-4">
                          <div>
                            <p className="seasonal-muted text-xs">Dimensions</p>
                            <p className="mt-1 text-sm font-semibold">
                              {spaceSize(s)}
                            </p>
                          </div>
                          <div>
                            <p className="seasonal-muted text-xs">
                              Active / planned plants
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {summary.error
                                ? "Unavailable"
                                : summary.plants || "Ready to plant"}
                            </p>
                          </div>
                        </div>
                        {summary.error ? (
                          <p className="mt-4 text-sm" role="alert">
                            {summary.error}
                          </p>
                        ) : (
                          <>
                            <div className="mt-5 flex items-center justify-between text-sm">
                              <span className="seasonal-muted">
                                Estimated capacity
                              </span>
                              <b>
                                {summary.capacity === null
                                  ? "Dimensions needed"
                                  : `${summary.capacity}%`}
                              </b>
                            </div>
                            <div
                              role="progressbar"
                              aria-label={`${s.name} estimated capacity`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Math.min(
                                summary.capacity ?? 0,
                                100,
                              )}
                              aria-valuetext={
                                summary.capacity === null
                                  ? "Dimensions needed"
                                  : `${summary.capacity}% estimated capacity`
                              }
                              className="mt-2 h-2 overflow-hidden rounded-full bg-black/10"
                            >
                              <div
                                className={`h-full rounded-full ${(summary.capacity ?? 0) >= 100 ? "bg-[var(--accent-2)]" : (summary.capacity ?? 0) >= 75 ? "bg-[var(--highlight)]" : "seasonal-progress"}`}
                                style={{
                                  width: `${Math.min(summary.capacity ?? 0, 100)}%`,
                                }}
                              />
                            </div>
                          </>
                        )}
                      </article>
                    );
                  })}
                </div>
                {!!archivedSpaces.length && (
                  <details className="seasonal-card mt-5 rounded-2xl border p-5">
                    <summary className="cursor-pointer font-bold">
                      Archived spaces ({archivedSpaces.length})
                    </summary>
                    <ul className="mt-3 space-y-3">
                      {archivedSpaces.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-3"
                        >
                          <span>{s.name}</span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              saveDetails(s, {
                                ...summaries.get(s.id)!.details!,
                                archived: false,
                              })
                            }
                            className="seasonal-link min-h-11 font-bold"
                          >
                            Restore {s.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </section>
              <section className="seasonal-card mt-10 flex flex-col justify-between gap-5 rounded-3xl border p-7 sm:flex-row sm:items-center">
                <div>
                  <p className="eyebrow seasonal-muted">A thoughtful plan</p>
                  <h2 className="seasonal-heading mt-2 text-2xl font-bold">
                    Give every plant room to thrive.
                  </h2>
                  <p className="seasonal-muted mt-2">
                    Try bed dimensions and plant spacing before you plant.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlanner(true)}
                  className="seasonal-outline shrink-0 rounded-xl border px-5 py-3 font-bold"
                >
                  Open Plant Planner
                </button>
              </section>
              <section className="mt-10">
                <p className="eyebrow seasonal-muted">
                  Little observations, lasting knowledge
                </p>
                <h2 className="seasonal-heading mt-2 text-3xl font-bold">
                  Recent Garden Activity
                </h2>
                <p className="seasonal-muted mt-2 text-sm">
                  Record watering, harvests, pest observations, and notes inside
                  any growing space.
                </p>
                <ul className="mt-5 space-y-3">
                  {recentEntries.map((e) => (
                    <li
                      key={`${e.space.id}-${e.id}`}
                      className="seasonal-card flex flex-col justify-between gap-3 rounded-2xl border p-5 sm:flex-row"
                    >
                      <div className="min-w-0">
                        <p className="eyebrow seasonal-muted">
                          {e.date} · {e.kind}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap break-words">
                          {e.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPlantSpacing(undefined);
                          setOpenId(e.space.id);
                        }}
                        className="seasonal-link shrink-0 text-sm font-bold"
                      >
                        {e.space.name} ↗
                      </button>
                    </li>
                  ))}
                </ul>
                {!recentEntries.length && (
                  <p className="seasonal-muted mt-4 rounded-2xl border border-dashed border-[var(--border)] p-6">
                    Your garden story starts with your first observation.
                  </p>
                )}
              </section>
              <footer className="seasonal-muted mt-12 border-t border-[var(--border)] pt-5 text-sm">
                Garden OS · Grow smarter. Harvest better.{" "}
                <span className="block mt-1">
                  Your garden records sync across devices. Theme and seasonal
                  checklist preferences stay on this browser.
                </span>
              </footer>
            </>
          )}
          {importCandidate && (
            <SpaceEditor
              space={importCandidate}
              title="Import Growing Space"
              busy={busy}
              onClose={() => setImportCandidate(null)}
              onSave={(input) => saveSpace(input)}
            />
          )}
          {editor && (
            <SpaceEditor
              key={editor}
              space={editing}
              busy={busy}
              onClose={() => setEditor(null)}
              onSave={(input) => saveSpace(input, editing)}
            />
          )}
          {opened && !summaries.get(opened.id)?.error && (
            <SpacePanel
              key={opened.id}
              space={opened}
              busy={busy}
              initialSpacing={plantSpacing}
              onClose={() => setOpenId(null)}
              onEdit={() => {
                setOpenId(null);
                setEditor(opened.id);
              }}
              onSave={(details) => saveDetails(opened, details)}
            />
          )}
          {planner && (
            <PlantPlanner
              spaces={activeSpaces}
              onClose={() => setPlanner(false)}
              onPlant={(space, spacing) => {
                setPlanner(false);
                setPlantSpacing(spacing);
                setOpenId(space.id);
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
}

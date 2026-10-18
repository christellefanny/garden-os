"use client";

import { useEffect, useMemo, useState } from "react";
import { GUEST_ID, readGuest, saveGuestSpaces } from "@/lib/guest";
import { supabase } from "@/lib/supabase";
import InteriorHeader from "@/components/InteriorHeader";
import GardenCollection from "@/components/GardenCollection";
import SpacePortrait from "@/components/SpacePortrait";
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
  destinations,
  type Destination,
} from "@/components/ConservatoryUI";
import NewGardenModal from "@/components/NewGardenModal";
import SpaceEditor, { type SpaceInput } from "@/components/SpaceEditor";
import SpacePanel from "@/components/SpacePanel";
import PlantPlanner from "@/components/PlantPlanner";
import GrowingCalendar from "@/components/GrowingCalendar";
import PlantVault from "@/components/PlantVault";
import FlowersPage from "@/components/FlowersPage";
import { layoutSpaceDrafts, type Bed } from "@/lib/garden-layout";
import GardenLayout from "@/components/GardenLayout";
import {
  spaceSize,
  spaceSummary,
  type Garden,
  type Space,
  type SpaceDetails,
} from "@/lib/garden";

function pageView(page: Destination) {
  return page === "Growing Calendar" ? "calendar" : page.toLowerCase().replaceAll(" ", "-");
}

function readPageFromUrl(guest = false): Destination {
  if (typeof window === "undefined") return "Dashboard";
  const view = new URLSearchParams(window.location.search).get("view");
  return destinations.find((destination) => pageView(destination) === view && (!guest || destination !== "Plant Vault")) ?? "Dashboard";
}

function readGardenPageFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "my-gardens" ? params.get("garden") : null;
}

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
  const guestMode = userId === GUEST_ID;
  const [page, setPage] = useState<Destination>(() => readPageFromUrl(guestMode));
  const [vaultQuery,setVaultQuery]=useState("");
  const [search, setSearch] = useState("");
  const vault = useVault(userId, page);
  const [allGardens, setGardens] = useState(initialGardens);
  const gardens = useMemo(() => allGardens.filter((g) => !/^garden os verification(?:\s*\(temporary\))?$/i.test(g.name.trim())), [allGardens]);
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
  const [layoutVisit,setLayoutVisit]=useState(0);
  const [layoutTemplate,setLayoutTemplate]=useState<string|undefined>();
  const [layoutBed, setLayoutBed] = useState<string | undefined>();
  const [gardenPageId, setGardenPageId] = useState<string | null>(readGardenPageFromUrl);
  const [selectedGardenId, setGardenId] = useState(initialGardens[0]?.id ?? "");
  const gardenId = gardenPageId ?? (gardens.some((g) => g.id === selectedGardenId) ? selectedGardenId : (gardens[0]?.id ?? ""));
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
      page === "Growing Calendar",
  );
  const [vaultOpen, setVaultOpen] = useState(() => page === "Plant Vault");
  const [layoutOpen, setLayoutOpen] = useState(() => page === "Garden Layout");
  const [gardenForm, setGardenForm] = useState<"new" | "edit" | null>(
    initialGardens.length ? null : "new",
  );
  function navigate(next: Destination) {
    if (guestMode && next === "Plant Vault") next = "Dashboard";
    setLayoutTemplate(undefined);
    setLayoutBed(undefined);
    if(next==="Garden Layout")setLayoutVisit(visit=>visit+1);
    const url = new URL(window.location.href);
    url.searchParams.set("view", pageView(next));
    url.searchParams.delete("garden");
    setGardenPageId(null);
    setEditor(null);
    setOpenId(null);
    setGardenForm(null);
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
    setPage(next);
    setVaultOpen(next === "Plant Vault");
    setLayoutOpen(next === "Garden Layout");
    setCalendarOpen(next === "Growing Calendar");
    setSearch("");
    window.scrollTo({ top: 0, behavior: "auto" });
  }
  useEffect(() => {
    function restorePage() {
      const next = readPageFromUrl(guestMode);
      setPage(next);
      setGardenPageId(readGardenPageFromUrl());
      setEditor(null);
      setOpenId(null);
      setGardenForm(null);
      setVaultOpen(next === "Plant Vault");
      setLayoutOpen(next === "Garden Layout");
      setCalendarOpen(next === "Growing Calendar");
      setSearch("");
    }
    window.addEventListener("popstate", restorePage);
    return () => window.removeEventListener("popstate", restorePage);
  }, [guestMode]);
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
  const opened = activeSpaces.find((s) => s.id === openId);
  const editing = activeSpaces.find((s) => s.id === editor);

  function openGarden(id: string) {
    selectGarden(id);
    const url = new URL(window.location.href);
    url.searchParams.set("view", "my-gardens");
    url.searchParams.set("garden", id);
    if (url.href !== window.location.href) window.history.pushState(null, "", url);
    setGardenPageId(id);
    setPage("My Gardens");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

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
      if (userId === GUEST_ID) {
        const local = readGuest();
        setGardens(local.gardens); setSpaces(local.spaces);
        setNotice("Garden refreshed from this device.");
        return;
      }
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
      if (userId === GUEST_ID) {
        const saved = { ...input, id: existing?.id ?? crypto.randomUUID(), garden_id: gardenId, updated_at: new Date().toISOString() } as Space;
        saveGuestSpaces([saved]);
        setSpaces(readGuest().spaces);
        setNotice("Changes saved on this device.");
        return true;
      }
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
      if (userId === GUEST_ID) {
        const drafts = layoutSpaceDrafts(beds, readGuest().spaces.filter(s => s.garden_id === gardenId), excludePeppers);
        const next = drafts.map(draft => ({ ...draft, id: crypto.randomUUID(), garden_id: gardenId, updated_at: new Date().toISOString() })) as Space[];
        saveGuestSpaces(next); setSpaces(readGuest().spaces);
        setNotice(`${next.length} growing spaces saved on this device.`);
        return next.length;
      }
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
        guest={guestMode}
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
              {(guestMode ? [] : vault)
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
              allSpaces={spaces}
              vault={vault}
              navigate={navigate}
              onGarden={openGarden}
              onNewGarden={() => { navigate("My Gardens"); setGardenForm("new"); }}
              onSpace={setOpenId}
              onEditExample={id=>{navigate("Garden Layout");setLayoutTemplate(id);setLayoutBed(undefined);}}
              onVault={query=>{setVaultQuery(query);navigate("Plant Vault");}}
              onBed={(id) => {
                navigate("Garden Layout");
                setLayoutBed(id);
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
              userId={userId}
              gardenName={garden?.name}
              historySpaces={gardenSpaces}
              spaces={activeSpaces}
              busy={busy}
              onSave={saveDetails}
            />
          )}
          {page === "Settings" && (
            <section className="interior-page settings-page">
              <InteriorHeader title="Settings" eyebrow="A garden that feels like yours" description="Your account, saved collection, appearance, and reminders — together in one calm place."/>
              <div className="settings-grid">
                <section className="settings-card"><p className="modern-eyebrow">Safe and connected</p><h2>{guestMode ? "Device storage" : "Cloud storage"}</h2><p role="status" className="sync-status">{sync.status}</p><p>{guestMode ? "Your work is saved only in this browser. Use Save to an account above to back up and sync across devices." : "Plants, layouts and calendar preferences stay with your account. Local backups protect your changes when you are offline."}</p>
                  {sync.conflicts.map(key=><div className="interior-notice" key={key}><p>{key.startsWith("garden-os-plant-vault")?"Plant Vault":key.includes("calendar")?"Calendar preferences":"Saved layout"} has local and cloud versions. Both are preserved.</p><button className="seasonal-outline" onClick={()=>sync.useCloud(key)}>Use cloud version (keep local backup)</button></div>)}
                  <details className="settings-recovery"><summary>Recovery & backups</summary><div className="settings-action-list">{!guestMode && <button onClick={sync.retry}>Retry cloud synchronization</button>}<button onClick={sync.download}>Download full browser backup</button><button onClick={exportGarden}>Download garden backup</button></div></details>
                </section>
                <section className="settings-card"><p className="modern-eyebrow">Your growing world</p><h2>Garden account</h2><p>{gardens.length} {gardens.length===1?"garden":"gardens"} · {spaces.length} {spaces.length===1?"growing space":"growing spaces"}</p><p>Manage locations, gardening years, bed dimensions and growing spaces in My Gardens.</p><div className="interior-actions"><button className="seasonal-button" onClick={()=>navigate("My Gardens")}>Manage gardens</button><button className="seasonal-outline" onClick={()=>void onSignOut()}>{guestMode ? "Leave guest garden" : "Sign out"}</button></div></section>
                <section className="settings-card appearance-card"><p className="modern-eyebrow">The rhythm of the year</p><h2>Seasonal appearance</h2><p>Choose Automatic or your favorite season in the top navigation. The conservatory stays familiar as its accents change.</p><div className="season-swatches" aria-hidden="true"><span>Spring</span><span>Summer</span><span>Fall</span><span>Winter</span></div></section>
                <section className="settings-card"><p className="modern-eyebrow">A gentle nudge</p><h2>Phone reminders</h2><p>Manage delivery, send a test, or turn notifications off from Growing Calendar → Add reminder.</p><button className="seasonal-outline" onClick={()=>navigate("Growing Calendar")}>Notification settings</button></section>
              </div>
            </section>
          )}
          {page === "Help" && (
            <section className="interior-page help-page">
              <InteriorHeader title="A little guidance" eyebrow="Grow with confidence" description="A few simple ways to make Garden Atelier part of your growing routine."/>
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
                  Garden Atelier does not invent weather observations.
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
              key={`${userId}-${gardenId || "planning"}-${layoutVisit}`}
              userId={userId}
              gardenId={gardenId || "planning"}
              initialBedId={layoutBed}
              initialTemplateId={layoutTemplate}
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
              garden={garden}
              gardens={gardens}
              location={garden?.location || undefined}
              userId={userId}
            />
          )}
          {!guestMode && vaultOpen && (
            <PlantVault key={vaultQuery} initialQuery={vaultQuery} userId={userId} />
          )}
          {page === "Flower Garden" && <FlowersPage plants={vault} />}
          {page === "My Gardens" && (
            <section className="interior-page gardens-page">
              {gardenPageId && <button type="button" onClick={() => navigate("My Gardens")} className="seasonal-outline mb-2 min-h-11 rounded-lg border px-4 text-sm">← All gardens</button>}
              {gardenPageId && !garden ? <InteriorHeader title="Garden unavailable" eyebrow="Your garden" description="Return to All gardens to choose another garden." /> : <GardenCollection
                gardens={(gardenPageId && garden ? [garden] : gardens).map((g) => {
                  const beds = spaces.filter((s) => s.garden_id === g.id && !summaries.get(s.id)?.details?.archived);
                  return { garden: g, spaces: beds.length, plants: beds.reduce((total, s) => total + (summaries.get(s.id)?.plants || 0), 0) };
                })}
                detail={Boolean(gardenPageId)}
                disabled={busy || !loaded}
                onOpen={openGarden}
                onNew={() => setGardenForm("new")}
              />}
              {gardenPageId && garden && <div
                className={
                  vaultOpen || layoutOpen || calendarOpen
                    ? "hidden"
                    : "interior-toolbar garden-selection-bar"
                }
              >
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{garden?.name || "Create your first garden"}</p><p className="seasonal-muted mt-1 text-xs">A place for your plans, plants, and progress.</p></div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={()=>navigate("Garden Layout")} className="seasonal-outline min-h-11 rounded-xl border px-4">Plan &amp; Design</button>
                  <button type="button" onClick={()=>navigate("Growing Calendar")} className="seasonal-outline min-h-11 rounded-xl border px-4">Growing calendar</button>
                  <button type="button" onClick={()=>setPlanner(true)} className="seasonal-outline min-h-11 rounded-xl border px-4">Plant planner</button>
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
              </div>}

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
              {gardenPageId && garden && <details className="vault-backup-tools"><summary>Recover older growing spaces</summary>              <LegacySpaces
                gardenId={gardenId}
                busy={busy}
                importedIds={Array.from(summaries.values())
                  .map((s) => s.details?.sourceLegacyId)
                  .filter((id): id is string => !!id)}
                onImport={setImportCandidate}
              />
</details>}
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
                      guest={userId === GUEST_ID}
                      key={`${gardenForm}-${gardenId}`}
                      garden={gardenForm === "edit" ? garden : undefined}
                      onCancel={() => setGardenForm(null)}
                      onSaved={(g) => {
                        setGardens((current) => [
                          g,
                          ...current.filter((item) => item.id !== g.id),
                        ]);
                        openGarden(g.id);
                        setNotice("Garden saved.");
                      }}
                    />
                  </div>
                </div>
              )}
              {gardenPageId && garden && <><section className="spaces-section">
                <div className="section-heading">
                  <div>

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
                <div className="growing-space-grid">
                  {activeSpaces.map((s) => {
                    const summary = summaries.get(s.id)!;
                    return (
                      <article
                        key={s.id}
                        className="growing-space-card"
                      >
                        <SpacePortrait name={s.name} details={summary.details} vault={vault}/>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="seasonal-heading break-words text-2xl font-bold">
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
                          <button type="button" disabled={busy || !!summary.error} onClick={() => { setPlantSpacing(12); setOpenId(s.id); }} className="seasonal-button rounded-lg whitespace-nowrap" style={{ minHeight: 30, padding: "5px 10px", fontSize: 12 }} aria-label={`Add plant to ${s.name}`}>+ Add plant</button>
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
                                className={`h-full rounded-full ${(summary.capacity ?? 0) > 98 ? "bg-red-600" : (summary.capacity ?? 0) >= 75 ? "bg-orange-500" : "bg-green-600"}`}
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
                  <details className="vault-backup-tools mt-5">
                    <summary>
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
              <div className="interior-related"><div><h3>Your garden journal</h3><p>Observations, watering and harvest history live together in one place.</p></div><button className="seasonal-outline" onClick={()=>navigate("Journal")}>Open Journal →</button></div></>}
              <footer className="seasonal-muted mt-12 border-t border-[var(--border)] pt-5 text-sm">
                Garden Atelier · Grow smarter. Harvest better.{" "}
                <span className="block mt-1">
                  Garden records sync across devices. Vault entries, layouts and
                  calendar settings sync when cloud storage is connected. Your
                  theme preference stays on this browser.
                </span>
              </footer>
            </section>
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
              onAddPlant={editing ? () => { setEditor(null); setPlantSpacing(12); setOpenId(editing.id); } : undefined}
              onSave={(input) => saveSpace(input, editing)}
            />
          )}
          {opened && !summaries.get(opened.id)?.error && (
            <SpacePanel
              key={opened.id}
              space={opened}
              vault={vault}
              gardenName={garden?.name ?? ""}
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import GardenHeader from "@/components/GardenHeader";
import NewGardenModal from "@/components/NewGardenModal";
import SpaceEditor, { type SpaceInput } from "@/components/SpaceEditor";
import SpacePanel from "@/components/SpacePanel";
import PlantPlanner from "@/components/PlantPlanner";
import {
  SeasonalHero,
  SeasonalGuidanceHeading,
  SeasonalShortcuts,
} from "@/components/seasonal/SeasonalDashboard";
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
  const [gardens, setGardens] = useState(initialGardens);
  const [spaces, setSpaces] = useState(initialSpaces);
  const [gardenId, setGardenId] = useState(initialGardens[0]?.id ?? "");
  const [error, setError] = useState(initialError);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState<"new" | string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [plantSpacing, setPlantSpacing] = useState<number | undefined>();
  const [planner, setPlanner] = useState(false);
  const [gardenForm, setGardenForm] = useState<"new" | "edit" | null>(
    initialGardens.length ? null : "new",
  );
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
  const warningSpaces = activeSpaces.filter(
    (s) => (summaries.get(s.id)?.capacity ?? 0) >= 80,
  );
  const badRecords = activeSpaces.filter((s) => summaries.get(s.id)?.error);
  const plantCount = activeSpaces.reduce(
    (sum, s) => sum + (summaries.get(s.id)?.plants ?? 0),
    0,
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
    return saveSpace({ ...input, notes: JSON.stringify(details) }, space);
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
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <GardenHeader gardenYear={garden?.year ?? new Date().getFullYear()} />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onSignOut}
            disabled={busy}
            className="seasonal-muted min-h-11 text-xs font-semibold underline"
          >
            Sign out
          </button>
        </div>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
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
              onClick={() => setGardenForm(gardenForm === "new" ? null : "new")}
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
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <SeasonalHero
            gardenName={garden?.name ?? "Your next chapter starts here"}
            gardenYear={garden?.year ?? new Date().getFullYear()}
            spaces={activeSpaces.length}
            plants={plantCount}
            warnings={warningSpaces.length + badRecords.length}
          />
          <aside className="seasonal-sage rounded-3xl border p-6 sm:p-7">
            <p className="eyebrow text-[var(--primary)]">
              Sage · Your garden companion
            </p>
            <div className="mt-3">
              <SeasonalGuidanceHeading />
            </div>
            <p className="mt-4 leading-7">
              {!loaded
                ? "Reconnect your garden to see guidance from your saved records."
                : badRecords.length
                  ? "Some records need attention before their plant totals can be calculated. Export a backup and review the affected spaces."
                  : warningSpaces.length
                    ? `${warningSpaces.map((s) => s.name).join(", ")} ${warningSpaces.length === 1 ? "is" : "are"} near or over the estimated capacity. Review spacing before adding more plants.`
                    : !activeSpaces.length
                      ? "Start with one growing space. Add its dimensions and plants, and we’ll help you see how much room you have."
                      : !plantCount
                        ? "Your growing spaces are ready. Record what you’re planting to build a useful history and estimate available room."
                        : "Your recorded planting plan has room to grow. Check soil moisture, watch your plants, and record changes in the garden log."}
            </p>
            <details className="mt-4">
              <summary className="seasonal-link min-h-11 cursor-pointer py-2 text-sm font-bold">
                How Sage works
              </summary>
              <p className="seasonal-muted mt-2 text-sm leading-6">
                Guidance comes from your saved dimensions and plants. Capacity
                divides the space needed for each plant’s spacing by the bed’s
                area; an alert starts at 80%. Planned and growing plants count,
                finished plants don’t. It is a planning estimate, not a
                diagnosis or a weather forecast. Containers and hydroponics need
                additional root-space checks.
              </p>
            </details>
          </aside>
        </section>
        <SeasonalShortcuts
          gardenId={`${userId}-${gardenId}`}
          enabled={!!gardenId}
        />
        {gardenForm && loaded && (
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
                        {s.name}
                      </h3>
                    </div>
                    {(summary.capacity ?? 0) >= 80 && (
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
                        aria-valuenow={Math.min(summary.capacity ?? 0, 100)}
                        aria-valuetext={
                          summary.capacity === null
                            ? "Dimensions needed"
                            : `${summary.capacity}% estimated capacity`
                        }
                        className="mt-2 h-2 overflow-hidden rounded-full bg-black/10"
                      >
                        <div
                          className="seasonal-progress h-full rounded-full"
                          style={{
                            width: `${Math.min(summary.capacity ?? 0, 100)}%`,
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPlantSpacing(undefined);
                          setOpenId(s.id);
                        }}
                        className="seasonal-link mt-5 min-h-11 font-bold"
                      >
                        Open Space <span aria-hidden="true">↗</span>
                      </button>
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
            Record watering, harvests, pest observations, and notes inside any
            growing space.
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
            Your garden records sync across devices. Theme and seasonal checklist
            preferences stay on this browser.
          </span>
        </footer>
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
    </main>
  );
}

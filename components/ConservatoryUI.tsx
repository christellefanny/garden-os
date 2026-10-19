"use client";
import Image from "next/image";
import SeasonIcon from "@/components/seasonal/SeasonIcon";
import InteriorHeader, { InteriorStats } from "@/components/InteriorHeader";
import GuestPlantingNow from "@/components/GuestPlantingNow";
import AddTaskButton from "@/components/AddTaskButton";
import GuestGardenExample from "@/components/GuestGardenExample";
import {designPlants,safeDecorations,surfaceAppearance,plantStampStyle,gardenFootprint} from "@/lib/layout-design";
import { groupReminders } from "@/lib/reminder-groups";
import { useEffect, useState } from "react";
import { useSeason } from "@/components/seasonal/SeasonProvider";
import { seasonContent, parseThemeSelection, seasons } from "@/lib/seasons";
import {
  readDetails,
  type Garden,
  type Space,
  type SpaceDetails,
} from "@/lib/garden";
import type { VaultPlant } from "@/components/PlantVault";
import PlantPortrait from "@/components/PlantPortrait";
import {
  loadCalendarOptions,
  buildGrowingTasks,
  calendarTaskYears,
  localDay,
  shiftDay,
} from "@/lib/growing-calendar";
import { dailyRecommendations } from "@/lib/connected-garden";
import { loadCustomLayouts } from "@/components/BlankGardenLayout";
import { initialLayout, nineBedLayout } from "@/lib/garden-layout";
export type Destination =
  | "Dashboard"
  | "My Gardens"
  | "Plant Vault"
  | "Flower Garden"
  | "Garden Layout"
  | "Growing Calendar"
  | "Tasks"
  | "Journal"
  | "Settings"
  | "Help";
export const destinations: Destination[] = [
  "Dashboard",
  "My Gardens",
  "Plant Vault",
  "Flower Garden",
  "Garden Layout",
  "Growing Calendar",
  "Tasks",
  "Journal",
  "Settings",
  "Help",
];
const navigationIconPaths: Record<string, string> = {
  "Dashboard": "M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7",
  "My Gardens": "M12 22V3M12 8C8 8 5 6 5 3c4 0 7 2 7 5Zm0-2c0-3 3-4 6-4 0 3-2 5-6 5M12 11l-5 2m5-2 5 3M10 16a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0M21 17a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0M4.5 13.5l2 1 2-1m7 1 2 1 2-1",
  "Plant Vault": "M12 21V9M12 14C3 14 2 7 4 4c7 0 8 5 8 10M12 11c0-7 4-9 8-8 1 6-3 9-8 8",
  "Flower Garden": "M12 8C7 1 2 7 7 11c-7 3-2 10 3 6 0 7 8 7 7 0 6 3 10-4 3-7 3-6-4-10-8-2ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  "Garden Layout": "M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z",
  "Growing Calendar": "M3 6h18v15H3V6Zm4-3v6m10-6v6M3 11h18m-13 4h2m4 0h2m-8 3h2",
  "Tasks": "M9 5h12M9 12h12M9 19h12M2 5l2 2 3-4M2 12l2 2 3-4M2 19l2 2 3-4",
  "Journal": "M4 3h15v18H4V3Zm4 0v18m3-13h5m-5 4h5m-5 4h3",
  "Photo Journal": "M3 6h5l2-3h4l2 3h5v15H3V6Zm13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  "Settings": "M10 3h4l1 3 3 1 3 3v4l-3 1-1 3-3 3h-4l-1-3-3-1-3-3v-4l3-1 1-3 3-3Zm6 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  "Help": "M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
};
export function LineIcon({ index = 0, name }: { index?: number; name?: string }) {
  const paths = [
    "M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7",
    "M12 21V9M12 14C3 14 2 7 4 4c7 0 8 5 8 10M12 11c0-7 4-9 8-8 1 6-3 9-8 8",
    "M5 20C1 6 9 3 21 3c0 13-6 19-16 17ZM5 20 17 7",
    "M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16",
    "M3 6h18v15H3V6Zm4-3v6m10-6v6M3 11h18",
    "M4 3h16v18H4V3Zm3 8 3 3 6-7",
    "M3 4c5-1 8 0 9 2 2-2 5-3 9-2v16c-4-1-7 0-9 2-2-2-5-3-9-2V4Zm9 2v16",
    "M12 3v3m0 12v3M3 12h3m12 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    "M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  ];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path
        d={name ? navigationIconPaths[name] : paths[index % paths.length]}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function ConservatoryNavigation({
  page,
  navigate,
  onSignOut,
  guest = false,
}: {
  page: Destination;
  navigate: (page: Destination) => void;
  onSignOut: () => void;
  guest?: boolean;
}) {
  return (
    <aside className="modern-sidebar">
      <button className="modern-brand" aria-label="Garden Atelier home" onClick={() => navigate("Dashboard")}>
        <span className="garden-atelier-mark" aria-hidden="true"><Image src="/garden-atelier-logo.png" width={184} height={99} alt="" /></span>
        <span className="garden-atelier-brand-tagline">PLAN · GROW · HARVEST · ENJOY</span>
      </button>
      <nav aria-label="Garden Atelier navigation">
        {destinations.filter((name) => !guest || name !== "Plant Vault").map((name) => (
          <button
            key={name}
            aria-current={page === name ? "page" : undefined}
            onClick={() => navigate(name)}
          >
            <LineIcon name={name} />
            <span>{({Dashboard:"Home","Garden Layout":"Plan & Design","Growing Calendar":"Growing Calendar",Journal:"Garden Journal"} as Record<string,string>)[name] || name}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-botany" aria-hidden="true">
        <div className="sidebar-botanical-image" />
        <p>
          “Good things
          <br />
          grow here.”
        </p>
      </div>
      <button className="modern-signout" onClick={onSignOut}>
        {guest ? "Leave guest garden" : "Sign out"}
      </button>
    </aside>
  );
}
export function ConservatoryTopbar({
  location,
  onSearch,
  navigate,
}: {
  location: string;
  onSearch: (value: string) => void;
  navigate: (page: Destination) => void;
}) {
  const { season, selection, setSelection } = useSeason();
  return (
    <header className="modern-topbar">
      <label className="modern-search">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="10" cy="10" r="6" />
          <path d="m15 15 6 6" />
        </svg>
        <input
          aria-label="Search plants and records"
          placeholder="Search plants, spaces, or notes…"
          onChange={(e) => onSearch(e.target.value)}
        />
      </label>
      <label className="modern-theme">
        <SeasonIcon season={season} />
        <select
          aria-label="Change seasonal theme"
          value={selection}
          onChange={(e) => setSelection(parseThemeSelection(e.target.value))}
        >
          <option value="automatic">Automatic</option>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {seasonContent[s].name}
            </option>
          ))}
        </select>
      </label>
      <span className="modern-location">
        {location || "Set your garden location"}
      </span>
      <button
        aria-label="Account settings"
        className="modern-account"
        onClick={() => navigate("Settings")}
      >
        <LineIcon index={7} />
      </button>
    </header>
  );
}
export function useVault(userId: string, refresh: string) {
  const [plants, setPlants] = useState<VaultPlant[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        setPlants(
          JSON.parse(
            localStorage.getItem(`garden-os-plant-vault-${userId}`) || "[]",
          ),
        );
      } catch {
        setPlants([]);
      }
    };
    read();
    window.addEventListener("garden-os-data-change", read);
    return () => window.removeEventListener("garden-os-data-change", read);
  }, [userId, refresh]);
  return plants;
}
function details(space: Space) {
  try {
    return readDetails(space.notes);
  } catch {
    return { garden_os: 1, notes: "", plants: [], entries: [] } as SpaceDetails;
  }
}
export function journalRows(spaces: Space[]) {
  return spaces
    .flatMap((space) =>
      details(space).entries.map((entry) => ({ ...entry, space })),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}
export function ModernDashboard({
  userId,
  garden,
  gardens,
  spaces,
  allSpaces,
  vault,
  navigate,
  onGarden,
  onNewGarden,
  onSpace,
  onBed,
  onVault,
  onEditExample,
}: {
  userId: string;
  garden?: Garden;
  gardens: Garden[];
  spaces: Space[];
  allSpaces: Space[];
  vault: VaultPlant[];
  navigate: (page: Destination) => void;
  onGarden: (id: string) => void;
  onNewGarden: () => void;
  onSpace: (id: string) => void;
  onBed: (id: string) => void;
  onVault:(query:string)=>void;
  onEditExample:(templateId:string)=>void;
}) {
  const { season } = useSeason(),
    today = localDay();
  const [options, setOptions] = useState(() => loadCalendarOptions(userId));
  const candidates = [
    ...dailyRecommendations(spaces, details, season, today, options.firstFrost),
    ...calendarTaskYears(options,today).flatMap(year=>buildGrowingTasks(vault,year,options)),
  ];
  const tasks = candidates.filter(
    (t) =>
      !options.tasks[t.id]?.status &&
      !t.status &&
      (t.date >= today || options.reminders?.some(r=>r.id===t.id&&!r.plantId)) &&
      t.date <= shiftDay(today, 7),
  ).sort((a, b) => a.date.localeCompare(b.date));
  function complete(id: string) {
    const next = {
      ...options,
      tasks: { ...options.tasks, [id]: { status: "done" as const } },
    };
    try {
      localStorage.setItem(
        `garden-os-calendar-${userId}`,
        JSON.stringify(next),
      );
      setOptions(next);
      window.dispatchEvent(new Event("garden-os-data-change"));
    } catch {}
  }
  const entries = journalRows(spaces);
  const planted = spaces.flatMap((s) =>
    details(s)
      .plants.filter((p) => p.status === "Growing")
      .map((p) => ({ ...p, space: s })),
  );
  const confirmed = (options.reminders ?? []).filter(
    (r) =>
      ((options.tasks[r.id]?.date || r.date) >= today || !r.plantId) &&
      !options.tasks[r.id]?.status &&
      (!r.plantId || vault.some((plant) => plant.id === r.plantId)),
  );
  const category = (name: string) =>
    vault.filter((p) => p.category === name).length;
  const groups = ["Tomato", "Pepper", "Garlic", "Okra", "Lettuce", "Flowers"];
  let beds = initialLayout;
  let hasSavedLayout = false;
  try {
    const saved = localStorage.getItem(`garden-os-layout-2027-${userId}-${garden?.id || "planning"}`);
    hasSavedLayout = Boolean(saved && saved !== "null");
    beds = nineBedLayout(JSON.parse(saved || "null"));
  } catch {}
  let selectedCustom;
  try {
    const selection = localStorage.getItem(
      `garden-os-layout-selection-${userId}-${garden?.id || "planning"}`,
    );
    selectedCustom = loadCustomLayouts(
      `garden-os-custom-layouts-v1-${userId}-${garden?.id || "planning"}`,
    ).find((layout) => layout.id === selection);
  } catch {}
  return (
    <div className="modern-dashboard">
      <section className={`atelier-welcome-banner atelier-welcome-${season}`}>
        <div className="atelier-welcome-copy">
          <p className="atelier-season-label">{seasonContent[season].name} · A season in your garden</p>
          <h1><span>Welcome to</span>Garden Atelier</h1>
          <span>Plan <b>·</b> Grow <b>·</b> Record <b>·</b> Be Inspired</span>
        </div>
      </section>
      <div className="atelier-home-sections">
        <section className="modern-card atelier-gardens-panel">
          <div className="modern-card-title">
            <h2>My Gardens</h2>
            <button onClick={() => navigate("My Gardens")}>View all →</button>
          </div>
          {!gardens.length&&<p className="garden-preview-intro">A home for every corner you grow. Organize your beds, keep plant notes, and follow each garden through the seasons.</p>}
          <div className="atelier-gardens-grid">
            {!gardens.length&&[{type:"vegetable",name:"Vegetable garden",copy:"Raised beds & fresh harvests"},{type:"flower",name:"Flower garden",copy:"Borders & blooms for cutting"},{type:"herb",name:"Herb garden",copy:"Fragrant pots & kitchen favorites"}].map(example=><div key={example.type} className="atelier-garden-tile garden-example-tile"><span className={`atelier-garden-art atelier-garden-art-${example.type}`} aria-hidden="true"/><small className="garden-example-label">A possibility for your garden</small><strong>{example.name}</strong><small>{example.copy}</small></div>)}
            {gardens.map((g) => (
              <button key={g.id} className="atelier-garden-tile" onClick={() => onGarden(g.id)}>
                <span className={`atelier-garden-art atelier-garden-art-${/flower|cut|bloom/i.test(g.name) ? "flower" : /herb/i.test(g.name) ? "herb" : /front|yard|landscape/i.test(g.name) ? "front" : "vegetable"}`} aria-hidden="true" />
                <strong>{g.name}</strong>
                <small>{allSpaces.filter((space) => space.garden_id === g.id && !details(space).archived).length} growing {allSpaces.filter((space) => space.garden_id === g.id && !details(space).archived).length === 1 ? "space" : "spaces"}</small>
              </button>
            ))}
            <button className="atelier-add-garden" onClick={onNewGarden}>
              <span aria-hidden="true">+</span>
              <strong>{gardens.length ? "New Garden" : "Create your first garden"}</strong>
              <small>Make room for something new</small>
            </button>
          </div>
        </section>
        <aside className="dashboard-quick-summary" aria-label="Garden and task shortcuts">
          <div className="modern-stats dashboard-summary-cards">
            <button type="button" onClick={()=>navigate("My Gardens")}><span className="stat-icon"><LineIcon index={0}/></span><span><b>{gardens.length}</b><strong>Gardens</strong><small>{allSpaces.filter(space=>!details(space).archived).length} growing spaces</small></span><span aria-hidden="true">›</span></button>
            <button type="button" onClick={()=>navigate("Tasks")}><span className="stat-icon"><LineIcon index={2}/></span><span><b>{confirmed.length}</b><strong>Tasks</strong><small>Saved tasks &amp; reminders</small></span><span aria-hidden="true">›</span></button>
          </div>
          <div className="dashboard-add-task"><AddTaskButton userId={userId} onSaved={setOptions}/></div>
        </aside>
      </div>
      {userId!=="guest"&&vault.length>0&&<div className="modern-stats dashboard-collection-stats">
        {[["Plants",vault.length],["Flowers",category("Flower")],["Herbs",category("Herb")]].map(([label,count],i)=><button key={label} type="button" onClick={()=>navigate("Plant Vault")}><span className="stat-icon"><LineIcon index={i+1}/></span><span><b>{count}</b><strong>{label}</strong><small>Saved in your collection</small></span><span aria-hidden="true">›</span></button>)}
      </div>}
      <div className="modern-main-grid">
        {(userId === "guest" || !planted.length) && <GuestPlantingNow />}
        {!selectedCustom && !hasSavedLayout ? <GuestGardenExample onCreate={() => navigate("Garden Layout")} onEdit={onEditExample} /> : <section className="modern-card layout-preview">
          <div className="modern-card-title">
            <h2>My Garden Layout</h2>
            <button onClick={() => navigate("Garden Layout")}>
              View / Edit Layout →
            </button>
          </div>
          {selectedCustom || hasSavedLayout ? <div
            className="modern-garden-map"
            style={{
              backgroundImage: selectedCustom
                ? "none"
                : "url('/Garden Artwork.webp')",
              backgroundColor: selectedCustom?.color || "#efede3",
              aspectRatio: selectedCustom ? "1" : undefined,
            }}
          >
            {selectedCustom&&gardenFootprint(selectedCustom.items)&&selectedCustom.groundCover&&<div className="layout-ground-area" aria-hidden="true" style={{...gardenFootprint(selectedCustom.items),...surfaceAppearance(selectedCustom.groundCover)}}/>}
            {selectedCustom
              ? selectedCustom.items.map((item) => (
                  <button
                    key={item.id}
                    aria-label={`View ${item.name}`}
                    onClick={() => onBed(item.id)}
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: `${item.w}%`,
                      height: `${item.h}%`,
                      backgroundColor: item.color || (item.kind === "Path" ? "#d7ccb5" : "#e7d9bc"),
                      ...surfaceAppearance(item.kind === "Path" ? item.groundCover : undefined),
                      borderRadius: item.kind === "Container" ? "50%" : "6px",
                    }}
                  >
                    {safeDecorations(item.decorations).map(plant=>{const art=designPlants.find(p=>p.id===plant.plantId)!;return <Image key={plant.id} src={art.src} alt="" width={60} height={60} className={`layout-preview-plant${art.group==="Flowers"?" layout-plant-flower":""}`} style={{position:"absolute",...plantStampStyle(item,plant),objectFit:"contain",transform:"translate(-50%,-50%)"}}/>;})}
                    <span>{item.name}</span>
                  </button>
                ))
              : beds.map((b) => (
                  <button
                    key={b.id}
                    aria-label={`View ${b.name} bed`}
                    onClick={() => onBed(b.id)}
                    style={{
                      left: `${b.x}%`,
                      top: `${b.y}%`,
                      width: `${b.w}%`,
                      height: `${b.h}%`,
                    }}
                  >
                    <span className="sr-only">{b.name}</span>
                  </button>
                ))}
          </div> : <div className="atelier-layout-empty"><LineIcon name="Garden Layout" /><p>Your next garden begins with a plan.</p><button className="seasonal-outline" onClick={() => navigate("Garden Layout")}>Open Plan & Design →</button></div>}
          <small>
            {selectedCustom
              ? selectedCustom.name
              : hasSavedLayout ? "Your saved nine-bed layout" : "Create or choose a layout"}{" "}
            · interactive preview
          </small>
        </section>}
        <section className="modern-card week-card">
          <div className="modern-card-title">
            <h2>This Week</h2>
            <button onClick={() => navigate("Tasks")}>View All →</button>
          </div>
          {tasks.length ? (
            tasks.slice(0, 5).map((t) => (
              <div className="modern-task-row" key={t.id}>
                <button
                  className="task-ring"
                  role="checkbox" aria-checked={false}
                  aria-label={`Complete ${t.title}`}
                  onClick={() => complete(t.id)}
                />
                <button
                  className="task-content"
                  onClick={() => navigate("Growing Calendar")}
                >
                  <strong>{t.title}</strong>
                  <small>
                    {t.plant} ·{" "}
                    {t.id.startsWith("custom|")
                      ? "Saved reminder"
                      : "Planning recommendation"}
                  </small>
                </button>
                <time>{t.date < today ? "Overdue" : t.date === today ? "Today" : t.date.slice(5)}</time>
              </div>
            ))
          ) : (
            <p className="empty-copy">
              No scheduled steps this week. {userId === "guest" ? "Create a reminder in Growing Calendar." : "Add plants to your vault or create a reminder in Growing Calendar."}
            </p>
          )}
        </section>
        {userId !== "guest" && planted.length > 0 && <section className="modern-card now-card">
          <h2>In the Garden Now</h2>
          {planted.length ? (
            planted.slice(0, 3).map((p) => (
              <button
                className="modern-now-row"
                key={`${p.space.id}-${p.id}`}
                onClick={() => onSpace(p.space.id)}
              >
                <span className="small-portrait">
                  <PlantPortrait name={p.name} variety={p.variety} />
                </span>
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.variety || p.space.name}
                    <br />
                    {p.quantity} growing · recorded in {p.space.name}
                  </small>
                </span>
                <span>›</span>
              </button>
            ))
          ) : (
            <p className="empty-copy">
              Plants marked Growing in your spaces will appear here.
            </p>
          )}
        </section>}
      </div>
      <div className="modern-bottom-grid">
        <section className="modern-card">
          <div className="modern-card-title">
            <h2>Recent Observations</h2>
            <button onClick={() => navigate("Journal")}>View All →</button>
          </div>
          {entries.length ? (
            entries.slice(0, 3).map((e) => (
              <button
                className="modern-journal-row"
                key={e.id}
                onClick={() => onSpace(e.space.id)}
              >
                <LineIcon index={e.kind === "Harvest" ? 1 : 6} />
                <time>{e.date}</time>
                <span>
                  <strong>
                    {e.kind} · {e.space.name}
                  </strong>
                  <small>{e.text}</small>
                </span>
                <span>›</span>
              </button>
            ))
          ) : (
            <p className="empty-copy">
              Your observations belong here. Start with a note, watering record,
              or harvest.
            </p>
          )}
        </section>
        {userId !== "guest" && vault.length > 0 && <section className="modern-card">
          <div className="modern-card-title">
            <h2>Plant Vault</h2>
            <button onClick={() => navigate("Plant Vault")}>
              View Vault →
            </button>
          </div>
          <div className="featured-grid">
            {groups.filter(name=>vault.some(p=>name==="Flowers"?p.category==="Flower":p.name.toLowerCase().includes(name.toLowerCase()))).map((name) => {
              const matches = vault.filter((p) =>
                name === "Flowers"
                  ? p.category === "Flower"
                  : p.name.toLowerCase().includes(name.toLowerCase()),
              );
              return (
                <button key={name} onClick={() => onVault(name==="Flowers"?"Flower":name)}>
                  <span className="feature-portrait">
                    <PlantPortrait
                      name={
                        name === "Flowers" ? matches[0]?.name || "Zinnia" : name
                      }
                      variety=""
                    />
                  </span>
                  <strong>{name}</strong>
                  <small>
                    {matches.length} saved{" "}
                    {matches.length === 1 ? "variety" : "varieties"}
                  </small>
                </button>
              );
            })}
          </div>
        </section>}
      </div>
    </div>
  );
}
export function TasksPage({
  userId,
  vault,
  spaces,
  onCalendar,
}: {
  userId: string;
  vault: VaultPlant[];
  spaces: Space[];
  onCalendar: () => void;
}) {
  const [range,setRange]=useState("week");
  const today = localDay(),
    { season } = useSeason();
  const [options, setOptions] = useState(() => loadCalendarOptions(userId));
  const tasks = [
    ...dailyRecommendations(spaces, details, season, today, options.firstFrost),
    ...calendarTaskYears(options,today).flatMap(year=>buildGrowingTasks(vault,year,options)),
  ]
    .filter((t) => !t.status && !options.tasks[t.id]?.status && (t.date >= today || options.reminders?.some(r=>r.id===t.id&&!r.plantId)))
    .sort((a, b) => a.date.localeCompare(b.date));
  function complete(id: string) {
    const next = {
      ...options,
      tasks: { ...options.tasks, [id]: { status: "done" as const } },
    };
    try {
      localStorage.setItem(
        `garden-os-calendar-${userId}`,
        JSON.stringify(next),
      );
      setOptions(next);
    } catch {}
  }
  return (
    <section className="interior-page tasks-page atelier-welcoming-page">
      <InteriorHeader illustration="tasks" title="Tasks" eyebrow="Little by little, a garden grows" description="A few thoughtful steps for today and the days ahead. Make a little time for the garden, and enjoy watching it grow.">
        <AddTaskButton userId={userId} onSaved={setOptions}/>
        <button className="seasonal-outline" onClick={onCalendar}>Open Growing Calendar</button>
      </InteriorHeader>
      <InteriorStats items={[{label:"Due today",value:tasks.filter(t=>t.date===today).length},{label:"Next seven days",value:tasks.filter(t=>t.date>=today&&t.date<=shiftDay(today,7)).length},{label:"Saved reminders",value:tasks.filter(t=>options.reminders?.some(r=>r.id===t.id)).length}]}/>
      <div className="interior-toolbar"><div className="collection-tabs">{[{id:"today",label:"Today"},{id:"week",label:"This week"},{id:"all",label:"Upcoming"}].map(item=><button className={`collection-tab ${range===item.id?"is-active":""}`} aria-pressed={range===item.id} key={item.id} onClick={()=>setRange(item.id)}>{item.label}</button>)}</div></div>
      <div className="task-categories">{groupReminders(tasks.filter(t=>range==="all"||t.date<=(range==="today"?today:shiftDay(today,7)))).map(group=><details className="agenda-category" open key={group.title}><summary className="agenda-category-title">{group.title}<span>{group.tasks.length} {group.tasks.length===1?"step":"steps"} · {group.tasks[0]?.date}</span></summary>{group.tasks.map(t=><div className="modern-task-row" key={t.id}><button className="task-ring" aria-label={`Complete ${t.title} for ${t.plant}`} onClick={()=>complete(t.id)}/><div><strong>{t.plant}</strong><small>{options.reminders?.some(r=>r.id===t.id)?"Saved reminder":"Planning recommendation"} · {t.detail}</small></div><time dateTime={t.date}>{t.date < today ? `Overdue · ${t.date}` : t.date}</time></div>)}</details>)}</div>
      {!tasks.some(t=>range==="all"||t.date<=(range==="today"?today:shiftDay(today,7)))&&<div className="interior-empty"><h2>A little breathing room.</h2><p>No upcoming steps in this view. Your calendar keeps the rest of the year within reach.</p><button className="seasonal-outline" onClick={onCalendar}>View calendar</button></div>}
    </section>
  );
}
export { default as JournalPage } from "@/components/GardenJournal";

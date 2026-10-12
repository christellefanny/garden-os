"use client";

import { useRef, useState, type PointerEvent } from "react";
import type {Bed} from "@/lib/garden-layout";
import Dialog from "@/components/ui/Dialog";
import { readDetails, type Space } from "@/lib/garden";

type Item = {
  id: string;
  name: string;
  kind: "Bed" | "Container" | "Path" | "Border";
  x: number;
  y: number;
  w: number;
  h: number;
  spaceId: string;
  color?: string;
};
export type Layout = { id: string; name: string; items: Item[]; color?: string };
const kinds: Item["kind"][] = ["Bed", "Container", "Path", "Border"];
const colors = {
  Bed: "#816344",
  Container: "#707d59",
  Path: "#c2b69f",
  Border: "#667c60",
};
function safeColor(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}
function colorText(background: string): string {
  const channels=[1,3,5].map(index=>{const value=parseInt(background.slice(index,index+2),16)/255;return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4;});
  const luminance=channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  return luminance>0.179?"#000000":"#ffffff";
}
const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));
export function loadCustomLayouts(key: string): Layout[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value)
      ? value.filter(
          (layout) =>
            typeof layout.id === "string" &&
            typeof layout.name === "string" &&
            Array.isArray(layout.items) &&
            layout.items.every(
              (item: Item) =>
                item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                kinds.includes(item.kind) &&
                [item.x, item.y, item.w, item.h].every(Number.isFinite) &&
                item.x >= 0 &&
                item.y >= 0 &&
                item.w >= 4 &&
                item.h >= 4 &&
                item.x + item.w <= 100 &&
                item.y + item.h <= 100,
            ),
        )
      : [];
  } catch {
    return [];
  }
}
export default function BlankGardenLayout({
  userId,
  gardenId,
  spaces,
  onOpenSpace,
  onBack,
  selectedLayoutId,
  onSelectLayout,
  onLayoutsChange,
  onRename,
  onCreateSpaces,
  initialItemId,
}: {
  userId: string;
  gardenId: string;
  spaces: Space[];
  onOpenSpace: (id: string) => void;
  onBack: () => void;
  selectedLayoutId: string;
  onSelectLayout: (id:string) => void;
  onLayoutsChange: (layouts:Layout[]) => void;
  onRename:()=>void;
  initialItemId?:string;
  onCreateSpaces:(beds:Bed[])=>Promise<number|null>;
}) {
  const storageKey = `garden-os-custom-layouts-v1-${userId}-${gardenId}`;
  const [layouts, setLayouts] = useState<Layout[]>(() => loadCustomLayouts(storageKey));
  const layoutId = selectedLayoutId;
  const [view,setView]=useState<"garden"|"plan">("garden");
  const [editing,setEditing]=useState(()=>selectedLayoutId === "new" || loadCustomLayouts(storageKey).find(layout=>layout.id===selectedLayoutId)?.items.length===0);
  const [importing,setImporting]=useState(false);
  const [selected, setSelected] = useState(initialItemId||"");
  const [creating, setCreating] = useState(() => selectedLayoutId === "new" || loadCustomLayouts(storageKey).length === 0);
  const [newName, setNewName] = useState("My garden layout");
  const [message, setMessage] = useState("");
  const canvas = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: string;
    kind: "move" | "resize";
    x: number;
    y: number;
    width: number;
    height: number;
    original: Item;
    latest: Item;
  } | null>(null);
  const layout = layouts.find((l) => l.id === layoutId);
  const item = layout?.items.find((i) => i.id === selected);
  const space = item ? spaces.find(s=>{if(item.spaceId)return s.id===item.spaceId;try{return JSON.parse(s.notes??"null")?.sourceLayoutId===item.id;}catch{return false;}}) : undefined;
  let plants: ReturnType<typeof readDetails>["plants"] = [],
    plantError = "";
  if (space) {
    try {
      plants = readDetails(space.notes).plants;
    } catch (error) {
      plantError =
        error instanceof Error ? error.message : "Could not read plants.";
    }
  }
  function persist(next: Layout[]) {
    setLayouts(next);
    onLayoutsChange(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setMessage("Layout saved in this browser.");
    } catch {
      setMessage(
        "Could not save in this browser. Keep this page open; your latest changes are only available for this visit.",
      );
    }
  }
  function replaceItem(next: Item) {
    if (!layout) return;
    persist(
      layouts.map((l) =>
        l.id === layoutId
          ? { ...l, items: l.items.map((i) => (i.id === next.id ? next : i)) }
          : l,
      ),
    );
  }
  function add(kind: Item["kind"]) {
    if (!layout) return;
    const next: Item = {
      id: crypto.randomUUID(),
      name: `${kind} ${layout.items.filter((i) => i.kind === kind).length + 1}`,
      kind,
      x: 10,
      y: 10,
      w: kind === "Path" ? 55 : 20,
      h: kind === "Path" ? 8 : 20,
      spaceId: "",
    };
    persist(
      layouts.map((l) =>
        l.id === layoutId ? { ...l, items: [...l.items, next] } : l,
      ),
    );
    setSelected(next.id);
  }
  function create() {
    const name = newName.trim();
    if (!name) {
      setMessage("Enter a layout name.");
      return;
    }
    const next = { id: crypto.randomUUID(), name, items: [] };
    persist([...layouts, next]);
    onSelectLayout(next.id);
    setSelected("");
    setCreating(false);
    setEditing(true);
  }
  function start(
    event: PointerEvent<HTMLButtonElement>,
    target: Item,
    kind: "move" | "resize",
  ) {
    if (!editing || event.button !== 0 || !canvas.current) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    setSelected(target.id);
    const bounds = canvas.current.getBoundingClientRect();
    gesture.current = {
      id: target.id,
      kind,
      x: event.clientX,
      y: event.clientY,
      width: bounds.width,
      height: bounds.height,
      original: { ...target },
      latest: { ...target },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx = ((event.clientX - g.x) / g.width) * 100,
      dy = ((event.clientY - g.y) / g.height) * 100;
    const next =
      g.kind === "move"
        ? {
            ...g.original,
            x: clamp(g.original.x + dx, 0, 100 - g.original.w),
            y: clamp(g.original.y + dy, 0, 100 - g.original.h),
          }
        : {
            ...g.original,
            w: clamp(g.original.w + dx, 4, 100 - g.original.x),
            h: clamp(g.original.h + dy, 4, 100 - g.original.y),
          };
    g.latest = next;
    setLayouts((current) =>
      current.map((l) =>
        l.id === layoutId
          ? { ...l, items: l.items.map((i) => (i.id === g.id ? next : i)) }
          : l,
      ),
    );
  }
  function finish(cancel = false) {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    replaceItem(cancel ? g.original : g.latest);
  }
  function geometry(field: "x" | "y" | "w" | "h", value: number) {
    if (!item || !Number.isFinite(value)) return;
    const next = { ...item, [field]: value };
    next.w = clamp(next.w, 4, 100);
    next.h = clamp(next.h, 4, 100);
    next.x = clamp(next.x, 0, 100 - next.w);
    next.y = clamp(next.y, 0, 100 - next.h);
    replaceItem(next);
  }
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow seasonal-muted">Your garden, your design</p>
          <h2 className="editorial-title seasonal-heading mt-2 text-4xl">
            {layout?.name ?? "New garden layout"}
          </h2>
          <p className="seasonal-muted mt-2">
            Start empty. Place your beds, containers, paths, and borders.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setNewName("My garden layout");
              setCreating(true);
            }}
            className="seasonal-button min-h-11 rounded-xl px-4 py-3 font-bold text-white"
          >
            Create layout
          </button>
          {layout&&<>
          <button type="button" onClick={onRename} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">Rename layout</button>
          <button type="button" aria-pressed={view==="garden"} onClick={()=>setView("garden")} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">Garden View</button>
          <button type="button" aria-pressed={view==="plan"} onClick={()=>setView("plan")} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">Plan View</button>
          <button type="button" onClick={()=>setEditing(!editing)} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">{editing?"Done editing":"Edit Layout"}</button>
          <button type="button" disabled={importing} onClick={async()=>{setImporting(true);try{const beds:Bed[]=layout.items.filter(item=>item.kind==="Bed"||item.kind==="Container").map(item=>({...item,emoji:"",color:safeColor(item.color,colors[item.kind]),notes:"",spaceType:item.kind==="Container"?"Container":"Raised Bed"}));const count=await onCreateSpaces(beds);setMessage(count===null?"Could not save growing spaces. Try again.":count===0?"No new growing spaces to add. Existing matches were kept.":`${count} growing spaces created.`);}finally{setImporting(false);}}} className="seasonal-button min-h-11 rounded-xl px-4 py-3 font-bold text-white disabled:opacity-50">{importing?"Saving…":"Create growing spaces"}</button>
          </>}
          <button type="button" onClick={onBack} className="seasonal-outline min-h-11 rounded-xl border px-4 py-3 font-bold">Back</button>
        </div>
      </div>
      {creating && (
        <Dialog
          title="Create a blank layout"
          onClose={() => setCreating(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              create();
            }}
          >
            <label className="block text-sm font-bold">
              Layout name
              <input
                required
                maxLength={100}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="seasonal-input mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <p className="seasonal-muted mt-3 text-sm">
              Your original nine-bed layout stays available. New layouts are
              saved in this browser.
            </p>
            <button
              type="submit"
              className="seasonal-button mt-5 min-h-11 rounded-xl px-4 py-3 font-bold text-white"
            >
              Create blank canvas
            </button>
          </form>
        </Dialog>
      )}
      {layout ? (
        <>
          <div className="seasonal-card mt-6 flex flex-wrap items-center gap-3 rounded-2xl border p-4">
            <label className="flex items-center gap-2 text-sm font-bold">
              Garden color
              <input type="color" value={safeColor(layout.color,"#f4f1e7")} onChange={event=>persist(layouts.map(l=>l.id===layoutId?{...l,color:event.target.value}:l))} className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--border)] p-1" />
            </label>
            {kinds.map((kind) => (
              <button
                type="button"
                key={kind}
                disabled={!editing}
                onClick={() => add(kind)}
                className="seasonal-outline min-h-11 rounded-xl border px-3 py-2 text-sm font-bold"
              >
                Add {kind.toLowerCase()}
              </button>
            ))}
          </div>
          <p className="seasonal-muted mt-3 text-sm">
            Drag an item to move it. Drag its corner to resize. You can also use
            the position and size fields or arrow keys. This is a planning map,
            not measured to scale.
          </p>
          <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div
              ref={canvas}
              aria-label="Garden layout canvas"
              className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[#f4f1e7]"
              style={{
                backgroundColor: safeColor(layout.color,"#f4f1e7"),
                backgroundImage: view==="plan" ? "linear-gradient(#d7d0bb60 1px,transparent 1px),linear-gradient(90deg,#d7d0bb60 1px,transparent 1px)" : "none",
                backgroundSize: "5% 5%",
              }}
            >
              {!layout.items.length && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center">
                  <p className="max-w-xs" style={{color:colorText(safeColor(layout.color,"#f4f1e7"))}}>
                    Your blank canvas is ready. Add a bed or container to start
                    planning.
                  </p>
                </div>
              )}
              {layout.items.map((target) => (
                <div
                  key={target.id}
                  className={`absolute ${selected === target.id ? "z-10" : ""}`}
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    width: `${target.w}%`,
                    height: `${target.h}%`,
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Select ${target.name}`}
                    onClick={() => setSelected(target.id)}
                    onPointerDown={(event) => start(event, target, "move")}
                    onPointerMove={move}
                    onPointerUp={() => finish()}
                    onPointerCancel={() => finish(true)}
                    onKeyDown={(event) => {
                      if(!editing)return;
                      const delta = event.shiftKey ? 5 : 1;
                      const changes: Record<string, [number, number]> = {
                        ArrowLeft: [-delta, 0],
                        ArrowRight: [delta, 0],
                        ArrowUp: [0, -delta],
                        ArrowDown: [0, delta],
                      };
                      const direction = changes[event.key];
                      if (direction) {
                        event.preventDefault();
                        setSelected(target.id);
                        replaceItem({
                          ...target,
                          x: clamp(target.x + direction[0], 0, 100 - target.w),
                          y: clamp(target.y + direction[1], 0, 100 - target.h),
                        });
                      }
                    }}
                    className={`h-full w-full touch-none overflow-hidden border-2 p-1 text-center text-xs font-bold shadow-sm focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)] ${selected === target.id ? "border-[#d3a743] ring-2 ring-[#d3a743]" : "border-white/70"}`}
                    style={{
                      backgroundColor: safeColor(target.color,colors[target.kind]),
                      color: colorText(safeColor(target.color,colors[target.kind])),
                      borderRadius:
                        target.kind === "Container" ? "50%" : "10px",
                    }}
                  >
                    {target.name}
                  </button>
                  {editing && selected === target.id && (
                    <button
                      type="button"
                      aria-label={`Resize ${target.name}`}
                      onPointerDown={(event) => start(event, target, "resize")}
                      onPointerMove={move}
                      onPointerUp={() => finish()}
                      onPointerCancel={() => finish(true)}
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 touch-none cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-[#665335] text-white shadow"
                    >
                      ↘
                    </button>
                  )}
                </div>
              ))}
            </div>
            <aside className="seasonal-card min-w-0 rounded-2xl border p-5">
              <h3 className="seasonal-heading text-xl font-bold">
                Item details
              </h3>
              {item ? (
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-bold">
                    Item name
                    <input
                      maxLength={100}
                      value={item.name}
                      onChange={(event) =>
                        replaceItem({ ...item, name: event.target.value })
                      }
                      className="seasonal-input mt-1 w-full rounded-xl border p-2"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 text-sm font-bold">
                    {item.kind} color
                    <input type="color" value={safeColor(item.color,colors[item.kind])} onChange={event=>replaceItem({...item,color:event.target.value})} className="h-11 w-14 cursor-pointer rounded-lg border border-[var(--border)] p-1" />
                  </label>
                  <p className="seasonal-muted text-sm">{item.kind}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        ["x", "Left (%)"],
                        ["y", "Top (%)"],
                        ["w", "Width (%)"],
                        ["h", "Height (%)"],
                      ] as const
                    ).map(([field, label]) => (
                      <label key={field} className="block text-sm font-bold">
                        {label}
                        <input
                          disabled={!editing}
                          type="number"
                          min={field === "w" || field === "h" ? 4 : 0}
                          max={100}
                          step="1"
                          value={Math.round(item[field] * 10) / 10}
                          onChange={(event) =>
                            geometry(field, event.currentTarget.valueAsNumber)
                          }
                          className="seasonal-input mt-1 w-full rounded-xl border p-2"
                        />
                      </label>
                    ))}
                  </div>
                  {(item.kind === "Bed" || item.kind === "Container") && (
                    <>
                      <label className="block text-sm font-bold">
                        Linked growing space
                        <select
                          aria-label="Linked growing space"
                          value={item.spaceId || space?.id || ""}
                          onChange={(event) =>
                            replaceItem({
                              ...item,
                              spaceId: event.target.value,
                            })
                          }
                          className="seasonal-input mt-1 w-full rounded-xl border p-2"
                        >
                          <option value="">Choose a growing space</option>
                          {spaces.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {space ? (
                        <>
                          <p className="seasonal-muted text-sm">
                            Plants from {space.name}
                          </p>
                          {plantError ? (
                            <p role="alert">{plantError}</p>
                          ) : plants.length ? (
                            <ul className="space-y-2">
                              {plants.map((p) => (
                                <li
                                  key={p.id}
                                  className="rounded-xl border border-[var(--border)] p-3 text-sm"
                                >
                                  <strong>{p.name}</strong>
                                  {p.variety && <span> · {p.variety}</span>}
                                  <p className="seasonal-muted mt-1">
                                    {p.quantity} plants · {p.status}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="seasonal-muted text-sm">
                              No plants recorded yet.
                            </p>
                          )}
                          <button
                            type="button"
                            disabled={!!plantError}
                            onClick={() => onOpenSpace(space.id)}
                            className="seasonal-outline min-h-11 rounded-xl border px-3 py-2 font-bold"
                          >
                            Manage plants
                          </button>
                        </>
                      ) : (
                        <p className="seasonal-muted text-sm">
                          Link a space to show its plant details here.
                        </p>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      persist(
                        layouts.map((l) =>
                          l.id === layoutId
                            ? {
                                ...l,
                                items: l.items.filter((i) => i.id !== item.id),
                              }
                            : l,
                        ),
                      );
                      setSelected("");
                    }}
                    className="min-h-11 text-sm font-bold text-red-700 underline"
                  >
                    Remove item
                  </button>
                </div>
              ) : (
                <p className="seasonal-muted mt-4 text-sm">
                  Select an item to name, resize, or link it.
                </p>
              )}
            </aside>
          </div>
        </>
      ) : (
        <p className="seasonal-muted mt-6">
          Create a layout to start with an empty canvas.
        </p>
      )}
      {message && (
        <p role="status" className="seasonal-muted mt-4 text-sm">
          {message}
        </p>
      )}
    </section>
  );
}

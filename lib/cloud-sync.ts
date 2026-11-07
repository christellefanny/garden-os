/** Browser-state synchronization. A failed read must never disable local edit tracking. */
const prefixes = [
  "garden-os-plant-vault-",
  "garden-os-calendar-",
  "garden-os-journal-",
  "garden-os-layout-",
  "garden-os-custom-layouts-",
  "garden-os-original-layout-name-",
  "garden-os-layout-selection-",
];

type RecordValue = { key: string; value: unknown; version: number };
type Response = {
  ok: boolean;
  status: number;
  data: { records?: RecordValue[]; record?: RecordValue; setup?: boolean };
};
type Options = {
  userId: string;
  storage: Storage;
  write: (key: string, value: string) => void;
  request: (method: "GET" | "PUT", body?: unknown) => Promise<Response>;
  onStatus: (status: string) => void;
  onConflicts: (keys: string[]) => void;
  onReady: () => void;
  onDataChange: () => void;
  canHydrate?: () => boolean;
  debounceMs?: number;
  retryMs?: number;
};

// PostgreSQL jsonb may reorder object keys. Compare JSON values, not transport
// formatting, while preserving array order and literal non-JSON strings.
function sameStoredValue(left: string | null, right: string | null): boolean {
  if (left === right) return true;
  if (left === null || right === null) return false;
  const canonical = (value: unknown): string => {
    if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
    if (value !== null && typeof value === "object") {
      const record = value as Record<string, unknown>;
      return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  };
  try { return canonical(JSON.parse(left)) === canonical(JSON.parse(right)); }
  catch { return false; }
}

export function createCloudSync({
  userId, storage, write, request, onStatus, onConflicts, onReady, onDataChange,
  debounceMs = 700, retryMs = 5000, canHydrate = () => true,
}: Options) {
  const valid = (key: string) =>
    prefixes.some(prefix => key.startsWith(prefix)) && key.includes(userId) &&
    !/before-|backup|conflict/.test(key) && !key.endsWith("-cloud-base");
  const pendingKey = `garden-os-sync-pending-${userId}`;
  const dirty = new Map<string, string>();
  const versions = new Map<string, number>();
  const blocked = new Set<string>();
  const reviewable = new Set<string>();
  const unresolved = new Set<string>();
  let alive = true;
  let loaded = false;
  let running = false;
  let refreshRequested = false;
  let error = "";
  let retryDelay = retryMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const saved = JSON.parse(storage.getItem(pendingKey) || "{}");
    for (const [key, raw] of Object.entries(saved ?? {})) {
      if (!valid(key)) continue;
      if (typeof raw === "string") dirty.set(key, raw);
      else if (raw === null) unresolved.add(key);
    }
  } catch { /* Local keys are also scanned after a successful read. */ }
  const remember = () => {
    // Null marks a staged cloud-only key, never an upload value. Pending readers
    // must also wait for reviewable differences, even without a local edit.
    const pending = new Map<string, string | null>([...unresolved].map(key => [key, null]));
    for (const [key, raw] of dirty) pending.set(key, raw);
    for (const key of blocked) if (!pending.has(key)) pending.set(key, storage.getItem(key));
    write(pendingKey, JSON.stringify(Object.fromEntries(pending)));
  };
  const report = () => {
    if (!alive) return;
    onConflicts([...reviewable]);
    onStatus(error || (blocked.size || unresolved.size
      ? "Some local/cloud differences need review in Settings. Both versions are preserved."
      : dirty.size
        ? "Changes saved in this browser. Syncing to your account…"
        : "All changes synced to your account"));
  };
  const schedule = (delay: number) => {
    if (!alive) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = undefined; void run(); }, delay);
  };
  const backOff = () => {
    schedule(retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30000);
  };
  const preserveConflict = (key: string, local: string | null, cloud: string) => {
    if (local === null) write(`${key}-before-cloud-migration-absent`, "true");
    else write(`${key}-before-cloud-migration`, local);
    write(`${key}-cloud-conflict`, cloud);
    blocked.add(key);
    reviewable.add(key);
  };
  async function load() {
    const result = await request("GET");
    if (!alive) return false;
    if (!result.ok || !Array.isArray(result.data.records)) {
      error = result.data.setup
        ? "Cloud setup required. Changes are saved in this browser. We will retry."
        : "Cloud unavailable. Changes are saved in this browser. We will retry when connected.";
      return false;
    }
    const remote = new Map(result.data.records.filter(record => valid(record.key)).map(record => [record.key, record]));
    blocked.clear();
    reviewable.clear();
    unresolved.clear();
    versions.clear();
    for (const [key, record] of remote) {
      versions.set(key, record.version);
      const cloud = typeof record.value === "string" ? record.value : JSON.stringify(record.value);
      const local = storage.getItem(key);
      const base = storage.getItem(`${key}-cloud-base`);
      if (sameStoredValue(local, cloud)) {
        // Also acknowledges a successful PUT whose response was lost.
        dirty.delete(key);
        write(`${key}-cloud-base`, cloud);
      } else if (local === null || sameStoredValue(local, base)) {
        // Once editors are open they may retain unsaved or cached state. Stage
        // remote changes for Settings instead of replacing data behind them.
        if (canHydrate()) {
          write(key, cloud);
          write(`${key}-cloud-base`, cloud);
          dirty.delete(key);
        } else {
          preserveConflict(key, local, cloud);
        }
      } else if (sameStoredValue(base, cloud)) {
        // Only this device changed: retry against the freshly read version.
        dirty.set(key, local!);
      } else {
        preserveConflict(key, local, cloud);
      }
    }
    // Keep legacy device data and edits made while the initial read was unavailable.
    const localKeys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
    for (const key of localKeys) {
      if (!key || !valid(key) || remote.has(key)) continue;
      const raw = storage.getItem(key);
      if (raw !== null) {
        dirty.set(key, raw);
        write(`${key}-before-cloud-migration`, raw);
      }
    }
    remember();
    loaded = true;
    error = "";
    onDataChange();
    return true;
  }
  async function run() {
    if (!alive || running) return;
    running = true;
    let failed = false;
    try {
      if (!loaded || refreshRequested) {
        refreshRequested = false;
        loaded = false;
        if (!await load()) { failed = true; return; }
        // Local editing must not wait for a potentially slow backlog of uploads.
        onReady();
        report();
      }
      for (const key of [...dirty.keys()]) {
        if (!alive) return;
        if (blocked.has(key)) continue;
        const raw = dirty.get(key)!;
        let value: unknown;
        try { value = JSON.parse(raw); } catch { value = raw; }
        const result = await request("PUT", { key, value, version: versions.get(key) ?? 0 });
        if (!alive) return;
        if (result.ok && Number.isInteger(result.data.record?.version)) {
          versions.set(key, result.data.record!.version);
          write(`${key}-cloud-base`, raw);
          // Never acknowledge an edit made after this request started.
          if (dirty.get(key) === raw) dirty.delete(key);
          remember();
        } else if (result.status === 409) {
          write(`${key}-conflict-${Date.now()}`, raw);
          blocked.add(key);
          reviewable.delete(key);
          // Read the other device's version before offering a conflict choice.
          refreshRequested = true;
        } else {
          error = "Cloud unavailable. Changes are saved in this browser. We will retry when connected.";
          loaded = false;
          failed = true;
          break;
        }
      }
    } catch {
      if (alive) {
        loaded = false;
        failed = true;
        error = "Cloud unavailable. Changes are saved in this browser. We will retry when connected.";
      }
    } finally {
      running = false;
      if (alive) {
        onReady();
        report();
        if (failed) backOff();
        else {
          retryDelay = retryMs;
          if (refreshRequested) schedule(0);
          else if ([...dirty.keys()].some(key => !blocked.has(key))) schedule(debounceMs);
        }
      }
    }
  }
  return {
    start: run,
    edit(key: string, raw: string) {
      if (!alive || !valid(key)) return;
      dirty.set(key, raw);
      remember();
      onDataChange();
      report();
      // A successful read must establish versions before any upload is allowed.
      if (loaded) schedule(debounceMs);
    },
    retry() {
      if (!alive) return;
      refreshRequested = true;
      retryDelay = retryMs;
      onStatus("Checking cloud synchronization. Your browser changes are preserved…");
      schedule(0);
    },
    stop() {
      alive = false;
      if (timer) clearTimeout(timer);
    },
  };
}

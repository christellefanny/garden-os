"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
export type SyncInfo = {
  status: string;
  conflicts: string[];
  retry: () => void;
  useCloud: (key: string) => void;
  download: () => void;
};
const Context = createContext<SyncInfo>({
  status: "Local data available",
  conflicts: [],
  retry: () => {},
  useCloud: () => {},
  download: () => {},
});
export const useCloudData = () => useContext(Context);
const prefixes = [
  "garden-os-plant-vault-",
  "garden-os-calendar-",
  "garden-os-layout-",
  "garden-os-custom-layouts-",
  "garden-os-original-layout-name-",
  "garden-os-layout-selection-",
];
export default function CloudDataBoundary({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [status, setStatus] = useState("Checking cloud synchronization…"),
    [ready, setReady] = useState(false),
    [conflicts, setConflicts] = useState<string[]>([]),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true,
      hydrating = true;
    const original = Storage.prototype.setItem;
    const versions = new Map<string, number>();
    const pendingKey = `garden-os-sync-pending-${userId}`;
    let dirty: Record<string, string> = {};
    try {
      dirty = JSON.parse(localStorage.getItem(pendingKey) || "{}");
    } catch {}
    const pending = new Map<string, string>(Object.entries(dirty));
    const blocked = new Set<string>();
    const remember = () =>
      original.call(localStorage, pendingKey, JSON.stringify(dirty));
    let queue = Promise.resolve();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const valid = (key: string) =>
      prefixes.some((prefix) => key.startsWith(prefix)) &&
      key.includes(userId) &&
      !key.includes("before-") &&
      !key.includes("backup") &&
      !key.includes("conflict") &&
      !key.endsWith("-cloud-base");
    const token = async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token;
    };
    const request = async (method: string, body?: unknown) => {
      const response = await fetch("/api/state", {
        method,
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${await token()}`,
          "Content-Type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return {
        ok: response.ok,
        status: response.status,
        data: await response.json(),
      };
    };
    const flush = () => {
      const edits = [...pending];
      pending.clear();
      queue = queue.then(async () => {
        for (const [key, raw] of edits) {
          if (!alive) return;
          if (blocked.has(key)) continue;
          let value;
          try {
            value = JSON.parse(raw);
          } catch {
            value = raw;
          }
          try {
            const result = await request("PUT", {
              key,
              value,
              version: versions.get(key) ?? 0,
            });
            if (!alive) return;
            if (result.ok) {
              versions.set(key, result.data.record.version);
              original.call(localStorage, `${key}-cloud-base`, raw);
              if (dirty[key] === raw) {
                delete dirty[key];
                remember();
              }
              setStatus("All changes synced to your account");
            } else {
              original.call(localStorage, `${key}-conflict-${Date.now()}`, raw);
              blocked.add(key);
              setConflicts((current) => [...new Set([...current, key])]);
              setStatus(
                result.status === 409
                  ? "A device conflict needs review. Local changes are preserved."
                  : "Cloud unavailable. Changes are saved in this browser.",
              );
            }
          } catch {
            pending.set(key, raw);
            if (alive)
              setStatus(
                "Offline. Changes are saved locally and will retry when connected.",
              );
          }
        }
      });
    };
    const patch = function (this: Storage, key: string, value: string) {
      original.call(this, key, value);
      if (this === localStorage && valid(key) && !hydrating) {
        pending.set(key, value);
        dirty[key] = value;
        remember();
        window.dispatchEvent(new Event("garden-os-data-change"));
        if (timer) clearTimeout(timer);
        timer = setTimeout(flush, 700);
      }
    };
    async function start() {
      try {
        const result = await request("GET");
        if (!alive) return;
        if (!result.ok) {
          setStatus(
            result.data.setup
              ? "Cloud setup required. Existing data is preserved locally."
              : "Cloud unavailable. Existing data is preserved locally.",
          );
          hydrating = false;
          setReady(true);
          return;
        }
        const remote = new Map<string, { value: unknown; version: number }>(
          (result.data.records ?? [])
            .filter((record: { key: string }) => valid(record.key))
            .map((record: { key: string; value: unknown; version: number }) => [
              record.key,
              record,
            ]),
        );
        for (const [key, record] of remote) {
          versions.set(key, record.version);
          const cloud =
            typeof record.value === "string"
              ? record.value
              : JSON.stringify(record.value);
          const local = localStorage.getItem(key);
          const base = localStorage.getItem(`${key}-cloud-base`);
          if (local && local !== cloud && local !== base) {
            original.call(localStorage, `${key}-before-cloud-migration`, local);
            original.call(localStorage, `${key}-cloud-conflict`, cloud);
            blocked.add(key);
            pending.delete(key);
            setConflicts((current) => [...new Set([...current, key])]);
            continue;
          }
          original.call(localStorage, key, cloud);
          original.call(localStorage, `${key}-cloud-base`, cloud);
        }
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            !key ||
            !valid(key) ||
            key.endsWith("-cloud-base") ||
            remote.has(key)
          )
            continue;
          const raw = localStorage.getItem(key);
          if (raw) {
            pending.set(key, raw);
            dirty[key] = raw;
            remember();
            original.call(localStorage, `${key}-before-cloud-migration`, raw);
          }
        }
        hydrating = false;
        Storage.prototype.setItem = patch;
        setReady(true);
        setStatus(
          blocked.size
            ? "Cloud connected. Some local/cloud differences need review; both versions are preserved."
            : "Cloud connected. Local backups retained.",
        );
        window.dispatchEvent(new Event("garden-os-data-change"));
        flush();
      } catch {
        if (alive) {
          hydrating = false;
          setReady(true);
          setStatus("Cloud unavailable. Your browser data is safe.");
        }
      }
    }
    void start();
    const online = () => {
      flush();
    };
    window.addEventListener("online", online);
    return () => {
      alive = false;
      window.removeEventListener("online", online);
      if (timer) clearTimeout(timer);
      if (Storage.prototype.setItem === patch)
        Storage.prototype.setItem = original;
    };
  }, [userId, attempt]);
  return (
    <Context.Provider
      value={{
        status,
        conflicts,
        retry: () => setAttempt((value) => value + 1),
        useCloud: (key) => {
          const cloud = localStorage.getItem(`${key}-cloud-conflict`);
          if (cloud) {
            localStorage.setItem(
              `${key}-before-cloud-choice`,
              localStorage.getItem(key) || "null",
            );
            localStorage.setItem(key, cloud);
            setConflicts((current) => current.filter((k) => k !== key));
            setAttempt((value) => value + 1);
            window.dispatchEvent(new Event("garden-os-data-change"));
          }
        },
        download: () => {
          const data: Record<string, unknown> = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("garden-os-") && key.includes(userId)) {
              data[key] = localStorage.getItem(key);
            }
          }
          const url = URL.createObjectURL(
            new Blob(
              [
                JSON.stringify(
                  { version: 1, exportedAt: new Date().toISOString(), data },
                  null,
                  2,
                ),
              ],
              { type: "application/json" },
            ),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = "garden-os-browser-backup.json";
          link.click();
          URL.revokeObjectURL(url);
        },
      }}
    >
      {ready ? (
        children
      ) : (
        <main className="seasonal-page p-8">
          <h1 className="editorial-title text-3xl">Opening your garden</h1>
          <p role="status">Checking saved data safely…</p>
        </main>
      )}
    </Context.Provider>
  );
}

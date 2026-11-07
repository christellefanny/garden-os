"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import { createCloudSync } from "@/lib/cloud-sync";
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
export default function CloudDataBoundary({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [status, setStatus] = useState(userId === "guest" ? "Guest · Saved on this device. Create an account to back up and sync." : "Checking cloud synchronization…"),
    [ready, setReady] = useState(userId === "guest"),
    [conflicts, setConflicts] = useState<string[]>([]),
    [attempt, setAttempt] = useState(0);
  const workspaceOpened = useRef(userId === "guest");
  useEffect(() => {
    if (userId === "guest") return;
    const original = Storage.prototype.setItem;
    const sync = createCloudSync({
      userId,
      storage: localStorage,
      write: (key, value) => original.call(localStorage, key, value),
      request: async (method, body) => {
        const { data } = await supabase.auth.getSession();
        const response = await fetch("/api/state", {
          method,
          signal: AbortSignal.timeout(10000),
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`,
            "Content-Type": "application/json",
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        return { ok: response.ok, status: response.status, data: await response.json() };
      },
      onStatus: setStatus,
      onConflicts: setConflicts,
      canHydrate: () => !workspaceOpened.current,
      onReady: () => { workspaceOpened.current = true; setReady(true); },
      onDataChange: () => window.dispatchEvent(new Event("garden-os-data-change")),
    });
    const patch = function (this: Storage, key: string, value: string) {
      original.call(this, key, value);
      if (this === localStorage) sync.edit(key, value);
    };
    // Install before loading: edits remain tracked even if the first read fails.
    Storage.prototype.setItem = patch;
    void sync.start();
    window.addEventListener("online", sync.retry);
    return () => {
      sync.stop();
      window.removeEventListener("online", sync.retry);
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
          if (userId === "guest") data["garden-os-guest-data"] = localStorage.getItem("garden-os-guest-data");
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

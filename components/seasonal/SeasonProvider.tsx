"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { getSeason, parseThemeSelection, THEME_STORAGE_KEY, type Season, type ThemeSelection } from "@/lib/seasons";

const CHANGE_EVENT = "garden-os-theme-change";
let memorySelection: ThemeSelection = "automatic";
let storageUnavailable = false;

function getSelection() {
  if (storageUnavailable) return memorySelection;
  try { return parseThemeSelection(localStorage.getItem(THEME_STORAGE_KEY)); }
  catch { return memorySelection; }
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("visibilitychange", listener);
  window.addEventListener("focus", listener);
  // Update at a date boundary even when the dashboard stays open.
  const timer = window.setInterval(listener, 60_000);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("visibilitychange", listener);
    window.removeEventListener("focus", listener);
    window.clearInterval(timer);
  };
}

function setSelection(value: ThemeSelection) {
  memorySelection = value;
  try { localStorage.setItem(THEME_STORAGE_KEY, value); }
  catch { storageUnavailable = true; }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const SeasonContext = createContext<{ season: Season; selection: ThemeSelection; setSelection: typeof setSelection } | null>(null);

export default function SeasonProvider({ initialSeason, children }: { initialSeason: Season; children: ReactNode }) {
  const selection = useSyncExternalStore(subscribe, getSelection, () => "automatic" as const);
  const automaticSeason = useSyncExternalStore(subscribe, () => getSeason(new Date()), () => initialSeason);
  const season = selection === "automatic" ? automaticSeason : selection;

  useEffect(() => { document.documentElement.dataset.season = season; }, [season]);

  return <SeasonContext.Provider value={{ season, selection, setSelection }}>{children}</SeasonContext.Provider>;
}

export function useSeason() {
  const context = useContext(SeasonContext);
  if (!context) throw new Error("useSeason requires SeasonProvider");
  return context;
}

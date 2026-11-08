"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { Garden } from "@/lib/garden";
import { friendlyDate, plantingDay, type PlantingClimate } from "@/lib/planting-now";
import { beginnerClimateKey, beginnerClimateMaxAge, beginnerPriorities, currentBeginnerClimate, loadBeginnerClimate, readBeginnerClimate, type BeginnerGoal, type BeginnerZone } from "@/lib/beginner-climate";

export default function BeginnerClimate({ userId, garden, goal }: { userId: string; garden?: Garden; goal: BeginnerGoal }) {
  const savedLocation = garden?.location?.trim() || "";
  const key = beginnerClimateKey(userId, garden?.id || "no-garden", savedLocation);
  const [location, setLocation] = useState(savedLocation);
  const [resolvedLocation, setResolvedLocation] = useState(savedLocation);
  const [climate, setClimate] = useState<PlantingClimate>();
  const [zone, setZone] = useState<BeginnerZone>();
  const [busy, setBusy] = useState(Boolean(savedLocation));
  const [error, setError] = useState("");
  const [storageNote, setStorageNote] = useState("");
  const [now, setNow] = useState(() => new Date());
  const request = useRef<AbortController | null>(null);

  const resolve = useCallback(async (input: string, cached?: PlantingClimate) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort("timeout"), 60000);
    setBusy(true); setError(""); setResolvedLocation(input); setClimate(cached); setZone(undefined);
    try {
      const result = await loadBeginnerClimate(input, controller.signal);
      if (controller.signal.aborted) return;
      setZone(result.zone);
      if (result.climate) {
        setClimate(result.climate); setNow(new Date());
        try { localStorage.setItem(key, JSON.stringify({ location: input, climate: result.climate })); setStorageNote(""); }
        catch { setStorageNote("This lookup works for this visit, but this browser could not save it."); }
      } else setError(result.error || "Historical frost estimates are unavailable.");
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Local growing information is unavailable. Please try again.");
      else if (controller.signal.reason === "timeout") setError("The location lookup took too long. Please try again.");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) setBusy(false);
    }
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      let cached: ReturnType<typeof readBeginnerClimate> = null;
      try { cached = readBeginnerClimate(localStorage.getItem(key), savedLocation); } catch { /* Optional browser cache. */ }
      const input = savedLocation || cached?.location || "";
      setLocation(input); setResolvedLocation(input);
      if (cached) {
        setClimate(cached.climate);
        const age = Date.now() - Date.parse(cached.climate.resolvedAt);
        if (age >= 0 && age < beginnerClimateMaxAge) { setBusy(false); return; }
      }
      if (input) void resolve(input, cached?.climate);
      else setBusy(false);
    });
    return () => { cancelled = true; request.current?.abort(); };
  }, [key, savedLocation, resolve]);
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer); }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!location.trim()) return;
    void resolve(location.trim());
  }
  const usable = climate && currentBeginnerClimate(climate, now);
  const today = plantingDay(usable, now);
  const priorities = usable && beginnerPriorities(usable, today, goal);
  const savedZone = resolvedLocation === savedLocation ? garden?.hardiness_zone : null;
  const displayedZone = climate?.zone || zone?.zone || savedZone;
  const frostDate = (value: string | null | undefined) => value ? friendlyDate(`2024-${value}`) : climate ? "No dependable annual date" : busy ? "Looking up…" : "Not available yet";
  const forecastAvailable = usable?.forecast.some(day => day.date >= today);
  return <section className="learning-start" aria-labelledby="beginner-climate-heading">
    <p className="modern-eyebrow">Your local growing window</p>
    <h2 id="beginner-climate-heading">Know your zone and frost dates</h2>
    <p className="seasonal-muted text-sm leading-7">{savedLocation ? `Starts with the saved location for ${garden?.name}: ${savedLocation}. You can look up another area below.` : "An optional city and state or U.S. ZIP code is enough to get started. You can keep reading without one."} No device location is requested.</p>
    <form className="mt-5" onSubmit={submit}>
      <label>City and state or ZIP code (optional)<input maxLength={120} value={location} onChange={event => setLocation(event.target.value)} placeholder="e.g. Plainfield, IL or 60544" autoComplete="off" /></label>
      <button type="submit" disabled={busy || !location.trim()} className="seasonal-button disabled:opacity-60">{busy ? "Looking up local timing…" : "Find my growing window"}</button>
    </form>
    <p className="seasonal-muted mt-3 text-xs leading-6">Lookup uses U.S. public zone and weather services. Results stay in this browser for this account or guest garden; this does not change your saved garden or Calendar dates.</p>
    {busy && <p role="status" className="mt-4 text-sm">Finding the growing zone and historical frost estimates…</p>}
    {error && <p role="alert" className="mt-4 text-sm">{error} {climate ? "Previously saved historical estimates are shown below; the forecast may be unavailable." : "No frost dates have been assumed. You can retry or continue with the general guides."}</p>}
    {storageNote && <p role="status" className="mt-3 text-sm">{storageNote}</p>}
    {(climate || zone || savedZone || busy || error) && <div className="mt-5">
      <p className="text-sm font-semibold">{climate?.place || zone?.place || resolvedLocation}{climate && ` · ZIP ${climate.zip}`}</p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="min-w-0 rounded-xl border p-4"><dt className="text-sm font-bold">Growing zone</dt><dd className="mt-2 text-lg">{displayedZone ? `USDA ${displayedZone}` : "Not available yet"}</dd><dd className="seasonal-muted mt-2 text-xs leading-6">{climate || zone ? "2023 USDA ZIP-area lookup." : savedZone ? "Saved garden zone; not independently verified here." : "Needs a verified location."} Winter cold tolerance, not a planting date. A ZIP code can span more than one zone; confirm your exact garden on the USDA map. {(climate || zone) && <a className="underline" href="https://planthardiness.ars.usda.gov/" target="_blank" rel="noopener noreferrer">USDA source ↗</a>}</dd></div>
        <div className="min-w-0 rounded-xl border p-4"><dt className="text-sm font-bold">Last spring frost</dt><dd className="mt-2 text-lg">{frostDate(climate?.lastSpringFrost)}</dd><dd className="seasonal-muted mt-2 text-xs leading-6">When spring freezing usually eases. Wait for suitable weather and warm soil before planting tender plants outdoors.</dd></div>
        <div className="min-w-0 rounded-xl border p-4"><dt className="text-sm font-bold">First fall frost</dt><dd className="mt-2 text-lg">{frostDate(climate?.firstFallFrost)}</dd><dd className="seasonal-muted mt-2 text-xs leading-6">When autumn freezing may return. Work backward to leave time for growth, harvest, or flowers.</dd></div>
      </dl>
    </div>}
    {climate && priorities && <>
      <div className="learning-note">
        <strong>Planning estimates, not a frost forecast</strong>
        <p>{climate.lastSpringFrost ? "These are conservative 32°F freeze estimates, using a later spring date (80th percentile) and earlier fall date (20th percentile)." : "Freezing is too irregular in this location’s history to calculate dependable annual frost dates. This does not mean frost is impossible."} Calculated independently of the zone from {climate.years} usable years of local gridded weather within {climate.startYear}–{climate.endYear}.</p>
        <p>Microclimates and individual years vary. These are not guaranteed frost-free dates. {forecastAvailable ? "Available near-term temperatures also inform the plant suggestions." : "A current forecast is unavailable here. Check your local forecast before outdoor planting."}</p>
        <p><a href="https://planthardiness.ars.usda.gov/" target="_blank" rel="noopener noreferrer">Zone: USDA 2023 map ↗</a> · <a href="https://open-meteo.com/en/docs/historical-weather-api" target="_blank" rel="noopener noreferrer">Frost estimates: Open-Meteo historical weather ↗</a></p>
      </div>
      <div className="learning-next" aria-label="Seasonal starting priorities">
        <p className="modern-eyebrow">What to prioritize · {friendlyDate(today)}, {today.slice(0, 4)}</p>
        <h3 className="text-lg font-semibold">{priorities.title}</h3><p>{priorities.detail}</p>
        {priorities.suggestions.length > 0 ? <ul className="mt-4 space-y-3">{priorities.suggestions.map(advice => <li key={advice.crop.id} className="rounded-xl border p-4"><strong>{advice.crop.name}: {advice.badge}</strong><p>{advice.method}. {advice.timing}.</p><p className="text-xs leading-6">{advice.explanation}</p><a className="underline" href={advice.crop.source} target="_blank" rel="noopener noreferrer">Read the growing guide ↗</a></li>)}</ul> : <p className="mt-3">Start with light, drainage, a small layout, and choosing plants for the next suitable window. No dependable new outdoor planting is suggested for this selection right now.</p>}
        <p className="seasonal-muted mt-3 text-xs">Ideas to consider, not tasks added to your garden. Check the variety or seed packet before committing.</p>
      </div>
    </>}
  </section>;
}

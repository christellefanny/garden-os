"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { saveGuestGarden } from "@/lib/guest";
import { type Garden } from "@/lib/garden";
import { Field } from "@/components/SpaceEditor";

export default function NewGardenModal({
  garden,
  guest = false,
  onSaved,
  onCancel,
}: {
  garden?: Garden;
  guest?: boolean;
  onSaved?: (garden: Garden) => void;
  onCancel?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [location,setLocation]=useState(garden?.location??"");
  const [zone,setZone]=useState(garden?.hardiness_zone??"");
  const [zoneMessage,setZoneMessage]=useState("");
  const [lookingUp,setLookingUp]=useState(Boolean(garden?.location&&!garden?.hardiness_zone));
  const locationChanged=useRef(false);
  const manualZone=useRef(false);
  const lookupVersion=useRef(0);
  useEffect(()=>{
    if(!location.trim()||manualZone.current||(!locationChanged.current&&garden?.hardiness_zone))return;
    const controller=new AbortController(),version=++lookupVersion.current;
    const timer=setTimeout(async()=>{
      if(manualZone.current)return;
      setLookingUp(true);setZoneMessage("Finding your USDA hardiness zone…");
      try{
        const response=await fetch("/api/garden-zone",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({location}),signal:controller.signal});
        const result=await response.json();
        if(!response.ok)throw new Error(result.error||"Zone lookup is unavailable. You can enter your zone yourself.");
        if(controller.signal.aborted||manualZone.current||lookupVersion.current!==version)return;
        if(!/^(?:[1-9]|1[0-3])[ab]$/.test(result.zone))throw new Error("The zone could not be verified. You can enter it yourself.");
        setZone(result.zone);setZoneMessage(`USDA Zone ${result.zone} · ZIP ${result.zip}. You can adjust it if needed.`);
      }catch(error){if(!controller.signal.aborted&&!manualZone.current&&lookupVersion.current===version)setZoneMessage(error instanceof Error?error.message:"Lookup unavailable. You can enter your zone yourself.");}
      finally{if(!controller.signal.aborted&&!manualZone.current&&lookupVersion.current===version)setLookingUp(false);}
    },600);
    return()=>{clearTimeout(timer);controller.abort();};
  },[location,garden?.location,garden?.hardiness_zone]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || lookingUp) return;
    const f = new FormData(event.currentTarget),
      name = String(f.get("name") || "").trim(),
      year = Number(f.get("year"));
    if (!name || !Number.isInteger(year) || year < 1900 || year > 2200) {
      setMessage("Enter a garden name and a year from 1900 to 2200.");
      return;
    }
    setBusy(true);
    setMessage("Saving…");
    try {
      const input = {
        name,
        year,
        location: String(f.get("location") || "").trim() || null,
        hardiness_zone: String(f.get("zone") || "").trim() || null,
      };
      if (guest) {
        const saved = saveGuestGarden(input, garden);
        onSaved?.(saved);
        setMessage("Garden saved on this device.");
        return;
      }
      const query = garden
        ? supabase.from("gardens").update(input).eq("id", garden.id)
        : supabase.from("gardens").insert(input);
      const { data, error } = await query.select("*").single();
      if (error) throw new Error(error.message);
      setMessage("Garden saved.");
      if (onSaved) onSaved(data as Garden);
      else window.location.reload();
    } catch (error) {
      setMessage(
        `Not saved: ${error instanceof Error ? error.message : "Connection failed. Try again."}`,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="seasonal-card mt-8 rounded-3xl border p-6 shadow-sm">
      <h2 className="seasonal-heading text-2xl font-black">
        {garden ? "Edit Garden" : "Create a New Garden"}
      </h2>
      <p className="seasonal-muted mt-2">
        Every growing season starts with a garden.
      </p>
      <form onSubmit={save} className="mt-5 space-y-4">
        <fieldset
          disabled={busy}
          className="grid gap-4 sm:grid-cols-2 disabled:opacity-60"
        >
          <Field
            label="Garden Name"
            name="name"
            value={garden?.name}
            required
            maxLength={100}
          />
          <label className="block text-sm font-bold">
            Year
            <input
              name="year"
              type="number"
              required
              min="1900"
              max="2200"
              step="1"
              defaultValue={garden?.year ?? new Date().getFullYear()}
              className="seasonal-input mt-1 w-full rounded-xl border p-3"
            />
          </label>
          <label className="block text-sm font-bold">Location
            <input name="location" value={location} maxLength={200} placeholder="ZIP code or City, State" autoComplete="address-level2" className="seasonal-input mt-1 w-full rounded-xl border p-3" onChange={event=>{
              lookupVersion.current++;locationChanged.current=true;manualZone.current=false;const next=event.target.value;
              setLocation(next);setZone("");setLookingUp(Boolean(next.trim()));setZoneMessage(next.trim()?"Finding your USDA hardiness zone…":"");
            }}/>
          </label>
          <div><label className="block text-sm font-bold">Hardiness Zone
            <input name="zone" value={zone} maxLength={20} aria-describedby="garden-zone-help" className="seasonal-input mt-1 w-full rounded-xl border p-3" placeholder="Filled in from your location" onChange={event=>{manualZone.current=true;lookupVersion.current++;setLookingUp(false);setZone(event.target.value);setZoneMessage("Using your entered zone.");}}/>
          </label><p id="garden-zone-help" role="status" className="seasonal-muted mt-2 text-xs leading-5">{zoneMessage||"Enter a U.S. ZIP code or city and state to find your zone automatically, or enter it yourself."}</p></div>
          <button
            type="submit"
            disabled={lookingUp}
            className="seasonal-button rounded-xl px-5 py-3 font-bold text-white sm:col-span-2"
          >
            {busy ? "Saving…" : lookingUp ? "Finding zone…" : "Save Garden"}
          </button>
        </fieldset>
        {onCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 underline"
          >
            Cancel
          </button>
        )}
        {message && (
          <p role="status" className="text-sm font-semibold">
            {message}
          </p>
        )}
      </form>
    </section>
  );
}

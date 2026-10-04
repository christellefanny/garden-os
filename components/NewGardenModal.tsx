"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewGardenModal() {
  const [name, setName] = useState("");
  const [year, setYear] = useState("2026");
  const [location, setLocation] = useState("");
  const [hardinessZone, setHardinessZone] = useState("");
  const [message, setMessage] = useState("");

  async function saveGarden() {
    setMessage("Saving...");

    const { error } = await supabase.from("gardens").insert({
      name,
      year: Number(year),
      location: location || null,
      hardiness_zone: hardinessZone || null,
    });

    if (error) {
      console.error("Error saving garden:", error);
      setMessage(`Error: ${error.message}`);
      return;
    }

    setMessage("Garden saved!");

    setName("");
    setYear("2026");
    setLocation("");
    setHardinessZone("");

    window.location.reload();
  }

  return (
    <div className="mt-8 rounded-3xl seasonal-card border p-6 shadow-md">
      <h2 className="text-2xl font-black seasonal-heading">
        🌱 Create a New Garden
      </h2>

      <p className="mt-2 seasonal-muted">
        Every growing season starts with a garden.
      </p>

      <div className="mt-6 space-y-4">
        <label htmlFor="garden-name" className="block text-sm font-semibold">Garden Name</label>
        <input
          id="garden-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Garden Name"
          className="seasonal-input w-full rounded-xl border p-3"
        />

        <label htmlFor="garden-year" className="block text-sm font-semibold">Year</label>
        <input
          id="garden-year"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          placeholder="Year"
          className="seasonal-input w-full rounded-xl border p-3"
        />

        <label htmlFor="garden-location" className="block text-sm font-semibold">Location</label>
        <input
          id="garden-location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Location"
          className="seasonal-input w-full rounded-xl border p-3"
        />

        <label htmlFor="garden-hardinessZone" className="block text-sm font-semibold">Hardiness Zone</label>
        <input
          id="garden-hardinessZone"
          value={hardinessZone}
          onChange={(event) => setHardinessZone(event.target.value)}
          placeholder="Hardiness Zone"
          className="seasonal-input w-full rounded-xl border p-3"
        />

        <button
          onClick={saveGarden}
          disabled={!name || !year}
          className="w-full rounded-xl seasonal-button py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Garden
        </button>

        {message && (
          <p role="status" className="text-sm font-semibold seasonal-muted">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

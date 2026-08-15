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
    <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-md">
      <h2 className="text-2xl font-black text-[#173d2b]">
        🌱 Create a New Garden
      </h2>

      <p className="mt-2 text-stone-600">
        Every growing season starts with a garden.
      </p>

      <div className="mt-6 space-y-4">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Garden Name"
          className="w-full rounded-xl border p-3"
        />

        <input
          value={year}
          onChange={(event) => setYear(event.target.value)}
          placeholder="Year"
          className="w-full rounded-xl border p-3"
        />

        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Location"
          className="w-full rounded-xl border p-3"
        />

        <input
          value={hardinessZone}
          onChange={(event) => setHardinessZone(event.target.value)}
          placeholder="Hardiness Zone"
          className="w-full rounded-xl border p-3"
        />

        <button
          onClick={saveGarden}
          disabled={!name || !year}
          className="w-full rounded-xl bg-[#245c42] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save Garden
        </button>

        {message && (
          <p className="text-sm font-semibold text-stone-600">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
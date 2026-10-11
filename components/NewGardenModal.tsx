"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { type Garden } from "@/lib/garden";
import { Field } from "@/components/SpaceEditor";

export default function NewGardenModal({
  garden,
  onSaved,
  onCancel,
}: {
  garden?: Garden;
  onSaved?: (garden: Garden) => void;
  onCancel?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
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
          <Field
            label="Location"
            name="location"
            value={garden?.location ?? ""}
            maxLength={200}
          />
          <Field
            label="Hardiness Zone"
            name="zone"
            value={garden?.hardiness_zone ?? ""}
            maxLength={20}
          />
          <button
            type="submit"
            className="seasonal-button rounded-xl px-5 py-3 font-bold text-white sm:col-span-2"
          >
            {busy ? "Saving…" : "Save Garden"}
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

"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Garden } from "@/lib/garden";
import Dialog from "@/components/ui/Dialog";
const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
type Settings = {
  ready: boolean;
  email: string;
  confirmed: boolean;
  version: number;
  preferences: { enabled: boolean; day: number; gardenId: string } | null;
};
export default function WeeklyEmail({
  guest,
  gardens,
  gardenId,
}: {
  guest: boolean;
  gardens: Garden[];
  gardenId: string;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null),
    [enabled, setEnabled] = useState(false),
    [day, setDay] = useState(1),
    [chosen, setChosen] = useState(gardenId);
  async function request(method: "GET" | "POST") {
    const { data } = await supabase.auth.getSession();
    if (!data.session)
      throw new Error("Sign in again to manage weekly emails.");
    const response = await fetch("/api/weekly-email", {
      method,
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
        "Content-Type": "application/json",
      },
      ...(method === "POST"
        ? {
            body: JSON.stringify({
              enabled,
              day,
              gardenId: chosen,
              version: settings?.version || 0,
            }),
          }
        : {}),
    });
    const value = await response.json();
    if (!response.ok)
      throw new Error(value.error || "Email preferences are unavailable.");
    return value;
  }
  async function load() {
    setOpen(true);
    setSettings(null);
    setMessage("");
    setBusy(true);
    try {
      const value = (await request("GET")) as Settings;
      setSettings(value);
      setEnabled(value.preferences?.enabled || false);
      setDay(value.preferences?.day ?? 1);
      setChosen(
        value.preferences?.gardenId || gardenId || gardens[0]?.id || "",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not load email settings.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await request("POST");
      setOpen(false);
      setMessage(
        enabled
          ? "Weekly garden emails are enabled for your account email."
          : "Weekly garden emails are off.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not save email settings.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="calendar-email-card seasonal-card">
      <div>
        <p className="modern-eyebrow">A little care, delivered</p>
        <h2>Your garden week, in your inbox</h2>
        <p>
          Plant priorities, seasonal reminders, and a gentle nudge to step
          outside.
        </p>
      </div>
      {guest ? (
        <p className="seasonal-muted">
          Weekly email is available with an account. Your guest calendar stays
          on this device.
        </p>
      ) : (
        <button type="button" className="seasonal-button" onClick={load}>
          Weekly email settings
        </button>
      )}
      {!open && message && <p role="status">{message}</p>}
      {open && (
        <Dialog title="Weekly garden emails" onClose={() => setOpen(false)}>
          <div className="weekly-settings">
            {busy && !settings && (
              <p role="status">Loading email preferences…</p>
            )}
            {settings && (
              <>
                <p>
                  Deliver to{" "}
                  <strong>{settings.email || "your account email"}</strong>
                </p>
                {!settings.ready && (
                  <p className="interior-notice">
                    Email delivery isn’t connected yet. Your calendar and weekly
                    priorities are available here; email will become available
                    once the mail service is set up.
                  </p>
                )}
                {!settings.confirmed && (
                  <p>
                    Please confirm your account email before enabling delivery.
                  </p>
                )}
                <label>
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={!settings.ready || !settings.confirmed}
                    onChange={(e) => setEnabled(e.target.checked)}
                  />{" "}
                  Send my weekly garden priorities by email
                </label>
                <label>
                  Garden
                  <select
                    className="seasonal-input"
                    value={chosen}
                    onChange={(e) => setChosen(e.target.value)}
                  >
                    {gardens.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Delivery day
                  <select
                    className="seasonal-input"
                    value={day}
                    onChange={(e) => setDay(Number(e.target.value))}
                  >
                    {days.map((name, i) => (
                      <option key={name} value={i}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  Morning delivery, around 8–10 a.m. Central. You can stop
                  emails here or use the unsubscribe link in any email.
                </p>
                <button
                  type="button"
                  className="seasonal-button"
                  onClick={save}
                  disabled={busy || (enabled && (!settings.ready || !chosen))}
                >
                  {busy ? "Saving…" : "Save email preferences"}
                </button>
              </>
            )}
            {message && <p role="status">{message}</p>}
          </div>
        </Dialog>
      )}
    </section>
  );
}

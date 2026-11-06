"use client";
import { useEffect, useState } from "react";
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
  testSender?: boolean;
  email: string;
  confirmed: boolean;
  version: number;
  preferences: { enabled: boolean; day: number; gardenId: string; firstName?: string } | null;
};
export default function WeeklyEmail({
  guest,
  gardens,
  gardenId,
  compact = false,
}: {
  guest: boolean;
  gardens: Garden[];
  gardenId: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [previewing, setPreviewing] = useState(false),
    [previewMessage, setPreviewMessage] = useState(""),
    [previewError, setPreviewError] = useState(false),
    [message, setMessage] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null),
    [enabled, setEnabled] = useState(false),
    [email, setEmail] = useState(""),
    [firstName, setFirstName] = useState(""),
    [day, setDay] = useState(1),
    [chosen, setChosen] = useState(gardenId);
  useEffect(() => {
    // Guest/account workspaces mount separately; guest state starts empty.
    if (guest) return;
    let active = true;
    async function refreshStatus() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        const response = await fetch("/api/weekly-email", {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
        if (!response.ok) throw new Error();
        const value = await response.json() as Settings;
        if (active) setSettings(value);
      } catch {
        if (active) setMessage("Could not check your subscription. Open email settings to retry.");
      }
    }
    void refreshStatus();
    return () => { active = false; };
  }, [guest]);
  async function request(method: "GET" | "POST") {
    const { data } = await supabase.auth.getSession();
    if (!data.session)
      throw new Error("Sign in again to manage weekly emails.");
    const response = await fetch(
      "/api/weekly-email",
      {
        method,
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        ...(method === "POST"
          ? {
              body: JSON.stringify({
                enabled,
                email: email.trim(),
                firstName: firstName.trim(),
                day,
                gardenId: chosen,
                version: settings?.version || 0,
              }),
            }
          : {}),
      },
    );
    const value = await response.json();
    if (!response.ok)
      throw new Error(value.error || "Email preferences are unavailable.");
    return value;
  }
  async function load() {
    setOpen(true);
    setPreviewMessage("");
    setSettings(null);
    setMessage("");
    setBusy(true);
    try {
      const value = (await request("GET")) as Settings;
      setSettings(value);
      setEmail(value.preferences?.enabled ? value.email || "" : "");
      setFirstName(value.preferences?.firstName || "");
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
  async function sendPreview() {
    if (previewing) return;
    setPreviewing(true);
    setPreviewError(false);
    setPreviewMessage("Preparing your weekly garden email…");
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Sign in again to send a preview.");
      const response = await fetch("/api/weekly-email/test", {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        signal: AbortSignal.timeout(65000),
      });
      const value = await response.json().catch(() => null);
      if (!response.ok) throw new Error(value?.error || "The preview request failed. Please try again later.");
      if (!value?.ok || !value.recipient) throw new Error("The mail service did not confirm acceptance. Check your inbox before retrying.");
      setPreviewMessage(`Preview accepted for ${value.recipient}. Check your inbox and spam folder. Inbox delivery is not yet confirmed. Your weekly schedule is unchanged.`);
    } catch (error) {
      setPreviewError(true);
      setPreviewMessage(error instanceof Error && error.name === "TimeoutError"
        ? "The request timed out. Delivery is uncertain—check your inbox before trying again."
        : error instanceof Error ? error.message : "Could not send the preview.");
    } finally { setPreviewing(false); }
  }
  const unsaved = !!settings && (email.trim() !== settings.email || firstName.trim() !== (settings.preferences?.firstName || "") || enabled !== (settings.preferences?.enabled || false) || day !== (settings.preferences?.day ?? 1) || chosen !== (settings.preferences?.gardenId || gardenId || gardens[0]?.id || ""));
  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const saved = await request("POST");
      setSettings((previous) => previous ? {
        ...previous, email: email.trim(), version: saved.version,
        preferences: saved.preferences,
      } : previous);
      setOpen(false);
      setMessage(
        enabled
          ? `Subscription saved for ${email.trim()}.`
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
    <section id="weekly-email" aria-label="Weekly garden emails" className={compact ? "email-subscription" : "calendar-email-card seasonal-card"}>
      {!compact && <div>
        <p className="modern-eyebrow">A little care, delivered</p>
        <h2>Your garden week, in your inbox</h2>
        <p>
          Plant priorities, seasonal reminders, and a gentle nudge to step
          outside.
        </p>
      </div>}
      {guest ? (
        <p className="seasonal-muted">
          Weekly email is available with an account. Your guest calendar stays
          on this device.
        </p>
      ) : (
        <div className="interior-actions">
          <button
            type="button"
            className="seasonal-button"
            onClick={load}
            disabled={busy}
          >
            {settings?.preferences?.enabled ? "Manage subscription" : "Subscribe by email"}
          </button>

        </div>
      )}
      {compact && <p className="seasonal-muted mt-2 max-w-sm text-sm">Receive your weekly garden tasks, plant care instructions, and upcoming work by email.</p>}
      {!guest && settings && (
        <p className="seasonal-muted mt-2 max-w-sm text-sm" role="status">
          {settings.preferences?.enabled
            ? `Subscribed · ${days[settings.preferences.day]}s · ${settings.email}`
            : "Weekly emails are off."}
          {settings.preferences?.enabled && !settings.ready && " Delivery is unavailable while email setup is incomplete."}
          {settings.testSender && " Email delivery is currently limited to the test account while we finish setup."}
        </p>
      )}
      {!open && message && <p role="status">{message}</p>}
      {open && (
        <Dialog title="Email subscription" onClose={() => setOpen(false)}>
          <form className="weekly-settings" onSubmit={(event) => { event.preventDefault(); void save(); }}>
            {busy && !settings && (
              <p role="status">Loading email preferences…</p>
            )}
            {settings && (
              <>
                <label>
                  First name
                  <input
                    className="seasonal-input"
                    type="text"
                    name="given-name"
                    autoComplete="given-name"
                    required={enabled}
                    maxLength={80}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    aria-describedby="email-first-name-help"
                  />
                </label>
                <p id="email-first-name-help">We’ll use this for a little hello at the start of your garden emails.</p>
                <label>
                  Deliver to
                  <input
                    className="seasonal-input"
                    type="email"
                    autoComplete="off"
                    required
                    maxLength={254}
                    value={email}
                    placeholder="you@example.com"
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <p>This address is for garden emails. Your sign-in email stays the same.</p>
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
                  type="submit"
                  className="seasonal-button"
                  disabled={busy || previewing || (enabled && (!settings.ready || !chosen))}
                >
                  {busy ? "Saving…" : "Save subscription"}
                </button>
                <div>
                  <button type="button" className="seasonal-button secondary"
                    onClick={sendPreview}
                    disabled={busy || previewing || unsaved || !settings.ready || !settings.confirmed || !settings.preferences?.enabled}>
                    {previewing ? "Sending preview…" : "Send me a preview"}
                  </button>
                  <p>Send one weekly garden email to {settings.email || "your saved address"}. This does not change your delivery schedule.</p>
                  {unsaved && <p>Save your changes, then reopen this window to send a preview.</p>}
                  {!settings.preferences?.enabled && <p>Enable and save your subscription before sending a preview.</p>}
                  {previewMessage && <p role={previewError ? "alert" : "status"} aria-live="polite">{previewMessage}</p>}
                </div>
              </>
            )}
            {message && <p role="status">{message}</p>}
          </form>
        </Dialog>
      )}
    </section>
  );
}

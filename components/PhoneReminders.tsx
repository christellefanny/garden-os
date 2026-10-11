"use client";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
type ReminderTask = { id: string; date: string; title: string; plant: string };
export default function PhoneReminders({
  userId,
  tasks,
  showControls = true,
  controlsTarget,
}: {
  userId: string;
  tasks: ReminderTask[];
  showControls?: boolean;
  controlsTarget?: HTMLElement | null;
}) {
  const [config, setConfig] = useState<{
    ready: boolean;
    publicKey: string | null;
  } | null>(null);
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch("/api/reminders/config")
      .then((r) => r.json())
      .then((value) => {
        if (alive) setConfig(value);
      })
      .catch(() => {
        if (alive)
          setMessage(
            "Could not check phone reminder setup. Refresh to try again.",
          );
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    if ("serviceWorker" in navigator && "PushManager" in window)
      navigator.serviceWorker
        .getRegistration("/")
        .then(async (r) => {
          const s = await r?.pushManager.getSubscription();
          if (alive)
            setEnabled(
              !!s &&
                localStorage.getItem(`garden-os-reminders-${userId}`) ===
                  "enabled",
            );
        })
        .catch(() => {});
    return () => {
      alive = false;
    };
  }, [userId]);
  const request = useCallback(async (path: string, body: unknown) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session)
      throw new Error("Sign in again to manage phone reminders.");
    const r = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const dataResult = await r.json();
    if (!r.ok)
      throw new Error(dataResult.error || "Could not update reminders.");
    return dataResult;
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const timer = setTimeout(() => {
      void navigator.serviceWorker
        .getRegistration("/")
        .then(async (r) => {
          const s = await r?.pushManager.getSubscription();
          if (s)
            await request("/api/reminders/device", {
              subscription: s.toJSON(),
              tasks,
            });
        })
        .catch((e) => {
          if (alive)
            setMessage(
              `Calendar changes are saved here, but phone reminders could not sync: ${e.message}`,
            );
        });
    }, 600);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [enabled, tasks, request]);
  async function enable() {
    setBusy(true);
    setMessage("");
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        throw new Error(
          "This browser does not support phone notifications. On iPhone, install Garden OS on your Home Screen first; on Android, use Chrome.",
        );
      if (!config)
        throw new Error(
          "Reminder setup is still loading. Try again in a moment.",
        );
      if (!config.ready || !config.publicKey)
        throw new Error(
          "Phone reminders need the one-time server setup. Your calendar is ready to use while reminders are being connected.",
        );
      const permission = await Notification.requestPermission();
      if (permission !== "granted")
        throw new Error(
          "Notifications are blocked. Allow them in this site's browser settings, then try again.",
        );
      await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      const r = await navigator.serviceWorker.ready;
      const key = Uint8Array.from(
        atob(config.publicKey.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      );
      const existing = await r.pushManager.getSubscription();
      const s =
        existing ||
        (await r.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }));
      try {
        await request("/api/reminders/device", {
          subscription: s.toJSON(),
          tasks,
        });
      } catch (e) {
        if (!existing) await s.unsubscribe();
        throw e;
      }
      localStorage.setItem(`garden-os-reminders-${userId}`, "enabled");
      setEnabled(true);
      setMessage("Phone reminders enabled. Send a test to check this device.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not enable reminders.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    setBusy(true);
    try {
      const r = await navigator.serviceWorker.getRegistration("/");
      const s = await r?.pushManager.getSubscription();
      if (s) {
        await request("/api/reminders/device", {
          endpoint: s.endpoint,
          disable: true,
        });
        await s.unsubscribe();
      }
      localStorage.removeItem(`garden-os-reminders-${userId}`);
      setEnabled(false);
      setMessage("Phone reminders turned off on this device.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Could not turn off reminders.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function test() {
    setBusy(true);
    try {
      const r = await navigator.serviceWorker.getRegistration("/");
      const s = await r?.pushManager.getSubscription();
      if (!s) throw new Error("Enable phone reminders first.");
      await request("/api/reminders/test", { endpoint: s.endpoint });
      setMessage("Test sent. Check your phone's notifications.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not send a test.");
    } finally {
      setBusy(false);
    }
  }
  if (!showControls) return null;
  const controls = (
    <div className="seasonal-card mt-5 rounded-2xl border p-5">
      <h3 className="seasonal-heading font-bold">Phone reminders</h3>
      <p className="seasonal-muted mt-2 text-sm leading-6">
        One morning digest when tasks are due, even with Garden OS closed.
        Free-plan timing is approximate: around 8–10 a.m. Central. Open the
        calendar after changing your vault to update reminders. No tasks due
        means no alert.
      </p>
      <p className="seasonal-muted mt-2 text-xs">
        Android: allow notifications in Chrome; add Garden OS to your Home
        Screen for app-like access. iPhone: add to Home Screen first, then
        enable notifications from the installed app.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {enabled ? (
          <>
            <button
              disabled={busy}
              onClick={test}
              className="seasonal-button rounded-xl px-4 py-2 text-sm font-bold text-white"
            >
              Send test notification
            </button>
            <button
              disabled={busy}
              onClick={disable}
              className="seasonal-outline rounded-xl border px-4 py-2 text-sm font-bold"
            >
              Turn off notifications
            </button>
          </>
        ) : (
          <button
            disabled={busy || !config}
            onClick={enable}
            className="seasonal-button rounded-xl px-4 py-2 text-sm font-bold text-white"
          >
            {busy ? "Setting up…" : "Enable phone reminders"}
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="mt-3 text-sm">
          {message}
        </p>
      )}
    </div>
  );
  return controlsTarget ? createPortal(controls, controlsTarget) : controls;
}

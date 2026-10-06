"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import GardenWorkspace from "@/components/GardenWorkspace";
import GardenHeader from "@/components/GardenHeader";
import GardenIcon from "@/components/ui/GardenIcon";
import SeasonDecoration from "@/components/seasonal/SeasonDecoration";
import { useSeason } from "@/components/seasonal/SeasonProvider";
import { type Garden, type Space } from "@/lib/garden";

export default function GardenApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState<{
    gardens: Garden[];
    spaces: Space[];
    error: string;
    userId: string;
  } | null>(null);
  const [authError, setAuthError] = useState("");
  const [recovering, setRecovering] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      setSession(data.session);
      setChecking(false);
      if (error) setAuthError(error.message);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, current) => {
      if (alive) {
        setSession(current);
        setChecking(false);
        if (event === "PASSWORD_RECOVERY") setRecovering(true);
      }
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const g = await supabase
        .from("gardens")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (g.error) {
        if (alive)
          setData({
            userId,
            gardens: [],
            spaces: [],
            error:
              g.error.code === "42703"
                ? "Private garden setup is needed in Supabase before you can save. Follow docs/PRIVATE_GARDEN_SETUP.md."
                : g.error.message,
          });
        return;
      }
      const ids = g.data.map((item) => item.id);
      const s = ids.length
        ? await supabase
            .from("growing_spaces")
            .select("*")
            .in("garden_id", ids)
            .order("created_at", { ascending: true })
        : { data: [], error: null };
      if (alive)
        setData({
          userId,
          gardens: g.data as Garden[],
          spaces: (s.data ?? []) as Space[],
          error: s.error?.message ?? "",
        });
    })().catch(() => {
      if (alive)
        setData({
          userId,
          gardens: [],
          spaces: [],
          error: "Could not connect to your garden. Refresh to try again.",
        });
    });
    return () => {
      alive = false;
    };
  }, [userId]);
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
      return;
    }
    setData(null);
    setSession(null);
  }
  if (recovering && session)
    return <PasswordRecovery onDone={() => setRecovering(false)} />;
  if (checking || (session && (!data || data.userId !== userId)))
    return (
      <main className="seasonal-page min-h-screen px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <GardenHeader gardenYear={new Date().getFullYear()} />
          <p role="status" className="seasonal-muted mt-12">
            Opening your garden…
          </p>
        </div>
      </main>
    );
  if (session && data && data.userId === userId)
    return (
      <>
        <GardenWorkspace
          key={userId}
          initialGardens={data.gardens}
          initialSpaces={data.spaces}
          initialError={data.error}
          userId={userId!}
          onSignOut={signOut}
        />
        {authError && (
          <p role="alert" className="mx-auto max-w-7xl p-5">
            {authError}
          </p>
        )}
      </>
    );
  return <Welcome authError={authError} />;
}

function Welcome({ authError }: { authError: string }) {
  const { season } = useSeason();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const f = new FormData(event.currentTarget),
      email = String(f.get("email") || "").trim(),
      password = String(f.get("password") || "");
    setBusy(true);
    setMessage("");
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw new Error(error.message);
        setMessage(
          "If an account exists for this email, a password reset link will arrive shortly.",
        );
        return;
      }
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: window.location.origin },
            });
      if (result.error) throw new Error(result.error.message);
      if (mode === "signup" && !result.data.session)
        setMessage(
          "Check your email to confirm your account. Then return here and sign in.",
        );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not connect. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="seasonal-page min-h-screen text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <GardenHeader gardenYear={new Date().getFullYear()} />
        <section className="mt-10 grid items-center gap-10 py-5 lg:grid-cols-[1.2fr_1fr] lg:py-12">
          <div>
            <p className="eyebrow seasonal-muted">A garden worth remembering</p>
            <div className="relative mt-5">
              <h2 className="editorial-title seasonal-heading max-w-xl text-5xl leading-[1.08] sm:text-6xl">
                More growing.
                <br />
                Less guessing.
              </h2>
            </div>
            <p className="seasonal-muted mt-6 max-w-lg text-lg leading-8">
              A thoughtful home for your beds, plants, and little discoveries.
              Plan with confidence. Keep a record. Enjoy what grows.
            </p>
            <div className="seasonal-hero relative mt-8 max-w-xl overflow-hidden rounded-3xl p-6 text-white">
              <div className="absolute -right-6 -top-8 opacity-50">
                <SeasonDecoration season={season} />
              </div>
              <p className="eyebrow text-white/80">Made for every season</p>
              <p className="editorial-title relative mt-3 max-w-xs text-3xl leading-tight">
                Your garden changes.
                <br />
                Your companion grows with it.
              </p>
              <div className="relative mt-5 flex flex-wrap gap-5 text-xs text-white/85">
                <span className="flex items-center gap-2">
                  <GardenIcon kind="bed" />
                  Plan your spaces
                </span>
                <span className="flex items-center gap-2">
                  <GardenIcon kind="log" />
                  Remember the season
                </span>
              </div>
            </div>
          </div>
          <div className="seasonal-card rounded-3xl border p-6 sm:p-8">
            <p className="eyebrow seasonal-muted">
              Your own patch of possibility
            </p>
            <h3 className="editorial-title seasonal-heading mt-3 text-3xl">
              {mode === "reset"
                ? "A fresh start."
                : mode === "signin"
                  ? "Welcome to your garden."
                  : "Let’s start growing."}
            </h3>
            <p className="seasonal-muted mt-3 text-sm leading-6">
              {mode === "reset"
                ? "Enter your account email to receive a password reset link."
                : mode === "signin"
                  ? "Sign in to keep your garden records together."
                  : "Create an account for your garden’s story, from first seed to final harvest."}
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <fieldset
                disabled={busy}
                className="space-y-4 disabled:opacity-60"
              >
                <label className="block text-sm font-bold">
                  Email
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="seasonal-input mt-2 w-full rounded-xl border p-3"
                  />
                </label>
                {mode !== "reset" && (
                  <label className="block text-sm font-bold">
                    Password
                    <input
                      name="password"
                      type="password"
                      minLength={mode === "signup" ? 8 : undefined}
                      required
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      className="seasonal-input mt-2 w-full rounded-xl border p-3"
                    />
                  </label>
                )}
                {mode === "signup" && (
                  <p className="seasonal-muted text-xs">
                    Use at least 8 characters.
                  </p>
                )}
                <button
                  type="submit"
                  className="seasonal-button w-full rounded-xl py-3 font-bold text-white"
                >
                  {busy
                    ? "One moment…"
                    : mode === "reset"
                      ? "Send reset link"
                      : mode === "signin"
                        ? "Open my garden"
                        : "Create my account"}
                </button>
              </fieldset>
              {(message || authError) && (
                <p
                  role="status"
                  className="seasonal-icon rounded-xl p-3 text-sm"
                >
                  {message || authError}
                </p>
              )}
            </form>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMessage("");
              }}
              className="seasonal-link mt-5 min-h-11 text-sm font-semibold underline"
            >
              {mode === "signin"
                ? "New here? Create an account"
                : "Already growing with us? Sign in"}
            </button>
            {mode === "signin" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMode("reset");
                  setMessage("");
                }}
                className="seasonal-muted ml-3 min-h-11 text-sm underline"
              >
                Forgot password?
              </button>
            )}
            <p className="seasonal-muted mt-5 border-t border-[var(--border)] pt-4 text-xs leading-5">
              A private place to keep your garden’s story.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function PasswordRecovery({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== form.get("confirm")) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      onDone();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update your password.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="seasonal-page min-h-screen px-5 py-8">
      <div className="mx-auto max-w-7xl">
        <GardenHeader gardenYear={new Date().getFullYear()} />
        <section className="seasonal-card mx-auto mt-12 max-w-md rounded-3xl border p-7">
          <h2 className="seasonal-heading editorial-title text-3xl">
            Choose a new password.
          </h2>
          <form onSubmit={save} className="mt-5 space-y-4">
            <fieldset disabled={busy} className="space-y-4">
              <label className="block text-sm font-bold">
                New password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="seasonal-input mt-2 w-full rounded-xl border p-3"
                />
              </label>
              <label className="block text-sm font-bold">
                Confirm password
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="seasonal-input mt-2 w-full rounded-xl border p-3"
                />
              </label>
              <button
                type="submit"
                className="seasonal-button w-full rounded-xl py-3 font-bold text-white"
              >
                {busy ? "Saving…" : "Save password"}
              </button>
            </fieldset>
            {message && (
              <p role="status" className="text-sm">
                {message}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import type { MonitoringReport } from "@/lib/owner-monitoring";
import styles from "./owner.module.css";

const vercel = "https://vercel.com/christellefanny-s-project/garden-os";
const statusLabels: Record<string, string> = {
  sent: "Accepted by Resend", delivered: "Delivered to mail server", opened: "Opened (estimated)",
  clicked: "Link clicked", bounced: "Bounced", failed: "Failed", complained: "Spam complaint",
  delivery_delayed: "Delivery delayed", suppressed: "Suppressed", scheduled: "Scheduled", canceled: "Canceled", unknown: "Unknown",
};

export default function OwnerDashboard() {
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const load = useCallback(async () => {
    const current = ++generation.current;
    setBusy(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (current !== generation.current) return;
      setSignedIn(!!session);
      if (!session) { setReport(null); return; }
      const response = await fetch("/api/owner/monitoring", {
        headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store", signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (current !== generation.current) return;
      if (!response.ok) { setReport(null); throw new Error(result.error || "Dashboard unavailable."); }
      setReport(result);
    } catch (e) {
      if (current === generation.current) { setReport(null); setError(e instanceof Error ? e.message : "Could not load monitoring."); }
    } finally { if (current === generation.current) setBusy(false); }
  }, []);

  useEffect(() => {
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") { generation.current++; setReport(null); setSignedIn(false); setBusy(false); }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") { generation.current++; setReport(null); }
    });
    return () => { generation.current++; subscription.unsubscribe(); };
  }, [load]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: String(form.get("email") || ""), password: String(form.get("password") || "") });
      if (error) throw error;
      await load();
    } catch { setError("Could not sign in. Check your email and password, or use the main site's password reset."); setBusy(false); }
  }

  const attention = report?.emails.records.filter((mail) => ["bounced", "failed", "complained", "delivery_delayed", "suppressed"].includes(mail.status)) || [];
  return <main className={styles.dashboard}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Garden Atelier · Owner access</p><h1>Your site, at a glance</h1><p>Private monitoring for mygardenatelier.com</p></div>
      <div className={styles.actions}>
        <a href="/">Visit website ↗</a>
        {signedIn && <><button onClick={() => void load()} disabled={busy}>{busy ? "Checking…" : "Refresh"}</button><button onClick={() => { generation.current++; setReport(null); void supabase.auth.signOut().then(({ error }) => { if (error) setError("Sign-out failed. Please try again."); else { setSignedIn(false); setBusy(false); } }); }}>Sign out</button></>}
      </div>
    </header>
    {error && <p className={styles.notice} role="alert">{error}</p>}
    {!signedIn && <section className={styles.login}><h2>Sign in to your dashboard</h2><p>Use your existing Garden Atelier owner account.</p>
      <form onSubmit={signIn}><label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button disabled={busy}>{busy ? "Checking…" : "Sign in"}</button></form>
      <a href="/">Need to reset your password? Open Garden Atelier.</a>
    </section>}
    {signedIn && busy && !report && <p role="status">Checking website, traffic and email records…</p>}
    {report && <>
      <p className={styles.updated}>Last checked {new Date(report.checkedAt).toLocaleString()}. Refresh for a new check.</p>
      <div className={styles.grid}>
        <section className={styles.card}><p className={styles.eyebrow}>Website</p><h2>{report.website.available ? "Responding" : "Needs attention"}</h2><p>{report.website.status ? `HTTP ${report.website.status} · ${report.website.milliseconds} ms` : "The website did not respond to this check."}</p><p className={styles.muted}>A current server check, not continuous uptime history.</p></section>
        <section className={styles.card}><p className={styles.eyebrow}>Email subscriptions</p><h2>{report.database.available ? report.database.activeSubscriptions : "Unavailable"}</h2><p>{report.database.available ? "Active weekly email subscriptions" : report.database.message}</p></section>
        <section className={styles.card}><p className={styles.eyebrow}>Traffic · Last 7 UTC days, including today</p>
          {report.traffic.available ? <><h2>{report.traffic.visitors} visitors</h2><p>{report.traffic.pageviews} page views</p><p className={styles.muted}>Totals may take a few minutes to update.</p></> : <><h2>Connection needed</h2><p>{report.traffic.message}</p></>}
          <a href={`${vercel}/analytics`} target="_blank" rel="noreferrer">Open traffic analytics ↗</a>
        </section>
        <section className={styles.card}><p className={styles.eyebrow}>Email attention</p><h2>{report.emails.available ? attention.length : "Unavailable"}</h2><p>{report.emails.available ? "Delivery issues in the loaded email records" : report.emails.message}</p><a href="https://resend.com/emails" target="_blank" rel="noreferrer">Open Resend ↗</a></section>
      </div>
      <section className={styles.records}><div className={styles.header}><div><p className={styles.eyebrow}>Email activity</p><h2>What happened to each email</h2></div><a href={`${vercel}/logs`} target="_blank" rel="noreferrer">Website error logs ↗</a></div>
        <p>Garden Atelier messages found in the latest 100 Resend account records. These are recent records, not lifetime totals.</p>
        <p className={styles.muted}>“Accepted” means Resend accepted the send request. “Delivered” means the receiving mail server accepted it; neither proves it reached the inbox. Open tracking is approximate.</p>
        {!report.emails.available ? <p className={styles.notice}>{report.emails.message}</p> : report.emails.records.length === 0 ? <p>No Garden Atelier messages were found in the loaded records.</p> : <div className={styles.tableWrap}><table><thead><tr><th>Sent</th><th>Recipient</th><th>Subject</th><th>Latest status</th></tr></thead><tbody>{report.emails.records.map((mail) => <tr key={mail.id}><td>{new Date(mail.createdAt).toLocaleString()}</td><td>{mail.to.join(", ")}</td><td>{mail.subject}</td><td><span className={attention.includes(mail) ? styles.warning : styles.status}>{statusLabels[mail.status] || mail.status}</span></td></tr>)}</tbody></table></div>}
        {report.emails.hasMore && <p>More records are available in <a href="https://resend.com/emails" target="_blank" rel="noreferrer">Resend</a>.</p>}
      </section>
    </>}
  </main>;
}

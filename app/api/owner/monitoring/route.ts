import { authenticated, adminDatabase } from "@/lib/reminders-server";
import { isMonitoringOwner, readEmailReport, readTrafficReport } from "@/lib/owner-monitoring";

export const maxDuration = 30;
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: Request) {
  let auth;
  try { auth = await authenticated(request); }
  catch { return Response.json({ error: "Sign-in verification is unavailable. Try again later." }, { status: 503, headers }); }
  if (!auth) return Response.json({ error: "Sign in to view your private dashboard." }, { status: 401, headers });
  if (!isMonitoringOwner(auth.user, process.env.GARDEN_OWNER_EMAIL))
    return Response.json({ error: "This dashboard is restricted to the site owner." }, { status: 403, headers });

  const [emails, traffic, database, website] = await Promise.all([
    readEmailReport(process.env.RESEND_MONITORING_API_KEY || process.env.RESEND_API_KEY),
    readTrafficReport(process.env.VERCEL_MONITORING_TOKEN),
    (async () => {
      try {
        const { count, error } = await adminDatabase().from("garden_os_state")
          .select("key", { count: "exact", head: true })
          .like("key", "garden-os-weekly-email-%").eq("value->>enabled", "true")
          .abortSignal(AbortSignal.timeout(10000));
        if (error) throw error;
        return { available: true, activeSubscriptions: count ?? 0 };
      } catch { return { available: false, message: "Subscription database could not be read." }; }
    })(),
    (async () => {
      const started = Date.now();
      try {
        const response = await fetch("https://mygardenatelier.com/", { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(10000) });
        return { available: response.ok, status: response.status, milliseconds: Date.now() - started };
      } catch { return { available: false, milliseconds: Date.now() - started }; }
    })(),
  ]);
  return Response.json({ checkedAt: new Date().toISOString(), emails, traffic, database, website }, { headers });
}

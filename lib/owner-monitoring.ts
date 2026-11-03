export function isMonitoringOwner(user: { email?: string; email_confirmed_at?: string } | null, ownerEmail: string | undefined) {
  return !!(ownerEmail?.trim() && user?.email_confirmed_at && user.email?.toLowerCase() === ownerEmail.trim().toLowerCase());
}

export type MailRecord = { id: string; to: string[]; subject: string; createdAt: string; status: string };
export type EmailReport = { available: boolean; message?: string; records: MailRecord[]; hasMore?: boolean };
export type TrafficReport = { available: boolean; message?: string; visitors?: number; pageviews?: number; since?: string; until?: string };
export type MonitoringReport = {
  checkedAt: string;
  emails: EmailReport;
  traffic: TrafficReport;
  database: { available: boolean; message?: string; activeSubscriptions?: number };
  website: { available: boolean; status?: number; milliseconds: number };
};

export async function readEmailReport(key: string | undefined): Promise<EmailReport> {
  const unavailable = (message: string): EmailReport => ({ available: false, message, records: [] });
  if (!key) return unavailable("Email monitoring needs a Resend API key on the server.");
  try {
    const response = await fetch("https://api.resend.com/emails?limit=100", {
      headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (response.status === 401 || response.status === 403)
      return unavailable("The Resend key cannot read email records. Add a key with read access as RESEND_MONITORING_API_KEY in Vercel production settings.");
    if (!response.ok) return unavailable(`Resend could not return email records (HTTP ${response.status}). Try refreshing later.`);
    const result = await response.json();
    if (!Array.isArray(result.data)) return unavailable("Resend returned an unexpected response.");
    // A Resend account may also send email for other projects.
    const records = result.data.filter((item: Record<string, unknown>) =>
      typeof item.from === "string" && /(?:@mygardenatelier\.com\s*>?$|^Garden Atelier\s*<onboarding@resend\.dev>$)/i.test(item.from)
    ).map((item: Record<string, unknown>) => ({
      id: String(item.id || ""),
      to: Array.isArray(item.to) ? item.to.filter((v: unknown): v is string => typeof v === "string") : [],
      subject: String(item.subject || "(No subject)"),
      createdAt: String(item.created_at || ""),
      status: String(item.last_event || "unknown"),
    }));
    return { available: true, records, hasMore: !!result.has_more };
  } catch { return unavailable("Resend could not be reached. Refresh to try again."); }
}

export async function readTrafficReport(key: string | undefined, now = new Date()): Promise<TrafficReport> {
  if (!key) return { available: false, message: "Connect live traffic totals by adding VERCEL_MONITORING_TOKEN in Vercel production settings. Analytics is still available in Vercel." };
  const until = new Date(now);
  until.setUTCHours(0, 0, 0, 0);
  until.setUTCDate(until.getUTCDate() + 1);
  const since = new Date(until);
  since.setUTCDate(since.getUTCDate() - 7);
  const query = new URLSearchParams({ projectId: "prj_862N8cpKBGiiDyb3lfBoJ8artmX7", teamId: "team_njF3iEEUt0p34PnZsRCQWzah", since: since.toISOString(), until: until.toISOString() });
  try {
    const response = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/count?${query}`, {
      headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { available: false, message: `Vercel could not return traffic totals (HTTP ${response.status}). Check the monitoring token's team access.` };
    const result = await response.json();
    if (typeof result.data?.visitors !== "number" || typeof result.data?.pageviews !== "number")
      return { available: false, message: "Vercel returned an unexpected analytics response." };
    return { available: true, visitors: result.data.visitors, pageviews: result.data.pageviews, since: since.toISOString(), until: until.toISOString() };
  } catch { return { available: false, message: "Vercel analytics could not be reached. Refresh to try again." }; }
}

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
export function remindersReady() {
  return !!(
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.CRON_SECRET
  );
}
export function userDatabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
export function adminDatabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function authenticated(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const db = userDatabase(token);
  const { data, error } = await db.auth.getUser(token);
  return error || !data.user ? null : { db, user: data.user };
}
export function validEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.port &&
      !u.username &&
      !u.password &&
      [
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
      ].includes(u.hostname)
    );
  } catch {
    return false;
  }
}
export function validSubscription(s: unknown): s is webpush.PushSubscription {
  if (!s || typeof s !== "object") return false;
  const p = s as webpush.PushSubscription;
  return (
    validEndpoint(p.endpoint) &&
    !!p.keys &&
    typeof p.keys.p256dh === "string" &&
    /^[A-Za-z0-9_-]{80,100}$/.test(p.keys.p256dh) &&
    typeof p.keys.auth === "string" &&
    /^[A-Za-z0-9_-]{20,30}$/.test(p.keys.auth)
  );
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 1500000) throw new Error("Request too large.");
  return JSON.parse(text);
}
export async function sendReminder(
  subscription: webpush.PushSubscription,
  title: string,
  message: string,
) {
  if (!validSubscription(subscription))
    throw new Error("Unsupported push subscription.");
  webpush.setVapidDetails(
    "https://garden-os-beta.vercel.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return webpush.sendNotification(
    subscription,
    JSON.stringify({ title, body: message }),
    { TTL: 86400, timeout: 10000 },
  );
}
export function setupError() {
  return Response.json(
    {
      error:
        "Phone reminders need the one-time Supabase and server setup. Your calendar is still available.",
    },
    { status: 503 },
  );
}

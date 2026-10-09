import { remindersReady } from "@/lib/reminders-server";
export async function GET() {
  return Response.json(
    {
      ready: remindersReady(),
      publicKey: process.env.VAPID_PUBLIC_KEY || null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

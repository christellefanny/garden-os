# Growing Calendar and phone reminders

The calendar reads the signed-in user's Plant Vault from this browser. It groups varieties and generates a year of planning prompts. You can include/exclude plants, choose indoor/outdoor growing, adjust frost planning anchors, mark tasks done, skip or move them. Calendar choices are saved in the current browser, just like the Plant Vault. Visit the calendar after changing your vault to update the reminder snapshot.

Dates are planning estimates for Plainfield, Illinois (America/Chicago), not forecasts or cultivar-specific instructions. Check seed packets, species guidance and current conditions. May 15/October 15 are editable anchors. Past-only and Not Growing Again entries are excluded initially.

## One-time account setup

1. In Supabase, open SQL Editor, create a query, paste `supabase/growing-reminders.sql`, and run it. This adds an isolated reminder-device table with owner-only access; it does not change gardens or growing spaces.
2. In Supabase Settings → API Keys → Publishable and secret API keys, copy a server **secret** key (`sb_secret_…`). In Vercel's Garden OS project → Settings → Environment Variables, add `SUPABASE_SERVICE_ROLE_KEY`, paste that key as the value, select **Production**, mark it sensitive, and save. The historical variable name accepts the current secret key. A legacy service_role key also works. Never use NEXT_PUBLIC for this key or paste it into chat.
3. Redeploy the latest feature/seasonal-themes commit to production so the server receives the variable.

VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and CRON_SECRET have already been configured in Vercel. They are never committed. Preview phone delivery is intentionally disabled.

## Enable on each phone

Open https://garden-os-beta.vercel.app, sign in and open Growing Calendar. Tap Enable phone reminders, allow notifications, then Send test notification. On iPhone/iPad, install the app through Safari's Share → Add to Home Screen and open that installed app first (iOS/iPadOS 16.4+). Android Chrome supports web push; notification permissions and device settings must allow it. Each device has its own subscription.

One digest is scheduled daily at 14:00 UTC (8 AM Central standard time / 9 AM daylight time). Vercel Hobby scheduling can run later within that hour. It sends only when tasks are due that day and combines tasks to reduce interruptions. Network, phone settings, expired subscriptions and paused Supabase projects can interrupt delivery. Tasks changed in the calendar sync to that phone's snapshot; changes in another browser do not automatically sync here.

A small server snapshot contains task ID/date/title/plant plus push subscription keys; vault notes/photos are not uploaded. Only the owner can manage their devices. Signing out unsubscribes this browser; expired device records are cleaned up during delivery. Turning off phone reminders deletes the device record. The service worker handles notifications only and does not cache authenticated pages or promise offline access.

## Verification

Run npm run build with the existing public Supabase configuration and npm run lint. Calendar engine tests and a two-account/anonymous PostgreSQL RLS integration test are in tests/growing-calendar.test.mjs and tests/reminders-rls.test.mjs. Real encrypted push delivery needs the production SQL/key setup, notification permission and a test on the user's phone; a passing build does not establish that it works.

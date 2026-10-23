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

## Reminders directly from the Plant Vault

Click a plant card to open its details. Use Edit to change plant information, or add a Plant reminder directly in the detail view. Enter Remind me to and a date, then tap Add reminder. This saves the reminder independently of Save to Plant Vault and keeps other plant edits in the form. You can remove a saved reminder in those same details. Enable phone reminders from Growing Calendar once per device; both the vault and calendar synchronize the same task snapshot. Custom reminders are included even for plants excluded from automatic planning and retain the variety name. They join the morning digest, not an alert at a specific time. Calendar reminders and completions remain saved in this browser; a Plant Vault export currently backs up the plants, not the calendar preferences/reminders.

Calendar views group reminders by task title. Open a task category to see affected plants, dates, instructions and each plant's completion/rescheduling controls. Due tasks in the phone digest use the same categories; one due category uses that task's title, while several categories share a digest. Opening a notification opens the calendar so you can expand the task groups.

## Illustrated month calendar and weekly email (October 2026)

The Growing Calendar opens on the real current month. Monday-first cells show no more than two unfinished task labels, with an additional count; phones show counts instead. Selecting a date opens its complete task details with illustrations of the corresponding saved Plant Vault entries. Done, skipped and moved tasks use the existing saved overrides. No example plants, tasks or garden records are written by the redesign.

The month illustration changes by the displayed month's Northern Hemisphere season: spring lettuce, summer tomatoes, fall garlic and winter kale. Spring lettuce is the approved generated watercolor, exported with transparency to `public/calendar/spring-lettuce.webp`. Other header art reuses existing illustrated planting-guide assets. Task portraits use the existing botanical/crop plates and cut-flower illustrations; no user photos are substituted. The app-wide selected season still controls accents.

Care prompts are distributed weekly for entries marked Growing Now or Have Plant. Seeds and wishlists do not imply living plants. Outdoor checks follow the editable frost anchors; indoor plants get checks year-round. They ask to inspect moisture or pests, never prescribe automatic watering or treatment. The calendar cannot observe seedling stage, actual soil temperature or current moisture. Packet-specific indoor sowing windows share the same calculation as Plant Vault reminder suggestions. Unedited generic seed-start dates now precede transplanting; explicitly saved edits under the former task ID remain accessible.

### Email setup

Email is explicitly opt-in and independent of phone notifications. No accounts are subscribed by this change. The settings dialog reports delivery as unconnected until its server dependencies are configured. Delivery is implemented using Resend's HTTPS API; no email credentials belong in browser code.

Configure these **production-only** Vercel variables using the provider/dashboard; never commit their values:

- `RESEND_API_KEY`: sending key from your Resend account.
- `GARDEN_EMAIL_FROM`: approved sender on a domain verified with Resend, e.g. `Garden Atelier <garden@your-verified-domain>`.
- Existing `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` remain required.
- Optional `GARDEN_APP_ORIGIN`: HTTPS canonical site origin; defaults to the existing production URL.
- Optional `EMAIL_UNSUBSCRIBE_SECRET`: stable signing secret; defaults to `CRON_SECRET`. Rotating the active signing secret invalidates previous unsubscribe links; account settings always remain available.

There is no additional SQL migration: preferences and per-week delivery claims use the existing owner-protected `garden_os_state` table, separately from calendar data, through the existing version-checked save RPC. Email recipients are read from confirmed Supabase Auth account emails, never accepted from request bodies. The selected garden must belong to the authenticated user. An email includes actual weekly priorities, preparation, saved reminders, limitations, and a calendar link. It does not invent an observed stage or weather forecast.

The existing daily `/api/reminders/dispatch` job at 14:00 UTC also checks weekly email subscriptions, even when the user has no phone subscription. It is protected by `CRON_SECRET`; previews cannot send emails. Each user gets at most one digest per Monday–Sunday week, with a unique database claim plus provider idempotency key. A confirmed provider rejection releases the claim; an ambiguous network outcome keeps it to prevent duplicate mail. The footer has a signed unsubscribe link and one-click unsubscribe headers. GET displays a confirmation without changing consent (mail scanners are safe); POST disables only the matching subscription version.

Operational limit: a run reads up to 200 subscriptions and reserves up to 35 seconds for email work inside the existing 60-second cron function. Review delivery counts and move to a queued/paginated worker before usage exceeds that capacity. Unknown delivery outcomes require operator review; a provider receipt confirms API acceptance, not inbox arrival. Mail delivery, domain verification and real inbox arrival still require the production provider setup and a consenting account test.

Verification: `npm test`, `npm run lint`, `npx tsc --noEmit`, production build, and `node tests/botanical-calendar.browser.mjs`. The browser test uses isolated Supabase fixtures only and checks desktop/mobile, all four artwork choices, real month dates, task overflow, plant illustrations, saved completion/cloud sync, guest empty state and accessibility. Email tests cover recipient selection, consent, provider failure, duplicate claims, signed links and unsubscribe version conflicts without sending external mail.

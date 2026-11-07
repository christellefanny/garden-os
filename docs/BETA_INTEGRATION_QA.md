# Unpublished beta integration review

Date: 2026-11-07

## Scope

Integrated cloud-saving recovery and first-garden guidance on current main `2e71b535a678e91b129bd57a49eeb24bd36a0377` (rechecked through GitHub before finishing). No push, pull request, merge to main, application deployment, production database writes, emails, or real-account browser actions. A separately authorized, temporary Vercel Sandbox was used only for isolated synthetic browser verification and is now stopped.

Source commits:
- Saving: `811c148aca1847295a24970cb2aa94ebe034f9d7`
- First garden: `c8f6c7ac8689376176d14ef8de9779397b0148a2`

The newer main's guest-first welcome, leading growing discovery, and Calendar/Tasks/Journal group are retained. The dashboard conflict was resolved by keeping growing discovery before the new first-garden steps. Browser selectors were updated for the current welcome and grouped navigation.

## Safety issues found and fixed

1. A recovered cloud read could replace storage while an open Vault/layout editor retained an older collection. Saving from that editor could then overwrite newer cloud data. Automatic hydration now happens only before the workspace first opens. Later remote differences are preserved for explicit Settings review, and their uploads remain blocked. The guard survives manual Retry; account changes get their own boundary. Unsaved editor forms are not remounted by recovery.
2. PostgreSQL JSONB can reorder object properties. Raw string comparisons treated unchanged cloud data as a conflict. Comparisons now ignore JSON object-property order while retaining array order and literal string differences.
3. Staged cloud-only keys remain in pending status, including across failed retries and unrelated edits. A null pending marker is never uploaded as a value. Missing local records remain absent until explicit application or a clean initial load.

A fresh remote edit after an explicit cloud choice remains reviewable rather than replacing the chosen version silently. Existing local/cloud backups are retained.

## Passed verification

- `npm test`: 305 tests passed, zero failures/skips. Includes ownership/database policies and 20 cloud-sync tests.
- Cloud-sync regressions cover initial read failure, reconnect/version reload, automatic and manual retry, persisted pending edits, transient PUT failure, genuine conflicts, in-flight newer edits, ambiguous successful saves, cleanup, malformed reads, stale conflict choices, open-editor stale-write protection, cloud-only staging, repeated retry, explicit-choice races, and actual PGlite JSONB normalization.
- Production Next.js build passed.
- `npx tsc --noEmit` passed.
- `npm run lint`: zero errors and five existing warnings in FlowersPage, GardenWorkspace, and PhotoJournal.
- `git diff --check` passed.
- Browser-suite JavaScript syntax checks and focused lint passed.
- `node tests/cloud-sync.http.mjs`: passed against the production server and isolated Supabase-compatible fixture. Verified page response, unauthenticated state rejection, foreign-account key rejection, first save/read, stale-version 409 retaining original data, and current-version update.

## Browser verification passed in an isolated sandbox

The supported temporary Vercel Sandbox ran the exact integrated application tree from commit `42dab7e25e685e88abcd7e436310da4e176a6899` (tree hash `cc3d3389666fb8aa5673d36ea499d724ddeecb26`). Only browser-runner fixes, HTTP request isolation, and screenshot capture were added afterward; application code did not change.

- `tests/cloud-sync.browser.mjs` passed against the production Next.js server and a local Supabase-compatible synthetic fixture. Verified failed initial read → local journal edit → reconnect → cloud acknowledgement → reload; transient save failure and manual Retry; genuine conflict with both recovery copies and explicit use-cloud choice; a fresh second browser reading the saved journal; an open Vault draft surviving recovery; stale writes remaining blocked across manual Retry; and explicit Settings resolution preserving the backup. No browser runtime errors.
- `tests/first-garden.browser.mjs` passed against the development Next.js server and local synthetic fixture. Verified guest garden/zone → growing space → first plant → first calendar task, persistence after reload, exactly one of each saved record, optional zone, a task without a plant, Cancel/Escape/Back, interrupted task entry, and zero guest cloud writes or browser runtime errors.
- Desktop viewport: 1440×1000. Mobile: 390×844, with a 320px overflow assertion. No horizontal overflow at 320px.
- Axe reported zero WCAG 2 A/AA and WCAG 2.1 AA violations within the Create your garden dialog. This is a scoped automated check, not a whole-site accessibility audit.
- Visually inspected captured desktop/mobile first-step panels and the mobile garden dialog: readable labels and buttons, no clipped content. Screenshots and the passing logs are retained locally as QA evidence.

The first browser attempt completed all cloud checks and the desktop guest flow but Chromium crashed when opening the mobile context with old single-process launch flags. Removing those flags exposed a test-runner integration requirement: Axe needs an explicit `browser.newContext()`. After correcting both test-runner issues, the entire guest desktop/mobile suite passed. No application fix was needed for these runner failures.

### Isolation, resource use, and cleanup

- Public repository source only, with the local integration overlay checked against the exact Git tree. No credentials were needed to clone it.
- No production project environment variables were imported. The only app configuration was a loopback Supabase fixture URL and a test-only publishable key. Checked that service-role, email, cron, push-private-key, and Vercel-token variables were absent.
- Both browser suites block all non-loopback HTTP(S) requests. All accounts, gardens, plants, and conflict records were synthetic. There were no exposed sandbox routes or production endpoints used.
- Sandbox `garden-beta-qa-42dab7e` / session `sbx_Qt3oq7iIFCIiMGmMiEX5pfAKQ1KA`: nonpersistent, two vCPUs, 4 GB memory, iad1, a 15-minute automatic limit. Explicitly stopped and re-read as `stopped`; routes were empty. No snapshot was created.
- Runtime was 798.467 seconds (13 minutes 18 seconds), including artifact retrieval. Reported active CPU duration: 152.689 seconds; egress: 2,000,761 bytes. The published maximum allocated compute estimate for this run is under USD $0.09. Actual charges, plan, and credits were not available from the connected account tools. Pricing checked at https://vercel.com/docs/sandbox/pricing.

### Remaining limits

These results verify the specified beta flows with deterministic local fixtures, not a real Supabase account or production backend. Real email, push notifications, external location lookup, Safari, Firefox, and a whole-site accessibility review were not exercised. No publication is implied or authorized by this report.

The original local Chromium socket restriction was not retried or bypassed. The ordinary cloud browser could not reach the local preview. The separately authorized Vercel Sandbox provided a supported isolated route instead. Normal Vercel previews were deliberately not used because the current preview configuration shares the production Supabase connection.

The local production build uses `http://127.0.0.1:54321` and the test-only publishable key. Rebuild with the intended deployment environment before any separately authorized publication. Do not deploy this local prebuilt artifact.

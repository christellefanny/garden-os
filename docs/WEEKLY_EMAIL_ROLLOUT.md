# Weekly email reliability and personalization rollout

## Before release

1. Apply `supabase/weekly-email-reliability.sql` to the existing production Supabase project **before** deploying this dispatcher. The additive migration creates private run and delivery tables; it does not rewrite subscriptions, gardens, or existing delivery claims. Re-running it is supported.
2. Verify RLS is enabled on both tables, there are no client policies, and `anon`/`authenticated` have no privileges. `service_role` needs only SELECT, INSERT, and UPDATE. The migration resets broad Supabase default grants before granting these operations.
3. Confirm the existing production server settings: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `GARDEN_EMAIL_FROM`, and `CRON_SECRET`. Keep secrets server-only. Check the sender's verified domain in Resend; a `resend.dev` test sender restricts recipients. Use `GARDEN_APP_ORIGIN` for the canonical HTTPS site and preserve the existing `EMAIL_UNSUBSCRIBE_SECRET` (or its `CRON_SECRET` fallback) so existing unsubscribe links keep working. `GARDEN_CONTACT_EMAIL` is optional for replies.
4. Deploy source through the normal reviewed release process. Do not deploy a local build compiled for the fixture Supabase URL. Verify authenticated settings load and that the signup card sits above the calendar controls. No subscriber name backfill is needed; older subscriptions use “Hello there,” until a name is saved.
5. Confirm the daily production cron remains `/api/reminders/dispatch` at `0 14 * * *` (14:00 UTC, 8 or 9 a.m. Central). Delivery weekday calculations remain America/Chicago. This release does not change anyone's saved weekday, email, or garden.
6. Observe the next scheduled run, or use a separately authorized test recipient. Do not invoke production dispatch as a read-only health check: it can send due emails. A successful preview confirms only provider acceptance, not inbox delivery, and does not exercise the private scheduled-delivery ledger.

## What is recorded and retried

- `garden_email_dispatch_runs` records fixed reason codes and counts. It does not store addresses, names, secrets, or email bodies. A successful HTTP response requires no email failure, unresolved claim, or deferred work. Email diagnostics remain in the response even when the separate phone-device query fails.
- `garden_weekly_email_deliveries` records a unique user/week claim, attempt/version identifiers, preference and recipient hashes, and any provider receipt ID. RLS and grants keep this operational history away from client accounts.
- Preparation failures before the provider request and explicit HTTP 429 rejections may retry, at most three attempts, after a one-hour minimum cooldown. The existing once-daily cron normally retries the following day. The saved subscription and recipient must still match, including the first name; final consent is checked again before sending.
- Timeouts, transport failures, 5xx, HTTP 408/409, malformed receipts, unresolved pending claims, and rejected requests are **not** automatically resent. They require review. Provider acceptance is not confirmation of delivery or inbox placement.
- New sends are created only on the chosen weekday. There is no automatic backfill for a missed cron, a late signup, or unclaimed work deferred by the run-time budget. Deferred work is reported as unhealthy so it can be investigated, rather than silently changing delivery days.
- Old `garden_os_state` delivery claims remain duplicate barriers. They are owner-writable and never confer retry authority. The new dispatcher also writes a legacy barrier so an old deployment or rollback will not automatically resend a newly claimed week.

## Monitoring and recovery

Inspect the most recent run status and summary after release. A missing daily run, a long-running `running` record, an `attention` status, or HTTP 503 needs investigation. The ledger is a private audit trail, not a delivery webhook or an alerting service; connect existing operational monitoring separately if needed.

Useful read-only operator queries:

```sql
select id, started_at, finished_at, status, summary
from public.garden_email_dispatch_runs
order by started_at desc limit 20;

select week_start, status, reason, count(*)
from public.garden_weekly_email_deliveries
group by week_start, status, reason
order by week_start desc, status;
```

For uncertain delivery, correlate the private claim's provider ID, idempotency key, and attempt time with Resend's logs and the intended recipient. Do not clear, delete, reset, or recreate a claim merely to try sending again. Check the outcome first and obtain approval for any corrective send or state change. Existing legacy claims are deliberately retained even if they were never marked sent.

On rollback, keep both new tables and all old barriers. Never drop the ledger or loosen its permissions to make an older deployment work. If the migration is missing or an audit/claim write fails, the new dispatcher fails closed instead of sending without a reliable record.

## Local verification

```sh
npm test
npm run lint
npm run build -- --webpack
```

The RLS tests use in-memory PostgreSQL with Supabase-style default grants. The dispatcher tests mock the provider and database, including overlapping claims, safe retries, uncertain outcomes, changing consent, personalization, pagination, and phone failures. They never send real email.

For the isolated browser test, first build with the fixture variables, then run:

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=garden-os-local-preview \
npm run build -- --webpack
node tests/weekly-email-personalization.browser.mjs
```

It checks signup placement, first-name validation/persistence, previews, dismissal/history, legacy opt-out, narrow layouts, and accessibility against local fixtures. It requires a working Chromium executable (`GARDEN_TEST_BROWSER` can override the default) and permission for local browser IPC sockets. A build or unit-test pass is not a browser-test pass.

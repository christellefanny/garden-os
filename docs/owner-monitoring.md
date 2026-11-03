# Private owner monitoring

Open `https://mygardenatelier.com/owner` and sign in with the existing owner account. This standalone page is not linked in the customer interface. All monitoring data comes from an authenticated, non-cacheable server endpoint. The server requires a confirmed account email matching `GARDEN_OWNER_EMAIL`; ordinary accounts receive 403 before any provider or admin database access.

## Production configuration

- `GARDEN_OWNER_EMAIL`: the confirmed owner account email. Missing configuration denies access.
- `RESEND_MONITORING_API_KEY`: optional dedicated Resend key with permission to list emails. Falls back to the existing `RESEND_API_KEY`. Resend sending-only keys cannot read records; its Full access permission is required with the current key model. Keep this secret server-side.
- `VERCEL_MONITORING_TOKEN`: Vercel access token scoped to the team containing Garden Atelier, stored as a production secret. The project and team IDs are fixed in the server integration. Missing or rejected credentials show an unavailable state, never zero traffic.
- Existing Supabase service role and public client configuration are reused.

Redeploy after changing production variables. Never use `NEXT_PUBLIC_` for monitoring keys or paste them into chat. Tokens should be entered directly in Vercel project environment settings.

## Scope and interpretation

Traffic covers seven UTC calendar dates including today, using the same Vercel Analytics count endpoint as its dashboard. The private owner page is excluded from pageview reporting.

Email records are Garden Atelier sender matches within the most recent 100 Resend account records. They are not lifetime totals. Other project senders are excluded. The table preserves the provider's latest event and distinguishes acceptance from recipient-server delivery. Delivery does not guarantee inbox placement; open data is approximate. A link to Resend provides older records.

Website response is a single server-side HTTP HEAD check when the dashboard refreshes, not continuous uptime monitoring. Active subscriptions are counted from saved enabled weekly-email settings. This page does not send emails, change subscriptions, or run the dispatch job.

## Checks

`node --test tests/owner-monitoring.test.mjs` verifies denied access before provider/database reads, provider error states, sender filtering, and UTC traffic dates. Run the production build as well. Live provider reads require an owner session and valid provider credentials.

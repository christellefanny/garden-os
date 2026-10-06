# Garden OS database

Live source of truth: Supabase `public.gardens` and `public.growing_spaces`. Prisma is an earlier design sketch and is not the runtime database client; do not run Prisma migrations against this live project without a separate migration review.

Before using the private preview, follow [Private Garden Setup](PRIVATE_GARDEN_SETUP.md) and apply `supabase/private-gardens.sql`.

`gardens.user_id` references Supabase Auth. RLS restricts all garden/space reads and writes to the owning account. The app uses the publishable key and authenticated session; no service-role key is used. Read/insert/update privileges are sufficient. Spaces archive/restore rather than permanently delete.

`growing_spaces.notes` preserves original text and versioned plant/activity records:

```json
{
  "garden_os": 1,
  "notes": "Original free-text notes",
  "plants": [{ "id": "uuid", "name": "Tomato", "variety": "", "quantity": 2, "spacing": 24, "planted": "2026-05-20", "status": "Growing" }],
  "entries": [{ "id": "uuid", "kind": "Harvest", "date": "2026-08-20", "text": "Picked 2 lb" }],
  "archived": false
}
```

Unsupported or corrupt envelopes block editing and totals rather than overwrite data. Space updates compare `updated_at`, so stale edits cannot silently replace newer data. Export includes the raw database records and archived spaces.

This envelope avoids a schema migration for plants/logs. A future normalization should copy the arrays into tables before removing the envelope; keep IDs and notes intact. Garden sharing requires membership/invitation tables and additional RLS review, not public database grants.

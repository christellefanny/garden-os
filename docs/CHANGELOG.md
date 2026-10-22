# Changes

## Companion planting

- Added sourced companion guidance inside Plant Vault details and each growing-space plant’s expandable details.
- Added advisory pair checks for Growing and Planned records, live add/edit previews, the spacing planner, and linked layout beds. Finished records are ignored; duplicate crop pairs are shown once.
- The planner now carries the chosen crop into the add-plant form along with spacing. Guests receive the same growing-space checks without an account.
- The initial curated guide includes research examples, succession timing, tomato/potato disease risk, basil/rosemary watering differences, and mint containment. Missing guidance is explicitly unknown; no universal compatibility score or unsupported antagonist chart is used.
- Sources are linked beside each explanation. These checks do not change saved data or block planting.
- Validation: 91 unit/database tests, production build, lint (one pre-existing FlowersPage image warning), and the fixture-backed `tests/companion-planting.browser.mjs` flow.

## Private garden foundation and journal design

- Refined the seasonal dashboard with serif headings, consistent line icons, restrained botanical illustrations, calmer surfaces, and no emoji-heavy cards. Kept Garden OS branding, layout, and four seasonal palettes; Fall includes sweet potatoes and no pumpkins.
- Added email/password sign-in, account creation, reset-password flow, and sign-out using Supabase Auth.
- Added garden create/edit/switch, Supabase-backed space create/edit/archive/restore, plant records, watering/harvest/pest/note logs, backup export, estimated capacity, and a working bed/container planner.
- Replaced all fictional dashboard stats and canned strawberry guidance with saved data and explained calculations.
- Seasonal shortcut checklists remember ticks per account/garden/season in browser storage. Theme choices still persist and sync between tabs.
- Added native dialogs with keyboard focus containment/Escape handling, validation, loading/error states, stale edit protection, and honest save feedback.
- Added a transactional ownership/RLS setup script preserving existing gardens. The script is prepared and tested locally; live application awaits the owner’s Supabase setup.

## Validation

- `npm run build`, `npm run lint`, and `npm run test`.
- Eight domain/season/PostgreSQL tests, including two-account ownership, protection against older permissive policies, original-data preservation, idempotent setup, and rollback when owner account is absent.
- `npm run test:browser`: fixture-backed sign-in/out, garden switching, save/read-back/reload for spaces/plants/logs, planner, checklist persistence, archive/restore, failed mutations, stale edits, responsive checks at 320/390/768 px, and axe scans for all seasons.
- Live existing garden reads and garden creation were confirmed. Live growing-space insertion failed with permission denied; live space/plant/log writes are not claimed as passing. One exact temporary test garden could not be deleted with the public key; cleanup instructions are documented.

The crop-aware and growing-bag updates received during development are retained: editable crop spacing presets, rectangular and round estimates, and a manual review/import flow for earlier browser-only spaces. Original browser storage is never deleted. Capacity review starts at 75%; text labels accompany warning colors.

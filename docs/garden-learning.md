# Garden learning destinations

Blooms (formerly the personal Flower Garden destination) opens from a visible entry below the My Gardens overview header, for guests and accounts. It is no longer a separate sidebar child; My Gardens stays highlighted while in Blooms, and a Back to My Gardens button returns to the overview. Its existing `?view=flower-garden` route, saved records, photos, My flowers, Flower Collection and all growing/care/bouquet features remain intact. Stored gardens that users named “Flower Garden” retain their names and counts.

The former Flower Library (`?view=flower-library`) is now Flower Corner, described below. The old URL remains an alias. The original ten sourced profiles are expanded with foliage guides and more detailed growing timelines.

Navigation places Beginner’s Guide immediately after My Gardens and Flower Corner immediately before Tasks, without changing guest Plant Vault restrictions.

Beginner’s Guide (`?view=beginners-guide`) has six guides: space, timing, soil, essentials, planting and care. The optional three-question helper scrolls to the full “Let’s find your starting point” card and offers a reading path; it explicitly does not calculate frost dates from the entered location. Flower care and beginner guide cards open the shared accessible dialog with Close and Escape dismissal and focus restored to the opener. Next-guide navigation keeps the dialog open and focuses its step label. Beginner checklist progress is stored per guest/account in this browser, survives navigation and reload, and is explicitly not cloud-synced. Invalid stored data is preserved and reported, and failed writes never appear as successful checks.

Sources were accessed November 1, 2026: NC State Extension Plant Toolbox (one species/genus source per flower), Maryland, Minnesota, Wisconsin and Iowa State extension services, Illinois Extension annual-flower guidance, and the USDA hardiness-map explainer. Each entry links to its own sources. Copy is an original editorial summary, not a claim of professional horticultural review. Advice is scoped to U.S. outdoor home gardens and distinguishes hardiness from frost and planting conditions. Plant spacing and size are explicitly cultivar dependent rather than invented universal measurements.

No gardens or plants are created, removed or migrated. Existing guest restrictions on Plant Vault remain unchanged. The new learning pages are available to guests and accounts. Production is not updated. The Blooms/navigation refinement is prepared locally; publish only after authorization. The earlier popup, checklist and helper-scroll changes were already verified on their authorized preview deployments. The managed local preview launcher previously failed because it forwards Vite CLI flags to this Next.js checkout.

## Flower Corner (public education)

Flower Corner replaces the Flower Library navigation label, immediately before Tasks. Existing `?view=flower-library` links remain supported. `/flower-corner` opens without an account or guest onboarding; the landing page links to it.

Five sections: **Library**, **When & How to Plant**, **Flower Care**, **Cut Flowers & Bouquets**, and **Seed Saving & Next Season**. The Library combines source-reviewed growing profiles with clearly labeled legacy cutting-flower inspiration, searchable by name and filterable by plant type/sunlight. Profiles use accessible dialogs and distinguish indoor/direct sowing/transplant timing, germination, sow-to-bloom uncertainty, pinching, deadheading and cutback. Existing botanical portraits and bouquet artwork are reused.

The public component accepts no user ID and imports no account stores, private photos or photo-upload controls. Blooms, My flowers, account notes/photos and bouquet ideas remain private and unchanged. Public editorial cut-flower entries are not copied from an account collection.

`tests/flower-corner-ui.test.mjs` checks route/privacy/navigation boundaries. `tests/flower-corner.browser.mjs` covers no-account access, profiles, five sections, desktop/narrow layouts and absence of private data requests; run against a suitable local test server or authorized preview via `FLOWER_CORNER_ORIGIN`.

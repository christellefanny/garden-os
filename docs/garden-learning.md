# Garden learning destinations

Blooms (formerly the personal Flower Garden destination) opens from a visible entry below the My Gardens overview header, for guests and accounts. It is no longer a separate sidebar child; My Gardens stays highlighted while in Blooms, and a Back to My Gardens button returns to the overview. Its existing `?view=flower-garden` route, saved records, photos, My flowers, Flower Collection and all growing/care/bouquet features remain intact. Stored gardens that users named “Flower Garden” retain their names and counts.

The former Flower Library (`?view=flower-library`) is now Flower Corner, described below. The old URL remains an alias. The original ten sourced profiles are expanded with foliage guides and more detailed growing timelines.

Navigation places Beginner’s Guide immediately after My Gardens and Flower Corner immediately before Tasks, without changing guest Plant Vault restrictions.

Beginner’s Guide (`?view=beginners-guide`) has six guides: space, timing, soil, essentials, planting and care. The optional three-question helper scrolls to the full “Let’s find your starting point” card and offers a reading path; it explicitly does not calculate frost dates from the entered location. Flower care and beginner guide cards open the shared accessible dialog with Close and Escape dismissal and focus restored to the opener. Next-guide navigation keeps the dialog open and focuses its step label. Beginner checklist progress is stored per guest/account in this browser, survives navigation and reload, and is explicitly not cloud-synced. Invalid stored data is preserved and reported, and failed writes never appear as successful checks.

Sources were accessed November 1, 2026: NC State Extension Plant Toolbox (one species/genus source per flower), Maryland, Minnesota, Wisconsin and Iowa State extension services, Illinois Extension annual-flower guidance, and the USDA hardiness-map explainer. Each entry links to its own sources. Copy is an original editorial summary, not a claim of professional horticultural review. Advice is scoped to U.S. outdoor home gardens and distinguishes hardiness from frost and planting conditions. Plant spacing and size are explicitly cultivar dependent rather than invented universal measurements.

No gardens or plants are created, removed or migrated. Existing guest restrictions on Plant Vault remain unchanged. The new learning pages are available to guests and accounts. Production is not updated. The Blooms/navigation refinement is prepared locally; publish only after authorization. The earlier popup, checklist and helper-scroll changes were already verified on their authorized preview deployments. The managed local preview launcher previously failed because it forwards Vite CLI flags to this Next.js checkout.

## Flower Corner (public education)

Flower Corner replaces the Flower Library navigation label, immediately before Tasks. Existing `?view=flower-library` links remain supported. `/flower-corner` opens without an account or guest onboarding; the landing page links to it.

Four sections: **Library**, **When & How to Plant**, **Cut Flowers & Bouquets**, and **Seed Saving & Next Season**. Every flower featured across the public cutting, seasonal, seed-saving and former care sections has a complete Library guide. The separate Flower Care tab is removed only after its care, light and flowering-season notes are preserved in the corresponding Library profiles. General care techniques and additional guide information open accessible dialogs on the plant page. The Library is searchable by name and filterable by plant type/sunlight. Profiles use dedicated public guide routes and distinguish indoor/direct sowing/transplant timing, germination, sow-to-bloom uncertainty, pinching, deadheading and cutback. Existing botanical portraits and bouquet artwork are reused.

The public component accepts no user ID and imports no account stores, private photos or photo-upload controls. Blooms, My flowers, account notes/photos and bouquet ideas remain private and unchanged. Public editorial cut-flower entries are not copied from an account collection.

`tests/flower-corner-ui.test.mjs` checks route/privacy/navigation boundaries. `tests/flower-corner.browser.mjs` covers no-account access, plant routes, supplementary dialogs, four sections, desktop/narrow layouts and public editorial boundaries; run against a suitable local test server or authorized preview via `FLOWER_CORNER_ORIGIN`.


## Complete Library consolidation (November 3, 2026)

45 profiles include distinct annual China asters/perennial asters and named cutting series. Every profile includes feeding, common problems, bouquet use and seed saving, in addition to all prior planting and pruning fields. Precise seed schedules are included only where the named species/cultivar and source support them; bulb, division and foliage plants explain their different route. Institutional botanical references are supplemented by clearly identified primary breeder/grower protocols when a specific cutting series needs them. These are editorial summaries, not promises of local flowering dates.

Original illustration assets are reused. Viola uses a clearly disclosed related pansy reference; daffodils have no exact existing watercolor asset and use the existing neutral fallback rather than a mislabeled flower. Private Blooms and the Beginner’s Guide are unchanged.


## Dedicated plant guides and illustration rendering

Each Library picture, plant name and Read link opens `/flower-corner/[plantId]`. Routes work without an account, have plant-specific metadata and handle unknown plants with notFound. The Library retains q/kind/light filters in its URL; return links preserve either the public Library or the workspace entry. Return destinations are internal and allowlisted. Browser Back and refresh remain ordinary page navigation. Main plant facts are never in a modal; care techniques and guide/source explanations remain supplementary dialogs.

Flower Corner uses its own native-source watercolor renderer. Original 1254px four-column sheets contain about313px per portrait; the previous full-width cards enlarged them and image optimization could downsample/recompress the source. The new renderer avoids extra optimization and caps portraits at300 CSS pixels. It preserves the original style but cannot manufacture missing high-density detail. Shared Blooms components/assets are unchanged. Cut Flowers & Bouquets now has one concise introductory guidance note instead of two overlapping notices.


## Tasks while reading

The public Flower Corner layout keeps one floating Add task button across all sections and plant routes. It resolves the current session before enabling edits and uses the existing AddTaskButton and CloudDataBoundary, not another task store. Signed-in tasks retain the existing account sync; guests use browser-local calendar reminders. Only a successful guest Save enables guest workspace return. Opening, typing, cancelling and Escape do not save. The form is deliberately unrestricted: vegetable, flower, garden-wide and non-plant tasks are all supported. Public plant content never includes the private tasks.

## Beginner climate summary

Beginner’s Guide receives the selected garden and starts from its saved location, or offers optional U.S. city/state or ZIP input. It never requests device coordinates, changes the garden’s saved zone, or writes Growing Calendar dates. The existing zone API resolves USDA2023 ZIP-area zone independently from the existing Open-Meteo historical daily-low engine. The panel displays conservative last-spring/first-fall32°F planning dates, actual data years, source links, uncertainty, and seasonal starting priorities without requiring an inventory. Missing or irregular-frost data is explicit; generic calendar defaults are never substituted. A stale climate cache cannot supply a current forecast. Cache keys separate account, garden and saved location. Main helper heading scroll and checklist persistence remain unchanged.

## Illustrated Library refinement

The Library now has55 public profiles, including ten additional foliage/shade plants. Life-cycle metadata distinguishes botanical annual/biennial/perennial behavior from plants commonly grown for one season. Filters combine search, plant kind, life cycle and light; their state stays in the URL. Picture and plant-name links explicitly open separate tabs with safe opener isolation. Redundant read buttons and card labels are removed.

A short outdoor-guidance note lives in the hub hero instead of repeating in every section or plant page. Generic care explanations remain a Library popup, now with three accessible SVG diagrams. Each plant page includes illustrated pinching, deadheading and cutting-back guidance beside the reviewed species text, with special intact-crown, bulb-leaf, basal-stalk and woody-bud cases. These are labeled teaching schematics, not identification pictures or universal cutting schedules. Supplementary guide/source explanations remain a popup.

New individual watercolor originals cover daffodils, distinct China/perennial asters, distinct pansy/viola references, and all ten added shade plants. Original files stay native-resolution. Individual illustrations use responsive quality90 delivery at a300px display size; existing small sprite portraits remain unoptimized to avoid repeating their previous downsampling problem. Private Blooms, saved records, Beginner’s Guide and calendar behavior are not changed by this refinement.

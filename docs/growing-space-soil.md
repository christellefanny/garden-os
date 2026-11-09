# Growing-space soil guidance

The dependency-free `lib/growing-space-soil.ts` provides read-only editorial guidance for growing-space setup. It does not measure a user's soil, prescribe a universal mix, change saved crops, or add a printable/PDF feature.

## Context contract

- `In-ground Bed` uses existing-ground guidance.
- `Container`, `Grow Bag`, and `Growing Bag` use container guidance. Labels are case-insensitive and normalize surrounding and repeated whitespace.
- `Raised Bed` resolves only with an explicit `RaisedBedBase`: `open-soil` uses raised-bed guidance; `closed-base` uses container guidance. Missing or invalid construction remains unresolved. Do not infer a base from a name, height, image, or legacy record.
- Unknown, empty, other, and hydroponic types return `null`. The UI must handle this without defaulting to soil advice.

`soilGuides` supplies the full three-context guide, `soilMaterials` supplies the six optional-material explanations, and `spaceSoilSummary` supplies a short nudge for a resolved context. Keep the raised-bed nudge's clarified wording unchanged.

## Editorial boundaries

Build on existing ground soil. An open-bottom raised bed may need suitable garden soil or topsoil for fill, with finished compost only if needed. Containers and closed-base beds need suitable lightweight potting mix and functioning drainage outlets. Ordinary saucers should not hold standing water; intentional self-watering reservoirs follow their own design instructions.

Materials are explanations, not a shopping list: perlite supports aeration, vermiculite holds moisture, horticultural low-salt hydrated coir is not fertilizer, sand is not a clay fix, and gravel is not a bottom drainage layer. Use soil tests to guide nutrient and pH changes. No fixed mixing ratios are prescribed. Existing crop-specific advice remains separate.

## Sources and checks

All entries include the university-extension sources supplied for this implementation: University of Maryland's organic matter, raised-bed fill and container guides; Iowa State's potting-media guide; University of Florida IFAS's potting-mix guide; and Utah State's clay-soil guide. Source links are stored beside the relevant copy, not inferred dynamically.

Run `node --test tests/growing-space-soil.test.mjs` on a current Node version supporting TypeScript type stripping (Node 22.18+). Tests cover context resolution, aliases and whitespace, ambiguous raised beds, unknown and hydroponic types, exact clarified raised-bed summary, material roles and cautions, complete copy, source URLs, and the absence of fixed mix ratios. URL checks validate shape and source domains, not network reachability.


## Setup integration and preserved data

The optional raised-bed construction field is stored as `SpaceDetails.raisedBedBase` in the existing notes JSON. Existing records are not migrated or guessed. Saving spreads existing details, preserving photos, plants, logs, source IDs and additional metadata. An elevated planter or bed on paving uses container-style guidance. Existing vegetable profiles remain unchanged.

The guide replaces the visible content within the existing setup dialog. The setup form stays mounted and hidden while reading, including its uncontrolled inputs and selected photo files. Back, Close, Escape and backdrop dismissal return to setup, restoring the opener's focus and scroll position. Guide context selection is read-only and cannot alter the saved construction or submit the form. The crop selector reuses the existing 26 vegetable profiles. All optional material and crop details begin collapsed. There is no PDF/download feature or database migration.

## Verification on 2026-11-08

Restored implementation based on main `ae681e1e9faf006ea0576211eab864552c771b5b`. Full unit/SSR suite: 347 passed. TypeScript and production build passed. ESLint: no errors and five pre-existing warnings in untouched files. Independent source review found no actionable defect.

Actual production-build browser QA used an ephemeral Vercel sandbox, localhost-only app server and synthetic account/auth/data/photo fixtures. No production credentials, real account data, public routes or persistent storage were used. The sandbox was stopped after verification. Browser screenshots were inspected at desktop and narrow mobile sizes.

Seven scenarios passed: repeated Back/Close/Escape preserves all draft fields and the selected photo; all three growing contexts, six materials and 26 crops; explicit open-bottom and closed-base saving/reopening with existing metadata preservation; correct SpacePanel/PlantPlanner crop advice; existing types and a new unsaved space; all four seasonal themes; and hydroponic exclusion. Widths 1440, 390 and 320px had no horizontal overflow. WCAG 2 A/AA and 2.1 AA automated scans found no violations in the checked setup/guide states. No page/console errors or unexpected requests were recorded. An initial 4.45:1 contrast failure in the new setup hint was corrected by using the foreground color and the full suite rerun.

Run `tests/growing-space-soil.browser.mjs` against a local production build with dummy Supabase configuration. It rejects non-local targets, intercepts auth/data/API requests, blocks other writes/external requests and does not start the server. `CHROMIUM_PATH` optionally chooses an installed browser. Use a directly launched Next.js process and stop that process after testing. Automated checks do not replace manual assistive-technology testing on real devices.

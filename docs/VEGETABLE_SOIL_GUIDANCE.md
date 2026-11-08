# Vegetable soil and drainage guidance

## Scope

The shared editorial dataset in `lib/vegetable-soil.ts` covers all 26 vegetables in the current plant picker. Each profile contains garden-bed, container and moisture guidance, optional sourced pH, crop-scope notes, source links and a review date.

The same component appears:
- In Plant Vault plant details, after packet notes and before companion planting.
- In the growing-space add/edit plant form, immediately after plant identification.
- In Plant Planner, for a recognized vegetable.
- In the five public beginner vegetable cards, without an account or storage changes.

There are no new required inputs, data migrations, network requests, paid services or planting restrictions. Advice never disables saving. Existing guest and sign-in flows remain intact.

## Interpretation and safeguards

- Crop matching uses reviewed exact names and aliases, with case and whitespace normalization. It does not identify a crop from a partial name or cultivar name alone. Explicit non-vegetable categories suppress vegetable advice.
- Unknown plants explicitly categorized as vegetables receive an honest unavailable message. Unidentified uncategorized plants stay hidden rather than being labeled vegetables.
- A growing space's explicit type selects bed or container advice. Unknown types require a choice. Neither soil notes nor the `soil_type` field are treated as measurements or proof of suitability.
- Raised beds default to bed guidance, with a visible note to use container guidance for closed-bottom planters. Purpose-designed self-watering reservoirs and overflows are distinguished from ordinary saucers.
- Hydroponic spaces receive a separate disclaimer, not garden-soil pH, moisture or potting-mix instructions.
- Native “Learn more” disclosures contain optional pH/testing detail. Preferred ranges are regional growing guidance, not actual readings, strict survival limits or instructions to target an endpoint. Beet, Swiss chard and sweet potato have no numeric pH range in this dataset because the selected sources do not support a sufficiently clear range.
- Container size depends on variety and mature plant size. The sample's tomato minimum is not generalized to every cultivar. No fixed watering calendar, fertilizer recipe, chemical dose or automatic pH amendment is prescribed.
- Corn is explicitly presented as sweet-corn guidance. Bulb onion, heading cabbage, conventional broccoli, garden beans and edible peas have stated scope. Potato and sweet potato, and beet and Swiss chard, are separate profiles.

## State and category behavior

Method selection and optional disclosure state reset when the crop, category, space identity, space type or presentation mode changes. Buttons inside planting forms are explicitly `type="button"`.

`resolvePlantCategory` is shared by the growing-space preview and save path. A custom rename preserves the old explicit category only if the name is unchanged. Otherwise it uses the catalog's category or clears it, avoiding stale Flower/Vegetable labels when a renamed plant is saved and added to the Vault. Existing records are not migrated or silently rewritten.

## Sources

See [crop evidence and source mapping](VEGETABLE_SOIL_SOURCES.md). The profile records contain the public links displayed in the application. Review date: 2026-11-08. This date reflects editorial verification, not the publication date of every source.

## Automated checks

Run `npm test`, `npm run lint`, `npx tsc --noEmit --incremental false`, and `npm run build` with the isolated fixture environment described in the repository README.

New tests cover catalog completeness, source metadata, conservative aliases, category exclusions, crop distinctions, optional ranges, growing methods, server-rendered component semantics, collapsed disclosures, unique IDs, hydroponic/unknown states, guest cards, remount keys, and category rename/serialization/Vault-connection behavior.

Server-rendered tests and source checks are not substitutes for browser interaction or visual checks.

## Browser regression checklist

Use only the isolated fixture or guest data, never production records:
1. Open each catalog vegetable in plant details and confirm all three rows and working source links. Expand and collapse Learn more by keyboard.
2. Add a vegetable to a bed, container and grow bag. Toggle methods and confirm neither toggle submits the form or changes saved fields.
3. Open Learn more, change crop, and switch between two spaces of the same type in Plant Planner. Confirm the default method and closed disclosure reset.
4. Rename a saved Flower record to Tomato without selecting a catalog item, save, reload, and verify the vegetable category and advice. Repeat Tomato to Sunflower and Tomato to an unknown custom plant.
5. Check a hydroponic space: no garden-soil rows or numeric pH range. Check unknown space types, unknown vegetables, herbs and flowers.
6. In guest mode, read all five beginner vegetable cards. Confirm native disclosures, no login requirement, no cloud writes and no nested dialogs.
7. At 320, 375 and 1440 pixels, inspect overflow, keyboard focus, source-link wrapping, accessible names, native dialog Close/Cancel, repeated clicks, and interrupted add/edit flows. Run the existing axe browser checks.

This work does not authorize deployment. The exact completed browser coverage is recorded next; keep this broader checklist for future changes. Chromium viewport testing is not a substitute for Safari, Firefox or physical-device testing.

## Validation recorded for this change

- `npm test`: 332 passed, zero failures.
- `npm run build`: passed with the default Turbopack build after replacing an out-of-worktree dependency symlink with local installed dependencies. Build used isolated fixture values, not production credentials.
- `npx tsc --noEmit --incremental false`: passed; the final production build also completed TypeScript checks.
- `npm run lint`: zero errors and the same five pre-existing warnings in FlowersPage, GardenWorkspace and PhotoJournal.
- Focused changed-file lint and `git diff --check`: passed.
- Independent review found two issues (same-type space state reuse and stale categories after a custom rename); both were fixed and regression-tested.
- Local Chromium initially could not start because socket creation was restricted. After explicit approval, verification ran in a short-lived Vercel sandbox using dummy settings and mocked data. The final build and all 332 automated tests passed there as well.
- Browser verification: 11 scenarios passed, including 156 catalog checks (26 crops × account/guest × 1440/390/320px), 44 accessibility scan configurations, all four seasonal themes, keyboard interaction and focus contrast, add/edit/reload, planner context resets, unknown crops and hydroponics, public cards and nested guide disclosures. No feature accessibility violations, page/console errors or unexpected requests remained. See [the QA report](VEGETABLE_SOIL_BROWSER_QA.md).
- Browser testing found small text in the new cards at 4.45:1 contrast. The card now uses a darker, theme-derived secondary text color, then passed the complete rerun.
- One existing non-feature contrast issue remains in the public guide checklist-storage note (4.48:1 versus 4.5:1). It reproduces with all soil cards hidden; it was not changed by this feature.
- The sandbox was confirmed stopped after 13 minutes 59 seconds. It had no exposed routes, persistence, production credentials or production data. No code was published or deployed.

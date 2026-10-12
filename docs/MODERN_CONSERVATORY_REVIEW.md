# Modern Conservatory review

This redesign follows the supplied Modern Conservatory dashboard: forest sidebar, ivory content, vegetable-focused conservatory photography, compact actual-data statistics, saved-layout preview, recommendations, current plants, journal and botanical cards. All nine sidebar destinations are functional. No mockup counts or weather forecasts are embedded in the application. New accounts start with an empty vault; existing browser entries, original nine-bed layout and custom designs are preserved.

## Garden OS 2.0

- Additive cloud state schema: `supabase/garden-os-state.sql`. User-specific RLS, authenticated API, version-checked writes, local migration backups, persistent offline queue and conflict preservation. **Not applied to the live project yet:** automatic approval review blocked Supabase administration sign-in. Gardens and spaces continue to use their existing authenticated Supabase tables; local vault/layout/calendar data remains usable without the new table.
- Growing-space plants acquire/reuse a vault identity when saved. Vault name/variety edits resolve consistently in growing-space and layout views. Quantities and planting status belong to the growing-space assignment. No unrelated vault records are deleted.
- Daily soil-moisture inspection, harvest-readiness, plant inspection and frost-preparation recommendations use saved Growing plants and the adjustable planning frost date. These are explicitly recommendations, not sensor readings, pest diagnoses or weather warnings.
- Sixteen inspected botanical illustrations include tomato, bell pepper, garlic, okra, lettuce, zinnia, basil, mint and several flowers. Existing species photographs remain available. A mismatched bell-pepper image is no longer used for slender hot-pepper varieties; unsupported images have a clear unavailable state. Representative species art is not claimed to be an exact cultivar portrait. User plant-photo URLs remain supported.
- Journal supports measured harvest quantity, unit, variety, date and notes. Historical comparisons group by season/variety/unit and do not add pounds and ounces together or treat text-only observations as measured yields.

## Validation

`npm run test`: 30 tests, including database owner isolation and conflicting-device updates. `npm run build` uses isolated public Supabase fixture configuration locally; Vercel builds use preview environment configuration. Browser suites verify dashboard/navigation, growing-space/vault identities, harvest persistence, two isolated browser sessions reading the same vault/layout/calendar data, custom layout CRUD, nine original beds, colors, drag/resize, mouse/touch/keyboard controls and responsive widths. Axe checks WCAG 2 A/AA and 2.1 AA.

Screenshots use clearly isolated QA records, not records inserted into the user's live account. The production domain and main branch are unchanged. Deployment is preview-only.

## Activation / remaining verification

Approve Supabase administration access, apply the additive SQL migration, then verify live account synchronization across two devices. The migration contains no destructive change to existing gardens/spaces. First migration retains local copies; differing local/cloud versions stay preserved and require an explicit choice in Settings.

Phone-push delivery retains its existing infrastructure. Vercel daily cron runs only in production; preview visual tests do not claim real phone delivery. No live weather integration is present; the hero card provides clearly labeled seasonal guidance instead of fabricated weather.

## Assets

Built-in image generation produced the vegetable conservatory hero, spring/fall/winter conservatory variations, the botanical plate, and the sidebar botanical ornament. Assets are persisted under `public/conservatory`. Prompts requested real tomato, pepper, lettuce, garlic and okra specimens; restrained complementary flowers; warm natural conservatory light; winter hardy greens and frost; fall sweet potatoes without pumpkins; no UI, text, cartoons or unrelated landscapes.

### Preview-origin data

Browser storage is isolated by origin. The existing production browser data is not deleted or replaced by this preview. A newly opened preview cannot silently read vaults/layouts stored under the production domain. Vault backup import remains available; automatic migration of production-origin browser data runs when the approved release reaches that origin. Live cross-device completion therefore requires the additive schema and an approved migration/release or deliberate import of the original browser data.

# Garden Atelier seasonal implementation

Development branch: `feature/garden-atelier-seasonal-home`. Production is not changed.

## Implementation

- Four distinct commissioned-style watercolor/gouache raster banners replace the four low-detail SVG scenes. Optimized 2048 × 683 WebP banners are 314–359 KiB each.
- Four separate 720px botanical card images represent vegetable, flower, herb, and front-yard gardens. The existing approved botanical logo is retained.
- Cream sidebar and paper surfaces remain neutral while navigation, buttons, search focus, statistics, and interior-page tokens follow spring pink/lavender, summer raspberry, fall terracotta, and winter evergreen.
- Automatic calendar-based selection and stored manual preferences retain the existing SeasonProvider and storage keys.
- Dashboard cards use all owned gardens and their actual nonarchived space counts. Each opens that garden; New Garden opens the existing creation dialog.
- Tasks are chronologically ordered, completion exposes checkbox semantics, and completion notifies existing synchronization listeners.
- A dashboard with no saved layout presents a planning prompt rather than claiming the default template is saved user data.
- Both client and server Supabase initialization accept the publishable key or legacy anonymous key. Publishable takes precedence.

No database migrations, data resets, account changes, sample-data seeding, or production writes are included. Existing garden, vault, layouts, calendar, observations, stories, settings, guest storage, and cloud synchronization implementations remain in place.

## Artwork generation

Created with built-in image generation. Shared brief: sophisticated professional watercolor and gouache on warm ivory cotton paper; realistic botanical forms, subtle pigment grain, natural perspective and soft light; no photography, cartoons, clip art, flat vectors, or text. Banner composition is wide 3:1 with open ivory space on the left and vegetable beds concentrated on the right.

| Asset in `public/conservatory/` | Subject brief |
| --- | --- |
| `atelier-spring.webp` | Tender lettuce, peas on weathered trellis, garlic, young greens; small blush tulips behind beds; fresh green and muted lavender |
| `atelier-summer.webp` | Tomatoes, peppers, okra and leafy vegetables; secondary raspberry dahlias; lush green and blush |
| `atelier-fall.webp` | Kale, peppers, squash and pumpkins beside cedar beds, mulched garlic planting bed; subtle amber foliage; terracotta and olive |
| `atelier-winter.webp` | Dormant snow-dusted cedar beds, frosted kale, mulched garlic, bare trellis and glass cold frame; evergreen and sage |
| `garden-vegetable.webp` | Close vegetable bed with tomatoes, peppers, okra and lettuce |
| `garden-flower.webp` | Raspberry and blush dahlias, ivory lisianthus and low white alyssum |
| `garden-herb.webp` | Basil, mint, oregano, rosemary and thyme in terracotta pots |
| `garden-front.webp` | Curved stone path, purple dianthus, catmint, lamb's ear and hydrangeas |

## Verification

- `npm test`: 65 tests, including three client/server key compatibility cases.
- `npm run lint`: no errors; the pre-existing FlowersPage image optimization warning remains.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed with the legacy anonymous key configuration.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium npm run test:atelier`: runs the actual Next.js development app and isolated local Supabase fixture; checks four distinct loaded paintings and palettes, manual and automatic selection, reload persistence, correct counts across four gardens, direct card navigation, creation dialog, task completion persistence, all ten navigation destinations at 1536/1024/768/390/320px, homepage WCAG A/AA checks in each season, and browser runtime errors.

Screenshots in `docs/previews/atelier/` are real browser captures of this application with isolated QA records. These records are supplied only by the test runner, never by deployed application code. The deployment loads each visitor's own authenticated Supabase data or browser guest data. Production data was not used for automated mutation tests.

Automatic seasons use the existing Northern Hemisphere calendar. Garden image type is inferred from garden names because the existing schema has no garden-type field. No schema change was made for presentation.

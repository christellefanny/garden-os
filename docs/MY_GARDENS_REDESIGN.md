# My Gardens illustrated collection

The collection now uses the existing four watercolor garden assets, selected from each garden name using the same categories as the homepage. These are representative illustrations, not photographs of the user’s garden. Unrecognized names use the vegetable garden illustration.

Garden names, years, locations, zones, space counts, and plant counts come from the existing application data. Archived growing spaces are excluded using the existing summary logic. The change does not seed, migrate, or rewrite any data. Garden creation, editing, details, archived spaces, recovery, plant tools, and journal access remain available.

The new GardenCollection component renders both the collection header/cards and individual garden header. Scoped CSS supplies cream surfaces, seasonal accents, responsive grids, keyboard focus indicators, and reduced-motion handling. Individual gardens gain shortcuts to the existing design and growing calendar views.

## Verification

- 65 unit tests passed.
- TypeScript and production build passed.
- ESLint: no errors; one existing native-image warning in FlowersPage.
- Isolated browser fixture: four distinct decoded garden illustrations and correct per-garden counts; create/edit dialogs; direct garden navigation and refresh; design/calendar shortcuts; no overflow at 1536, 1024, 768, 390, and 320 px; WCAG A/AA checks for all four seasons; no runtime errors.
- Actual desktop and mobile render screenshots visually inspected. Fixture records exist only in the local QA server.

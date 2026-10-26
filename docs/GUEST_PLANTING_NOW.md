# What to Plant Now — guest discovery

## Behavior

Guests see an illustrated, full-width What to Plant Now section in place of In the Garden Now. Three suitable options lead to detailed dialogs, and Browse all opens 13 vegetable, herb, and flower guides with category filters. Signed-in users retain their existing personal growing-plants section. No sample records are created and no account, garden, calendar, plant-vault, journal, or layout data is rewritten.

## Location and privacy

The browser requests geolocation only after the visitor presses Use my current location. If geolocation permission was already granted, the guest section can locate automatically. A five-digit U.S. ZIP code is always available as a fallback. Coordinates are rounded to two decimals on the server, used only to find a ZIP area via Esri postal reverse geocoding, and omitted from the returned and saved profile. A ZIP-area profile is stored in garden-atelier-guest-planting-location-v1 in browser storage. There is a forget-location control. Location is not written to Supabase or substituted for an actual saved garden location.

The location endpoint is public because guest access is intentional. Input is bounded and validated, and outbound requests use fixed allowlisted HTTPS services with timeouts and rejected redirects. An unknown ZIP, unsupported country, incomplete climate data, or upstream failure does not produce a made-up zone. Failed replacement lookups preserve the previous profile.

## Data sources and timing

- USDA ARS 2023 ZIP zone table: https://services1.arcgis.com/SyUSN23vOoYdfLC8/arcgis/rest/services/PHZM_2023_Zip_Code_Table/FeatureServer/296 . USDA ARS owns the ArcGIS item, which describes this as the table powering the PHZM interactive lookup. ZIP-area zones are not exact-address zones.
- Open-Meteo geocoding / GeoNames: U.S. result must match the entered postal code, so an overseas town with the same numeric code is not selected.
- Open-Meteo historical daily minima/maxima: the previous 15 complete calendar years. At least 10 sufficiently complete years are required. Later spring frost and earlier autumn frost estimates use 80th and 20th percentiles, respectively, of 32°F daily air-frost dates. If frost is not regular enough, no annual frost date is invented; seasonal temperature patterns are used.
- Open-Meteo near-term forecast provides an additional frost / extreme-heat check when available.
- Growing guidance links to University of Minnesota, University of Illinois, and NC State Extension sources in each plant record. The dates are our climate-based planning estimates, not an official Extension calendar or a guaranteed harvest.

Recommendations use the actual local calendar date, independent of the manually selected visual season. They consider normal temperatures, frost timing, maturity from seed versus transplant, and a 14-day planning allowance. Garlic is explicitly for next summer. Indoors, wait, tight window, and good window are separate outcomes. A short remaining season does not become a good outdoor window merely because a plant tolerates frost. Climate, local frost pockets, soil temperatures, variety, day length, and unusual weather still require judgment. The UI explains these limits and links primary growing guides.

## Current coverage

U.S. ZIP areas only; a curated set of 13 plants. This is a conservative planning guide, not an exhaustive local planting calendar. No global hardiness conversion is guessed. A ZIP-region weather grid and historical air frost cannot resolve yard-scale microclimates or frozen soil. Guests can change or clear their ZIP area. The saved profile refreshes after 24 hours when the section is revisited; a provider outage retains existing data and exposes a retry message.

## Original illustrations

Created with the built-in image-generation tool. Final assets: public/planting-now/{garlic,lettuce,spinach,radish,kale,peas,tomato,pepper,beans,basil,zinnia,alyssum,pansy}.webp. Two consistent specimen plates were generated, visually reviewed, and cropped into distinct raster assets; no SVG substitutes or retrieved photos.

Common prompt: Professional botanical watercolor specimen plate for a premium garden journal. Landscape 2:1, ideally 3072 × 1536. Exactly eight square cells in a 4-column × 2-row grid, no borders or labels. Isolated specimens fully inside each cell with ivory-paper margins. Refined watercolor/gouache, realistic plant forms, subtle pigments, natural light and delicate shadows. No photography, cartoons, vectors, text or pots. Crop cells into independent 640 × 640 WebP assets.

Plate A subjects: Top row left to right: 1 Garlic with intact bulb, separate clove and green leaves. 2 Leaf lettuce with tender loose green leaves. 3 Spinach with distinct smooth dark green pointed leaves. 4 Red round radishes with white tips and fresh leaves. Bottom row left to right: 5 Curly kale leaves. 6 Pea vine with open pod and round peas. 7 Tomato plant sprig with red tomatoes. 8 Pepper plant sprig with red and green peppers.

Plate B subjects: Top row left to right: 1 Bush snap beans with slender green bean pods and trifoliate leaves. 2 Basil with glossy oval green leaves. 3 Raspberry pink zinnia flowers and leaves. 4 Sweet alyssum with small white flower clusters and fine leaves. Bottom row left to right: 5 Purple and cream pansies with realistic flowers and leaves. 6 Orange calendula blossoms. 7 Pink snapdragon stems. 8 Golden French marigolds.

## Validation

- 74 unit tests passed, including nine new planting tests with cold/warm climates, maturity budgets, missed windows, frost warnings, winter/indoor cases, geographic rejection, historical-data validation, and asset coverage.
- ESLint: no errors; one pre-existing FlowersPage native-image warning.
- TypeScript and production build passed. Local isolated worktree uses next build --webpack because its node_modules link points to the original checkout; Vercel builds the normal repository with its standard command.
- Browser: guest/no-location state, 13 decoded distinct illustrations, details and too-late explanations, denied/granted geolocation, ZIP fallback, local persistence, failure recovery, visual themes independent of planting dates, all five widths from 320 to 1536, accessibility, account dashboard preservation, invalid API input, and no fake saved records.
- Actual running desktop and phone pages and dialogs visually reviewed. QA screenshots and location fixtures are isolated test data.
- Real upstream lookup for Plainfield 60544 was exercised separately, including USDA zone, historical climate, and forecast retrieval.


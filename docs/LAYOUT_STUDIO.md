# Garden Atelier visual layout studio

Plan & Design offers three illustrated starting points: a four-bed vegetable garden, a compact courtyard with two beds and five containers, and a four-bed cutting garden. Guests can browse all three from the homepage. Starting from scratch opens a name dialog and then an empty canvas. Choosing a template opens a name dialog and creates an independent editable copy only after submission. New visitors do not land on the old nine-bed plan.

Saved custom layouts retain their existing keys, IDs, links, colors and geometry. Existing saved nine-bed layouts (or growing spaces explicitly linked to those beds) remain accessible in the legacy view. Opening a legacy plan no longer rewrites its stored layout as a side effect. No production database schema changes or seeded records are involved.

## Editing

- Move and resize beds, containers, paths and borders with existing pointer or coordinate controls.
- Selecting a shape reveals Rotate 90° and Delete directly on the canvas. Rotation swaps width and height around the center, clamped to the canvas edges.
- Deleting a shape or plant illustration offers Undo until the next edit. Deleting a shape never deletes its linked growing space or real plant records.
- The collapsible illustration library contains 13 vegetables and six flowers. Select a bed, container or border, then add a decorative plant. Drag each illustration within its parent shape or move it with arrow keys. Delete individual illustrations on the canvas. Illustrations travel with their parent shape.
- Garden View shows watercolor specimens; Plan View keeps a simpler view while retaining all decorations. Illustrations are not plant records or capacity calculations.
- Create growing spaces remains an explicit action for a real garden. It imports only beds and containers, without decorative plants or invented measurements. Planning without a garden keeps this action disabled.

## Data

The existing `garden-os-custom-layouts-v1-{userId}-{gardenId}` data structure gains optional per-item `decorations` arrays containing ID, illustration ID, and relative x/y. Old layouts without this field remain valid. The existing account-scoped synchronization prefix covers decorations too. Template copies receive fresh layout/item/decoration IDs and empty growing-space links. Merely browsing inspiration creates no garden/layout/plant records.

## Artwork

`public/layout-inspiration/courtyard-open-entry.webp` and `public/layout-inspiration/cutting.webp`: original watercolor concepts generated using the built-in image tool as two square panels, cropped and compressed for the app. Prompt: refined botanical watercolor/gouache overhead garden concepts on warm ivory paper; two cedar vegetable beds with central gravel path and six terracotta pots; separate four-bed cutting garden with dahlias, lisianthus, cosmos and snapdragons around cross paths; botanical realism, quiet margins, soft shadows; no labels, photographs, cartoons or vector stand-ins.

`{carrot,cucumber,broccoli}.webp`: generated as three isolated growing specimens on ivory paper, then cropped to individual assets. Prompt: realistic fine-art watercolor/gouache carrot foliage and orange roots, cucumber foliage/tendrils and fruit, broccoli leaves and head; no labels, pots or photographic substitutes. Okra is cropped from the application's existing approved botanical plate. Other vegetable and flower portraits reuse existing approved illustrated assets. The approved four-bed image remains unchanged.

## Verification

`tests/layout-design.test.mjs` checks independent template copies, no real plant records, in-bounds geometry and quarter-turn rotation, decoration validation and all 19 real assets. `tests/layout-studio.browser.mjs` checks guest homepage/gallery, three editable templates, blank creation, on-canvas rotation/deletion/undo, illustrated planting via pointer and keyboard, responsive widths, accessibility, persistence and existing member plans using isolated fixtures. The guest planting browser test covers continued planting advice behavior and the new blank-start entry point. Screenshots are captured under `docs/previews/layout-studio/`.

Concept images and editable arrangements are approximate, not surveyed or measured plans. Rotation supports quarter turns; the decorative plant library is intentionally limited. Local-only guests still need an account to sync across devices.

## Open courtyard entrance

The front-center pot was removed from the original two-panel source using a precise built-in image edit. Matching pale gravel now extends the central walkway through the front opening. The other five pots, two vegetable beds, and cutting-garden illustration are retained. The courtyard asset is now `public/layout-inspiration/courtyard-open-entry.webp`. New editable courtyard copies omit the front-center container and extend the path to the front canvas edge. Previously saved plans are not migrated or modified.

## Quiet canvas labels and selection

Shape names are small tooltips on hover or keyboard focus; touch users see the name after selecting a shape. Labels sit outside the shape and never consume a border planting area. The on-canvas action toolbar opens only after an explicit shape selection and dismisses when clicking elsewhere. Clicking empty canvas or pressing Escape clears selection. Clicking plant-picker controls dismisses the toolbar while keeping the target bed selected for planting.

## Readable border planting and ground materials

Plant marks are square, at least 44 px and up to 112 px, with a preferred size based on the canvas rather than a thin shape's short dimension. They may overhang a border naturally; visible centers are clamped inside the overall canvas. Existing stored plant placements remain unchanged unless explicitly edited or rotated. Rotating a planted shape also turns its illustration positions to follow the new orientation. New plants added to long borders start along the long axis. Garden View and saved homepage previews use the same size rules.

Ground between beds offers Plain ground, Bark mulch, Gravel & pebbles, and Stepping stones. Select a path to choose its own finish under Path ground cover. Both choices persist in the existing account-synced layout as optional `groundCover` values; old layouts default to plain and need no migration. Plan View keeps its simple grid while retaining material choices for Garden View. These are visual design materials, not claims of weed prevention.

Three original generated watercolor-style material swatches are stored as `public/layout-inspiration/ground-{mulch,gravel,stone}.webp`. Built-in image prompt: three overhead full-surface hand-painted natural material swatches on a three-panel sheet—warm shredded bark mulch, pale limestone gravel/pebbles, and warm-gray natural stone paving—with soft diffuse light, subdued natural colors, no plants, labels, objects, photos, cartoons or vector shapes. Panels were cropped and compressed into 384 px WebP tiles.

### Bounded watercolor ground materials
Ground cover now occupies the closed rectangular extent inferred from beds, containers, and border hints, including gardens with an open entrance or missing border. Paths do not enlarge this extent when growing shapes exist; paths can retain their own finish. Empty plans have no filled ground area. The editor and saved preview use the same geometry without changing stored records.

New original watercolor textures: `public/layout-inspiration/ground-mulch-watercolor.webp`, `ground-gravel-watercolor.webp`, and `ground-stone-watercolor.webp`. Generated together using the approved courtyard illustration as a painting-style reference: muted bark brush strokes, delicate ivory pebble dabs, and sage-gray painted paving stones. Replaced the former photographic-looking texture assets.

### Halo-free garden illustrations
The editor and saved-layout preview now blend vegetable paper into the soil with multiply compositing instead of a normal-blend override that revealed a pale vignette. Plant buttons have no background, border, or shadow. Six dedicated flower cutouts use real alpha transparency and normal compositing, preserving white petals and flower colors over green borders. The existing encyclopedia illustrations remain unchanged. Saved plant identities, positions, and garden data need no migration.

Assets: `public/layout-inspiration/{dahlia,zinnia,cosmos,snapdragon,lisianthus,alyssum}-transparent.webp`. Created with the built-in ImageGen editing tool from the corresponding existing cut-flower illustration; resized to 512px WebP with its generated alpha preserved.

Prompt used separately for each source flower: “Use case: background-extraction. Edit target: the attached watercolor botanical flower illustration. Remove ONLY the cream paper background completely, including all gaps between leaves, petals and stems. Produce a true transparent alpha background and clean natural edges with absolutely NO white halo, cream glow, vignette, cast shadow, paper rectangle, or feathered white outline. Preserve the exact flower species, petal colors including white petals, leaves, stems, hand-painted watercolor pigment texture, pose, proportions, and composition. Keep the entire plant fully visible and centered within a square canvas. This is an illustrated plant cutout for placement directly on garden soil and green borders; retain the original painted details and colors. No text.”

### Delete a saved design
Saved custom layouts have a Delete layout action beside Rename layout. A named confirmation distinguishes deleting the design from deleting actual growing spaces or plant data. Cancel preserves everything. Confirm stores the remaining array (including an empty array for the last layout, so existing metadata synchronization carries the deletion) and returns to the inspiration gallery. A failed storage write leaves the design and confirmation available for retry. Other layouts and the original saved nine-bed plan remain unchanged. Browser coverage checks cancel, targeted deletion, reload, final-layout deletion, and legacy preservation.

# Bouquet watercolor artwork

Replaces the flat SVG bouquet scenes and recipe icons in Flower Garden → Cut Flowers → Bouquet Inspiration. Existing layout, recipes, plant data and interactions are retained.

Nine separate images were created with built-in image generation and optimized to WebP in `public/bouquets/`.

Shared generation brief: professional botanical watercolor and gouache on warm ivory cotton paper, realistic flower anatomy and fine painted petals, natural pigment grain, soft daylight, elegant adult garden-journal aesthetic matching the seasonal banners. No text, cartoon, clip art, flat vectors or photographs.

Bouquets use 4:3 landscape compositions with a complete arrangement in an ivory ceramic vase:
- `bouquet-garden.webp`: raspberry/blush dahlias, apricot zinnias, pink cosmos, lavender snapdragon spikes and airy yarrow/ammi foliage.
- `bouquet-pastel.webp`: blush dahlias, pale pink cosmos, lavender snapdragons and ivory lace fillers.
- `bouquet-bright.webp`: coral/apricot zinnias, golden rudbeckia, raspberry dahlias and greenery.
- `bouquet-romantic.webp`: mauve/burgundy dahlias, ivory lisianthus, pink cosmos and lavender statice.

Recipe portraits use square specimen compositions:
- `recipe-dahlia.webp`: detailed raspberry pink dahlia, short stem and leaves.
- `recipe-zinnia.webp`: apricot/coral zinnia, layered petals, yellow disk florets and leaves.
- `recipe-cosmos.webp`: blush cosmos, golden center, slender stem and divided leaves.
- `recipe-snapdragon.webp`: lavender tubular flower spike and narrow leaves.
- `recipe-foliage.webp`: sage-green foliage, yarrow leaves and white ammi umbel.

Next.js Image serves the artwork responsively. `tests/bouquet-art.browser.mjs` checks all nine painted files decode in the actual application, confirms the SVG substitutes are gone, and checks desktop, tablet and mobile overflow and runtime errors against isolated local test data.

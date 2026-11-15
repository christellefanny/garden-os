# Species-specific watercolor care rollout

## First reviewed batch

Only explicit species + technique pairs can render care art. All existing plant instructions stay unchanged. Never route images via `careVisualMode`.

- Zinnias / deadheading: layered double zinnia, papery spent petals, intact opposite leaves/buds below indicated cut. Method: https://seedsavers.org/grow-zinnia/ . Revised approved sample to make flower visibly spent; built-in image generator, transparent watercolor.
- Tulips / cutting back: intact broad leaves after flowering, no shears or prescribed cutting height. Method: https://yardandgarden.extension.iastate.edu/faq/when-can-i-remove-tulip-foliage . Generated in approved watercolor style.
- Hosta / deadheading: two attempts rejected, not shipped. Snips ambiguously overlapped healthy foliage. Keep text-only.

Images are illustrative examples, not cultivar-identification references. Species morphology, instructional meaning and retained growth reviewed visually; no claim of independent botanical certification.

## Scope: 55 profiles, 165 care cards

Not 165 cutting pictures: 42 profiles are not pinching candidates. Initial target is one useful verified scene per suitable species, leaving other techniques text-only.

Next first-batch candidates (not yet ready): dahlias/pinching, hosta/deadheading, heuchera/cutback, coleus/deadheading, daffodils/deadheading, catmint/cutback, alyssum/cutback. Verify node/crown/foliage and cultivar exceptions before release.

Second batch (25 distinct deadheading scenes): cosmos, marigolds, snapdragons, calendula, lisianthus, rudbeckia, strawflower, gomphrena, celosia, amaranth, nigella, scabiosa, ammi-majus, bupleurum, orlaya, bells-of-ireland, larkspur, bachelors-buttons, sweet-peas, nasturtium, chantilly-snapdragons, rudbeckia-sahara, pansies, violas, china-asters. Spikes, umbels, pods and individual flower heads need separate treatment. Preserve handling warnings.

Third batch (13 perennial/crown scenes): yarrow/deadheading, astrantia/cutback, feverfew/deadheading, ranunculus/deadheading, dianthus/deadheading, japanese-anemone/deadheading, astilbe/cutback, brunnera/deadheading, pulmonaria/deadheading, bergenia/deadheading, ligularia/deadheading, tiarella/deadheading, hellebores/cutback.

Eight profiles remain text-only initially: sunflowers (branching vs single stem), statice (basal rosette), perennial-asters (timing), hydrangeas (old/new wood), ornamental-alliums (optional dry heads), japanese-painted-fern and autumn-fern (no deadheading), bleeding-heart (natural dormancy).

## Generation/review rules

Built-in image generation only; approved zinnia watercolor sample as style reference, transparent background, no photography. Source method first. Inspect actual pixels. Reject misleading cut geometry; captions cannot rescue a visually incorrect cut. Unreviewed combinations do not receive a fallback picture. Never generalize one species' art to another.

## Verification

353 unit tests passed; focused lint and TypeScript passed. Webpack build compiled and typechecked; full prerender locally blocked by missing Supabase URL. Default Turbopack build also cannot use the shared node_modules symlink in this executor. Headless browser launch blocked by executor socket restrictions. Deployment checks recorded separately before publication is described as verified.

## Second reviewed batch

Six additional species-specific assets: coleus/deadheading (optional flowering-spike removal, not a spent bloom), daffodils/deadheading (before/after retaining green stalk and leaves), heuchera/cutback (identify one dead outer leaf; preserve crown), marigolds/deadheading (French marigold example, spent head vs bud), cosmos/deadheading (spent head vs bud and threadlike foliage), calendula/deadheading (fresh flower, spent seed-forming center head and opening bud).

All six generated with built-in imagegen using approved watercolor style; transparent cutouts; reviewed morphology and instructional meaning. Sources linked beside each image in species-care-art.ts. Cosmos foliage was corrected before acceptance. Dahlia pinching was attempted twice and rejected: first stub too long, then marker below the blades. Remains text-only, as does hosta.

Coverage after this batch: 8 of 55 profiles have one reviewed care image, 47 remain text-only. No implication that all 165 cards require pictures. Existing species text remains unchanged. New non-cutting scenes explicitly illustrate identification/retention rather than falsely precise cutting geometry.

## Third prepared batch (local, not released)

Seven additional species-specific mappings: rudbeckia/deadheading, rudbeckia-sahara/deadheading, sweet-peas/deadheading, pansies/deadheading, violas/deadheading, nasturtium/deadheading, catmint/cutback. Six are newly generated flower-stage identification aids with no cut markers. Pansy and horned viola art is distinct; Sahara is explicitly one variable semi-double example. Sweet pea image does not reliably depict pods and is not labeled as doing so. Nasturtium was revised to separate bud from leaf, then remove background haze. Horned viola was revised to correct foliage/background. Catmint restores the original trim illustration ONLY for catmint, following two visual reviews and RHS guidance; no generic-mode routing.

Sources are linked in each mapping. This batch requires release approval and live rendering checks. If released after batch two, coverage becomes 15/55 profiles with one care illustration; 40 remain text-only. Dahlia and hosta cutting diagrams still withheld. PR #53 (batch two) was released after fresh owner approval and successful CI. All six production care images loaded correctly in browser verification. Production commit: 4706db6f8164e72e965a1c2ca145f9d99e44bac3.

## Fourth prepared batch (local, not released)

Five independently generated and visually reviewed flower-stage scenes: snapdragons, Chantilly snapdragons (distinct open-faced corollas), scabiosa (S. atropurpurea), dianthus (explicit garden-pink example, not every hybrid), feverfew. No cut markers. Snapdragon captions retain the tip buds until the spike finishes; feverfew retains the existing non-ingestion warning in profile text. Authoritative method sources are linked in the mapping. Chantilly morphology additionally checked against https://www.johnnyseeds.com/flowers/snapdragon/chantilly-cream-yellow-f1-snapdragon-seed-1981.html .

Yarrow withheld after three drafts: initially coarse foliage, then persistent background haze. No rejected yarrow asset is mapped. Cumulative prepared coverage would be 20/55; actual live coverage remains 8/55 until later batches are separately approved and verified. PR #54 (seven additional assets) passed CI but is still a draft awaiting release approval.

## Fifth prepared batch

Six new species-only flower-stage/cleanup scenes: ranunculus (double cultivated form), Japanese anemone (optional deadheading), lisianthus (single-flowered example), annual bachelor's buttons, plain-green brunnera, spotted pulmonaria. Generated separately, reviewed by two agents for morphology and stage distinction; no scissors or cut marks. Healthy crown foliage retained in brunnera and pulmonaria. Existing profile warnings and care text unchanged. Sources appear with each image. Initial lisianthus and pulmonaria background haze was corrected before acceptance. Cumulative reviewed mappings: 26/55; publication status tracked separately.

Owner subsequently approved publishing remaining reviewed care illustrations in batches, while withholding inaccurate ones. PR #54 is merged at 49d6cf095dd076f213bc2ee8cefaf9bddde78991, production READY, seven live care images loaded correctly.

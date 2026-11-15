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

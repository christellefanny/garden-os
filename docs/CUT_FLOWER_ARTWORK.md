# Cut Flower Encyclopedia artwork

All 30 encyclopedia entries use individual representative watercolor portraits in `public/cut-flowers/`, served responsively through Next.js Image. Existing plant collections and encyclopedia text are retained. Colors and varieties may differ from the representative artwork.

Generated with built-in image generation. Shared prompt: square professional botanical watercolor and gouache; realistic species-specific anatomy and fine painted detail; delicate pigment washes on warm ivory cotton paper, soft natural light, centered specimen with breathing room; no vase, text, labels, border, cartoon, flat vectors, clip art or photographs.

Four matching paintings from the bouquet recipe are reused at 640px: `dahlias.webp`, `zinnias.webp`, `cosmos.webp`, and `snapdragons.webp`.

The 26 additional generation subjects are:

- `lisianthus.webp`: Lisianthus / Eustoma: one graceful branching stem with two ivory rose-like ruffled flowers, a blush-edged bloom, elongated pointed buds and opposite smooth blue-green leaves.
- `statice.webp`: Statice / Limonium sinuatum: airy branching cut stems bearing dense small papery lavender-purple flower clusters and tiny pale centers, characteristic winged stems and sparse narrow leaves.
- `sweet-alyssum.webp`: Sweet alyssum / Lobularia maritima: a small low spray with many tiny WHITE four-petaled flowers in rounded clusters, slender stems and narrow gray-green lanceolate leaves. Delicate tiny clustered flowers, not large daisies.
- `strawflower.webp`: Strawflower / Xerochrysum bracteatum: three golden peach and rose papery flowers at different stages with concentric stiff pointed bracts around golden centers, slender upright stems and narrow lance-shaped leaves.
- `calendula.webp`: Calendula officinalis: two clear warm orange pot-marigold flowers with many narrow ray petals and distinct golden disk centers, a bud, softly hairy green stems and simple oblong leaves. Not a ruffled Tagetes marigold.
- `rudbeckia.webp`: Rudbeckia hirta / black-eyed Susan: three golden yellow daisy-like flowers with prominent dark brown raised cone centers, gently drooping long ray petals, sturdy stems and rough lance-shaped green leaves.
- `gomphrena.webp`: Gomphrena globosa: a graceful small group of magenta and blush spherical papery clover-like flower heads on long slender stems, each sphere with tiny light floret points, opposite oval leaves.
- `celosia.webp`: Celosia plumosa: three refined upright feather-like plumes in muted raspberry and coral, dense textured tiny florets tapering to points, simple pointed green leaves. Clearly a natural flower stem, not a feather object.
- `amaranth.webp`: Amaranthus caudatus / love-lies-bleeding: an elegant cut branch with long drooping burgundy tassels of tiny densely clustered flowers, smooth branching stems and broad ovate green leaves.
- `nigella.webp`: Nigella damascena / love-in-a-mist: two delicate pale blue star-like flowers with layered pointed petaloid sepals, finely divided feathery green bracts and foliage, distinctive round striped inflated seed pod with fine horns.
- `yarrow.webp`: Achillea millefolium / yarrow: two broad flattened corymb clusters of tiny ivory and soft dusty blush flowers, finely divided feathery fern-like foliage, slender sturdy branching stems.
- `scabiosa.webp`: Scabiosa / pincushion flower: a mauve lavender open bloom with ruffled outer petals and raised dome of tiny florets and delicate projecting stamens, a blush flower in side view, slender long stems and a bud.
- `ammi-majus.webp`: Ammi majus / bishop's flower: two airy white lace umbels with many tiny white flowers on radiating green stalks, fine branched stems and delicately divided green foliage. Natural light umbrella form.
- `chantilly-snapdragons.webp`: Chantilly snapdragons, the OPEN-FACED butterfly-flowered Antirrhinum type: a tall loose spike of pale peach, ivory and blush flowers with open flat flaring faces, visible pale yellow throats, buds at tip and narrow leaves. Important: these have open butterfly faces, unlike closed-mouthed conventional snapdragons.
- `bupleurum.webp`: Bupleurum rotundifolium: an airy branching sprig of chartreuse yellow-green tiny flower umbels surrounded by rounded leafy green bracts, distinctive rounded blue-green leaves clasping the stems. Foliage filler, no large colorful petals.
- `astrantia.webp`: Astrantia major: three delicate dusty pink starry flowers, pointed papery pink-green bracts in a radial star around a raised pale pincushion cluster of tiny flowers, thin branching stems and palmate lobed leaves.
- `asters.webp`: Cut-flower asters: three lavender, dusty rose and soft pink daisy-like flowers with many fine narrow ray petals and small golden yellow centers on branching stems, pointed narrow green leaves. Natural garden asters.
- `feverfew.webp`: Tanacetum parthenium / feverfew: loose branching spray of many tiny white daisies with yellow button centers, five to twenty short white ray petals, bright soft green deeply lobed leaves.
- `larkspur.webp`: Consolida / annual larkspur: graceful tall blue-lavender flower spike, small irregular spurred flowers with delicate petals, a few buds at tip, slender stem and finely dissected threadlike green leaves. Show one flower side-on so the spur is visible.
- `orlaya.webp`: Orlaya grandiflora / white lace flower: two open flat white lace umbels, each with fine small center flowers and DISTINCTIVE large showy outer white petals radiating around the rim, ferny divided green leaves and thin stems. Show rim petals clearly, unlike plain Ammi.
- `bachelors-buttons.webp`: Centaurea cyanus / bachelor's buttons / cornflower: three true cornflower-blue blooms with jagged fringed outer florets and purplish tufted centers, narrow gray-green leaves, branching slender stems and a scaled flower bud.
- `bells-of-ireland.webp`: Moluccella laevis / Bells of Ireland: two elegant tall upright green stems with whorls of large rounded cup-shaped pale apple-green bell calyces encircling the stalk, tiny ivory flowers inside some cups, a few rounded scalloped leaves. Clearly green cup-like bells.
- `sweet-peas.webp`: Lathyrus odoratus / ornamental sweet peas: a delicate climbing stem with blush pink, lavender and ivory butterfly-shaped pea flowers on long slender peduncles, paired oval leaves and fine curling tendrils. Flowers only, no edible pea pods.
- `rudbeckia-sahara.webp`: Rudbeckia hirta 'Sahara' flower mix: three naturally varied blooms in muted copper, terracotta, antique rose and pale caramel, rounded soft layered ray petals around raised velvety chocolate-brown centers, rough green leaves and stems. Clearly distinct from bright golden black-eyed Susan; no generic yellow-only flowers.
- `hydrangeas.webp`: Hydrangea paniculata cut branch: one elegant airy conical panicle of creamy ivory four-sepal florets with a soft blush tint at base, one small secondary panicle, woody branch and opposite large serrated ovate green leaves. Realistic panicle shape, not a round rose bouquet.
- `ranunculus.webp`: Ranunculus asiaticus / Persian buttercup: an exquisite peach-pink flower with many densely layered concentric silky curved petals in a rounded rosette, a small ivory bloom and round bud on slender curved stems, deeply lobed green leaves.

Verification: `tests/cut-flower-art.browser.mjs` opens the actual Flower Garden → Cut Flowers page with an isolated local database, checks that 30 distinct portraits decode, confirms all 30 entries remain with no missing-art placeholders, and checks desktop/tablet/mobile overflow and runtime errors.


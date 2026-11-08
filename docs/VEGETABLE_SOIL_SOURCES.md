# Vegetable soil guidance: source evidence

Reviewed 2026-11-08. These mappings explain the public horticultural sources used by the shared profiles. Implementation names and aliases are defined in `lib/vegetable-soil.ts`.


## Leaf, root and brassica crops


## Implementation and interpretation
- Twelve profiles, with 39–45 words in each bed/container/moisture field.
- Match a normalized, complete picker name or exact alias, not a substring. Lowercase and trim/collapse whitespace before matching. Current labels “Leaf lettuce” and “Spring radish” are included as exact normalized aliases.
- These are general recommendations, not measurements, diagnoses or predictions for the user's soil. No soil readings were available.
- Soil pH ranges are the cited garden-soil guidance, not hydroponic nutrient-solution targets. A range must not imply that the user's soil was tested or that the upper endpoint is a target.
- Use soil-test/local advice before pH amendments. Avoid automatic lime/sulfur recommendations or fixed fertilizer recipes.
- Container guidance is a horticultural synthesis applied to each crop's verified needs. No exact minimum pot size is asserted. Container volume, filled depth, cultivar and intended harvest size matter.
- The copy describes conventional freely draining pots. Purpose-designed self-watering pots may use a separate reservoir and overflow; do not equate their normal reservoir with stagnant water in an ordinary saucer.
- Regional planting dates and watering amounts were not converted into a universal calendar or fixed irrigation schedule.
- No chemical deficiency diagnosis or treatment is inferred from symptoms.

## Crop-specific evidence
These summaries identify the supporting crop-specific sections.

### Lettuce
[UMN: Growing lettuce, endive and radicchio](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-lettuce-endive-and-radicchio)
“Before planting,” “Soil testing and fertilizer,” “Direct seeding,” and “Watering” support seedbed, shallow roots, moisture and pH 6.0–6.8. Only lettuce names are matched.

### Garlic
[UMN: Growing garlic](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-garlic)
“Preparing the soil” and “Watering” support soil preparation, drainage, pH 6.0–7.0 and the preharvest watering change. “Choosing garlic varieties” distinguishes elephant garlic.

### Onion
[UMN: Growing onions](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-onions)
“Soil testing and fertilizer,” “Watering” and “Long-day and short-day onions” support the bulb-onion recommendations and pH 6.0–7.0. Scallions, green/bunching onions, shallots and leeks are excluded.

### Broccoli
[UMN: Growing broccoli](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-broccoli)
“Soil pH and fertility” and “Watering” support fertile, moisture-retentive drainage, pH 6.0–7.0 and head-quality consequences of drought. Conventional heading broccoli only.

### Carrot
[UMN: Growing carrots and parsnips](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-carrots-and-parsnips)
“Soil pH and fertility,” “Starting seeds,” “Watering” and “Disorders” support the carrot copy and pH 6.0–7.0. Direct sowing into a final container differs from transplanting starts.

### Beet
[USU: How to Grow Beets](https://extension.usu.edu/yardandgarden/research/beets-in-the-garden)
“Soils,” “Planting and Spacing,” “Water” and “Weeds” support root-bed preparation, thinning and moisture. No crop-specific numeric pH range is stated there, so ph is null.

### Radish
[UMN: Growing radishes](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-radishes)
“Garden radishes and daikons,” “Soil testing and fertilizer,” “Direct seeding,” “Watering” and “Disorders” support depth distinctions, pH 6.0–7.0 and stress cautions. Spring salad radish differs from long daikon.

### Spinach
[UMN: Growing spinach and Swiss chard](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-spinach-and-swiss-chard)
“Soil pH and fertility,” “Day length,” and “Watering” support the spinach guidance. Source pH 6.5–8.0 is retained with a warning against automatically targeting its upper limit.

### Kale
[UMN: Growing collards and kale](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-collards-and-kale)
“Preparing the soil,” “Transplanting” and “Watering” support texture tolerance, baby/full-size spacing, pH 6.0–7.5 and stress effects. Collards are excluded from the aliases.

### Cabbage
[UMN: Growing cabbage](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-cabbage)
“Preparing the soil” and “Watering” support drainage, steady nutrition/moisture and pH 6.0–7.0. Heading cabbage is the scope; Napa and bok choy are not silently included.

### Cauliflower
[UMN: Growing cauliflower](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-cauliflower)
“Soil pH and fertility,” “Watering” and “Blanching” support the soil guidance, pH 6.0–7.0 and white/colored/Romanesco distinction. No head-shading task is prescribed in this soil profile.

### Swiss Chard
[USU: How to Grow Swiss Chard](https://extension.usu.edu/yardandgarden/research/swiss-chard-in-the-garden)
“Soil,” “Water” and “Weeds” support drainage, organic matter, moisture stability and gentle cultivation.
[UMN: Spinach and Swiss chard](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-spinach-and-swiss-chard) distinguishes chard from enlarged-root beets. Its chard pH statement has no clear complete range; ph is null rather than inventing an upper bound.

## Shared container support
- [NC State: Plants Grown in Containers](https://content.ces.ncsu.edu/extension-gardener-handbook/18-plants-grown-in-containers). Main support for lettuce, garlic, onion and broccoli: drainage holes, no gravel drainage layer, and balanced media.
- [Illinois: Growing Vegetables in Containers](https://extension.illinois.edu/container-gardens/growing-vegetables-containers). Root-crop/spinach cultivation, planting and thinning. Exact size suggestions are not used.
- [Illinois: Soil](https://extension.illinois.edu/container-gardens/soil). Garden soil alone compacts in pots and restricts drainage/aeration.
- [Illinois: Vegetable Containers](https://extension.illinois.edu/container-gardens/vegetable-containers). Rooting depth and individual plant space needs govern container dimensions and density.
- [Maryland: Growing Vegetables in Containers and Salad Tables](https://extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables). Mature size, airy media, drainage, moisture monitoring and saucer management.

## Alias guardrails
- Never add shared botanical species such as Beta vulgaris or Brassica oleracea as aliases; each includes distinct crop profiles.
- Do not match “beet” inside “silverbeet,” “spinach” inside “Malabar spinach,” or “cabbage” inside “Chinese cabbage.”
- Conservative aliases are intentional. Unknown cultivar-only names should remain unmatched until explicitly mapped.



## Fruiting crops, legumes and storage crops

Reviewed 2026-11-08. 

This is general horticultural guidance, not a measurement or diagnosis of the user's soil. No fertilizer recipe, amendment dose, watering quota, planting depth, or universal pot-size minimum is included. The three main text fields are each 30–50 words. A pH range describes the cited source's garden-soil recommendation, not a strict survival limit or a direction to change pH automatically.

## Matching and scope

- Use exact normalized names/aliases, never substring matching. In particular, `Potato` must not match `Sweet Potato`.
- Current beginner-card names are explicitly included: `Slicing tomato`, `Sweet bell pepper`, `Bush snap bean`.
- Four separate pepper records preserve all picker names. General pepper advice is deliberately shared, with Habanero's pH drawn from a crop-specific Rutgers source. Both [UConn's Peppers](https://homegarden.cahnr.uconn.edu/factsheets/peppers/) and [Iowa State's pepper guide](https://yardandgarden.extension.iastate.edu/how-to/growing-peppers-home-garden) explicitly identify bell/serrano as *Capsicum annuum* and habanero/Scotch bonnet as *C. chinense*. No novel variety-specific drainage or pot-size claim is made.
- `Corn` is explicitly interpreted as sweet corn. The record does not claim validation for popcorn, field corn, or ornamental maize.
- `Bean` primarily covers common garden snap/green beans. Bush and pole habits are distinguished; unrelated bean crops are excluded from automatic matching. `Pea` covers edible *Pisum sativum*, not cowpeas or ornamental sweet peas.

## Shared container evidence

These sources support reusable container practice, not cultivar-specific experimental results:

- [Maryland: Types of Containers for Growing Vegetables](https://extension.umd.edu/resource/types-containers-growing-vegetables), “Container drainage”: escape for excess water, saucer emptying, and no gravel layer. Conventional pots are assumed; a correctly designed self-watering planter uses its overflow system rather than ordinary bottom drainage.
- [Maryland: Growing Media for Containers](https://extension.umd.edu/resource/growing-media-potting-soil-containers), “Garden soil” and “Commercial soilless mixes”: use light, aerated container media rather than dense unamended garden soil.
- [Maryland: Growing Vegetables in Containers and Salad Tables](https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables), “Container types and sizes,” “Crops for containers,” and “Plant care”: size for mature growth, stability, support, and the greater challenge of corn and storage-root/tuber crops. Choosing beds as the easier corn option is a practical synthesis of this source and pollination requirements.
- [Minnesota: Fertilizing and watering container plants](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/fertilizing-and-watering-container-plants), “Maintain even moisture” and “Watch out for soggy soil”: inspect frequently, prevent prolonged drying, and avoid waterlogged saucers. Its fertilizer directions are not reproduced.

## Crop claim mapping

### Tomato

[Iowa State: Growing Tomatoes in the Home Garden](https://yardandgarden.extension.iastate.edu/how-to/growing-tomatoes-home-garden), “Ideal Growing Conditions,” “Water,” and “Mulch,” supports bed, moisture, and pH 6.0–6.8. [Growing Tomatoes in Containers](https://yardandgarden.extension.iastate.edu/how-to/growing-tomatoes-containers), “Growing Media,” “Suggested Cultivars,” and “Care,” supports container guidance. Source pot sizes are not generalized across all tomato varieties.

### Bell Pepper, Habanero Pepper, Scotch Bonnet Pepper, Serrano Pepper

[UConn: Peppers](https://homegarden.cahnr.uconn.edu/factsheets/peppers/), “Soil Requirements,” supports the general profile and pH 6.0–6.8 used for Bell Pepper and Scotch Bonnet. [Michigan State: How to grow peppers](https://www.canr.msu.edu/uploads/files/peppers.pdf), first page, supports Serrano's general pepper pH range, moderate fertility, and the flowering-stage moisture warning. [Iowa State's pepper guide](https://yardandgarden.extension.iastate.edu/how-to/growing-peppers-home-garden), “Location” and “Watering,” supports shared drainage and moisture wording.

[Rutgers: Production and Marketing of Habañero Peppers](https://extension.rutgers.edu/fs1273), “Soil and Fertilizer Requirements” and “Establishment,” supports Habanero's bed advice and preferred pH 6.0–7.0. The broad tolerated range in that guide is deliberately not presented as a target. Its commercial amendment and fertilizer quantities are omitted. The shared container paragraph is supported by the Maryland container sources above.

### Okra

[Utah State: Okra in the Garden](https://extension.usu.edu/yardandgarden/research/okra-in-the-garden), “Cultivars,” “Site Selection,” and “Plant Care,” supports variety-size variation, bed/moisture advice, and pH 6.0–7.0. Container structure and support use Maryland's general guidance.

### Sweet Potato

[Maryland: Growing Sweet Potatoes](https://extension.umd.edu/resource/growing-sweet-potatoes-home-garden), “Planting” and “Watering,” supports bed, establishment, and saturation cautions. [Utah State: Sweet Potatoes](https://extension.usu.edu/yardandgarden/research/sweet-potatoes-in-the-garden), “Recommended Varieties,” “Soil,” and “Water,” supports compact options and late overwatering caution. Neither selected guide supplies a numeric pH target, so `ph` is null. Storage roots are not potato tubers; “yam” is intentionally not an automatic alias.

### Cucumber

[Minnesota: Growing cucumbers](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-cucumbers), “Soil pH and fertility” and “Watering,” supports bed/moisture/pH 6.0–6.5. The introduction and planting section distinguish bush and vining forms. Container mix and drainage use the shared sources.

### Zucchini

[Minnesota: Growing summer squash and zucchini](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-summer-squash-and-zucchini), “Soil pH and fertility” and “Watering,” supports pH 6.0–6.5 and explicitly notes successful growth in some more alkaline soils. [University of Saskatchewan: Zucchini](https://gardening.usask.ca/gardening-advice/gardenline-nested-pages/food-plant-pages/vegetables/zucchini.php), “Growing in containers,” supports compact outdoor-container selection. Its exact pot minimum and regional dark-container recommendation are not generalized.

### Bean

[Minnesota: Growing beans](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-beans), “Soil testing and fertilizer,” “Watering,” and growth-habit sections, supports pH 6.0–7.0 and bush/pole distinctions. [Purdue: Growing Beans](https://ag.purdue.edu/department/hla/extension/extension-publications-library/ext-pubs/ho-175-w.html), “Site Selection,” “Watering,” and “Bean Types,” supports crumbly soil, pod/moisture caution, and species-scope caveats.

### Pea

[Minnesota: Growing peas](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-peas), soil and watering sections, supports pH 6.0–7.5 and cool-season watering judgment. [Iowa State: Growing Peas](https://yardandgarden.extension.iastate.edu/how-to/growing-peas-iowa), “Site Selection,” directly supports compact peas in large containers with potting soil and a trellis.

### Eggplant

[Minnesota: Growing eggplant](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-eggplant), soil and watering sections, supports its stated pH 5.5–7.5 and moisture/quality guidance. [Utah State: Eggplant](https://extension.usu.edu/yardandgarden/research/eggplant-in-the-garden/), “Soil” and “Water,” supports drainage, warmth, and root-rot caution. Regional pH advice is not uniform; that limitation is visible in the record.

### Corn

[Minnesota: Growing sweet corn](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-sweet-corn), soil and watering sections, supports pH 5.8–7.0. [Maryland: Growing Sweet Corn](https://extension.umd.edu/resource/growing-sweet-corn-home-garden), planting and pollination sections, supports grouped planting. [Minnesota: Irrigation strategies](https://extension.umn.edu/agriculture/specialty-crops/vegetable-farming/irrigation-strategies-for-vegetables), “Critical growth period” table, supports the named moisture-sensitive stages.

### Potato

[Maryland: Growing Potatoes](https://extension.umd.edu/resource/growing-potatoes-home-garden), “Growing and care,” supports general pH 6.0–6.5, tuber coverage, watering, and the potato-tower caution. [Wisconsin: Potato Scab](https://hort.extension.wisc.edu/articles/potato-scab/), prevention section, supports avoiding automatic liming and fresh manure. Maryland and Wisconsin differ in how they frame scab-related acidity and mixed-bed tradeoffs; the entry therefore calls for local advice instead of prescribing a lower pH universally.

## Verification notes

The selected evidence is from universities and Extension services. Regional calendar dates, chemical-control instructions, and commercial production doses were excluded. The source review date reflects this review, not a claim that every publication was newly issued on that date.

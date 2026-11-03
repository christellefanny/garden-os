/** Beginner shortlist. University Extension sources checked 2026-11-03.
 * Pairings are practical design suggestions, not guaranteed pest control.
 */
export type BeginnerPlantSource = { label: string; url: string };
export type BeginnerPlant = {
  id: string;
  name: string;
  kind: 'vegetable' | 'flower';
  season: string;
  light: string;
  why: string;
  start: string;
  timing: string;
  spacing: string;
  care: string;
  container: string;
  timeToReward: string;
  companions: string;
  caution: string;
  sources: BeginnerPlantSource[];
  guideSlug?: string;
};
const source = (label: string, url: string): BeginnerPlantSource => ({ label, url });
const containerSource = source('Wisconsin Extension: vegetables in containers', 'https://hort.extension.wisc.edu/articles/growing-vegetables-containers/');
const spacingSource = source('Penn State Extension: annual flower spacing', 'https://extension.psu.edu/sowing-annual-seeds');

export const BEGINNER_PLANTS: BeginnerPlant[] = [
  {
    id: 'leaf-lettuce', name: 'Leaf lettuce', kind: 'vegetable', season: 'Cool season',
    light: 'Sun to part sun; about 3–5 hours of direct sun can work.',
    why: 'Pick a few leaves at a time without waiting for a full head.',
    start: 'Direct sow into the bed or container; thin seedlings gently.',
    timing: 'Sow in workable spring soil or for a locally timed autumn crop. Light frost is tolerated; heat encourages bolting.',
    spacing: 'About 5 in / 13 cm for baby-leaf picking; 10–12 in / 25–30 cm for full-size plants.',
    care: 'Keep the shallow root zone evenly moist. Harvest regularly; sow small batches for a longer supply.',
    container: 'A broad container around 2 gallons or larger works well. Give lettuce and radishes 6–8 in / 15–20 cm of potting-mix depth.',
    timeToReward: 'Typically 40–60 days from sowing for leaf lettuce; baby leaves can be picked earlier when usable.',
    companions: 'Pair with radishes in cool weather. Early lettuce can finish before a later tomato fills the bed.',
    caution: 'Bitter leaves and a rising flower stalk usually mean the plant is finishing. Do not crowd mature plants to fit more in.',
    sources: [source('Minnesota Extension: lettuce', 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-lettuce-endive-and-radicchio'), source('Minnesota Extension: crop maturity', 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/planting-vegetables-in-midsummer-for-fall-harvest'), source('Maryland Extension: container sunlight', 'https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables'), source('NC State Extension: container depth', 'https://content.ces.ncsu.edu/extension-gardener-handbook/18-plants-grown-in-containers'), containerSource],
  },
  {
    id: 'spring-radish', name: 'Spring radish', kind: 'vegetable', season: 'Cool season',
    light: 'A sunny spot; aim for at least 5–6 hours of direct sun.',
    why: 'A quick seed-to-harvest crop that makes thinning and watering easy to learn.',
    start: 'Direct sow small, round garden radishes about ¼–½ in / 0.5–1 cm deep.',
    timing: 'Grow in cool spring or autumn conditions. Avoid sowing into peak summer heat.',
    spacing: 'Thin to about 2 in / 5 cm between roots. Crowded plants may make leaves without useful roots.',
    care: 'Keep moisture steady and soil loose. Pull promptly once roots reach the size on the packet.',
    container: 'Choose a broad pot around 2 gallons or larger, with 6–8 in / 15–20 cm of mix for short-rooted types; long daikon needs more depth.',
    timeToReward: 'Small garden radishes often take 3–5 weeks from sowing. Winter radishes and daikon take longer.',
    companions: 'Share a cool-season bed with lettuce, giving each crop its full spacing; remove radishes before neighboring plants crowd them.',
    caution: 'Heat, drought and delayed harvest can make roots woody or very hot. Uneven watering can split them.',
    sources: [source('Minnesota Extension: radishes', 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-radishes'), source('NC State Extension: sunlight in small spaces', 'https://content.ces.ncsu.edu/mini-gardening'), containerSource],
  },
  {
    id: 'bush-snap-bean', name: 'Bush snap bean', kind: 'vegetable', season: 'Warm season',
    light: 'Full sun, at least 6 hours.',
    why: 'A direct-sown crop with no tall trellis to build.',
    start: 'Sow directly about 1 in / 2.5 cm deep; choose a bush snap variety rather than a pole or dry bean.',
    timing: 'Wait until frost risk has passed and soil is above about 60°F / 16°C. Cold, wet soil can rot seed.',
    spacing: 'About 2–3 in / 5–8 cm apart in rows 18–24 in / 45–60 cm apart; follow the cultivar packet.',
    care: 'Water consistently, especially at flowering. Avoid excessive fertilizer and pick pods regularly.',
    container: 'Use a container of at least 5 gallons, roughly 12–18 in / 30–45 cm deep, with enough width for the recommended spacing.',
    timeToReward: 'Often 50–60 days from sowing. Pick tender pods before the seeds bulge; bush harvests are relatively concentrated.',
    companions: 'Place low flowers such as marigolds nearby without crowding the beans. Match sun and drainage, and leave picking access.',
    caution: 'Beans are frost-tender. Do not assume living bean plants fertilize neighboring vegetables during the same season.',
    sources: [source('Utah State Extension: beans', 'https://extension.usu.edu/yardandgarden/research/beans-in-the-garden'), source('Minnesota Extension: bean growth habits', 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-beans'), containerSource],
  },
  {
    id: 'compact-cherry-tomato', name: 'Compact cherry tomato', kind: 'vegetable', season: 'Warm season',
    light: 'Full sun, ideally 6–8 hours or more.',
    why: 'One compact plant offers frequent small harvests without a full tomato patch.',
    start: 'Buy a healthy transplant for the simplest start. Choose a dwarf or patio cherry type, such as Terenzo, and add support at planting.',
    timing: 'Harden off gradually; plant outside after frost danger has passed and soil has warmed.',
    spacing: 'One plant per pot. In a bed, follow the cultivar’s mature spread and keep air moving between plants.',
    care: 'Keep moisture even, water the mix rather than leaves, and feed according to the potting mix and fertilizer label. Check pots daily in hot weather.',
    container: 'A 5-gallon or larger pot is a forgiving starting point; larger plants need more room. Use drainage holes and container potting mix.',
    timeToReward: 'Many cherry tomatoes begin about 50–70 days after transplanting, not after sowing. Check the cultivar label; weather changes the timing. Pick at its ripe color.',
    companions: 'Early lettuce may finish before the tomato canopy expands. Keep flowers in a neighboring pot if sharing would crowd the roots.',
    caution: 'Cherry describes fruit size, not plant size. Some cherry tomatoes become large vines. Uneven watering can cause cracking or blossom-end rot.',
    sources: [source('Iowa State Extension: container tomatoes', 'https://yardandgarden.extension.iastate.edu/how-to/growing-tomatoes-containers'), source('Minnesota Extension: tomatoes', 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-tomatoes'), source('Minnesota Extension: transplant-to-harvest timing', 'https://extension.umn.edu/vegetable-growing-guides-farmers/crop-and-field-planning-tools-vegetable-farmers'), containerSource],
  },
  {
    id: 'french-marigold', guideSlug: 'marigolds', name: 'French marigold', kind: 'flower', season: 'Warm season',
    light: 'Full sun is a good default; tolerates some partial shade.',
    why: 'Compact, colorful plants suit the front of a bed or a small flower container.',
    start: 'Buy young plants or direct sow Tagetes patula about ¼ in / 0.5 cm deep.',
    timing: 'Sow or transplant outdoors after frost danger has passed. Harden off plants raised under cover.',
    spacing: 'Small French types may suit 6–8 in / 15–20 cm spacing; use the label for wider cultivars.',
    care: 'Use well-drained soil, water during establishment and remove faded blooms to encourage more flowers.',
    container: 'A compact variety works in a drained pot. Allow its labeled mature width rather than packing several tightly together.',
    timeToReward: 'Allow roughly 6–8 weeks from sowing as a planning estimate; cultivar, light and temperature can change this. Check the seed packet for first bloom. Flowering transplants give quicker color.',
    companions: 'Use near beans or tomatoes for color and flower visitors, while preserving crop spacing. Choose accessible, less-double blooms for insects.',
    caution: 'Not a universal pest repellent. Nematode effects depend on marigold variety, pest and planting method. Treat these as ornamental flowers, not an eating recommendation.',
    sources: [source('NC State Extension: French marigold', 'https://plants.ces.ncsu.edu/plants/tagetes-patula/'), source('Iowa State Extension: marigold planting', 'https://yardandgarden.extension.iastate.edu/faq/when-can-i-plant-marigolds-outdoors'), source('University of Vermont: French marigold production timing', 'https://www.uvm.edu/~entlab/Greenhouse%20IPM/Workshops/2020/DIY%20Guardian%20Plants%20Instructions%20UVM.pdf'), spacingSource],
  },
  {
    id: 'bush-nasturtium', guideSlug: 'nasturtium', name: 'Bush nasturtium', kind: 'flower', season: 'Frost-free season',
    light: 'Full sun; some afternoon shade can help in hot summers.',
    why: 'Large seeds, round leaves and bright flowers make an easy first sowing project.',
    start: 'Direct sow about ½ in / 1 cm deep. Pick a compact bush variety, such as Empress of India, rather than a long trailing type.',
    timing: 'Sow outdoors after frost danger has passed. Nasturtiums dislike root disturbance.',
    spacing: 'About 10–12 in / 25–30 cm apart; give trailing selections additional room.',
    care: 'Use well-drained soil and water regularly for flowering. Avoid rich feeding, which can favor leaves over blooms; remove faded flowers.',
    container: 'Compact selections suit containers. Give trailing stems room to spill without smothering nearby plants.',
    timeToReward: 'Check the seed packet for days from sowing to first bloom for your variety; timing varies with growing conditions. Once flowering, plants can continue through summer toward frost.',
    companions: 'Place at the edge of a vegetable bed or in a nearby pot. Watch for aphids rather than assuming it will protect its neighbors.',
    caution: 'Some nasturtium flowers and leaves are edible, but identify the species and edible part first and grow specifically for food without unsuitable chemical treatments. Never infer that all garden flowers are edible.',
    sources: [source('Wisconsin Extension: nasturtiums', 'https://hort.extension.wisc.edu/articles/nasturtium-tropaeolum-majus/'), source('NC State Extension: garden nasturtium', 'https://plants.ces.ncsu.edu/plants/tropaeolum-majus/'), source('Illinois Extension: edible flower safety', 'https://extension.illinois.edu/blogs/over-garden-fence/2025-05-29-spice-garden-edible-flowers')],
  },
  {
    id: 'sweet-alyssum', guideSlug: 'alyssum', name: 'Sweet alyssum', kind: 'flower', season: 'Best in mild weather',
    light: 'Sun to partial shade; afternoon shade helps in hot places.',
    why: 'A low, fragrant edging flower that leaves taller crops easy to reach.',
    start: 'Sow Lobularia maritima or buy young plants. Follow packet instructions for its tiny seed.',
    timing: 'In suitable climates, sow several weeks before the last spring frost or set out hardened plants near that date. Check local guidance for autumn sowing.',
    spacing: 'Often 8–10 in / 20–25 cm apart; vigorous cultivars need more space.',
    care: 'Drainage is essential. Water as needed and trim back tired growth when flowering fades.',
    container: 'Good at a container edge, with enough room for its spreading habit and neighbors with similar watering needs.',
    timeToReward: 'Often 6–8 weeks from sowing to first flowers; check the packet for your cultivar. Blooms can continue toward frost, with a pause during summer heat.',
    companions: 'Try a small patch near lettuce or other vegetables as insect habitat, keeping the crop uncrowded. Benefits vary by crop, pest and conditions.',
    caution: 'Not a guarantee against aphids. Can self-sow; check local suitability and remove unwanted seedlings. This profile recommends it as an ornamental, not food.',
    sources: [source('NC State Extension: sweet alyssum', 'https://plants.ces.ncsu.edu/plants/lobularia-maritima/'), source('Wisconsin Extension: alyssum seed-to-flower timing', 'https://hort.extension.wisc.edu/articles/sweet-alyssum-lobularia-maritima/'), spacingSource],
  },
  {
    id: 'compact-zinnia', guideSlug: 'zinnias', name: 'Compact zinnia', kind: 'flower', season: 'Warm season',
    light: 'Full sun, at least 6 hours.',
    why: 'Bright summer flowers for viewing, picking and visiting pollinators.',
    start: 'Direct sow after frost, or plant young transplants. Choose a compact, disease-resistant variety for a small space.',
    timing: 'Plant outside after the last frost. Warm conditions and good airflow make a better start than cold, damp soil.',
    spacing: 'Follow the cultivar label: small types can use 6–12 in / 15–30 cm, while larger selections need more room.',
    care: 'Use well-drained soil and water at the base. Remove spent blooms on standard types; some series, including Profusion, need no deadheading.',
    container: 'Compact types work in drained containers. Allow their mature spread and avoid crowding with tall vegetables.',
    timeToReward: 'Allow about 8–12 weeks from sowing for flowers, though some cultivars bloom sooner in warm conditions. Check the packet. Plants can keep flowering through summer into autumn.',
    companions: 'Plant beside a sunny vegetable patch for flower visitors, not as a promised pest shield. Favor open flower forms when supporting insects is the goal.',
    caution: 'Shade and crowded, damp foliage increase disease risk. Choose resistant types for humid climates; this profile does not recommend eating the flowers.',
    sources: [source('NC State Extension: zinnias', 'https://plants.ces.ncsu.edu/plants/zinnia-elegans/'), source('Virginia Cooperative Extension: seed-to-flower timing', 'https://www.vabeginningfarmer.alce.vt.edu/content/vabeginningfarmer_alce_vt_edu/en/TasteofFarming/TOFSeason2/Floriculture/_jcr_content/content/download/file.res/Field%20to%20Vase.pdf'), spacingSource],
  },
];
export const beginnerPlants = BEGINNER_PLANTS;
export const BEGINNER_COMPANION_NOTE = 'Start with shared sunlight, compatible watering and enough room for mature plants. Pair cool-season lettuce and radishes, then let a later tomato take over the space. Flowers can provide food and habitat for helpful insects, but a companion is not a pest-control guarantee. Evidence for particular pairings depends on the crop, pest and conditions. Keep checking leaves and use proven controls when needed.';
export const BEGINNER_COMPANION_SOURCES: BeginnerPlantSource[] = [
  source('Minnesota Extension: evidence for companion planting', 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/companion-planting-in-home-gardens'),
  source('Oklahoma State Extension: limits of marigold pest control', 'https://extension.okstate.edu/fact-sheets/earth-kind-gardening-series-cultural-control-practices'),
  source('Illinois Extension: pollinator garden tips', 'https://extension.illinois.edu/sites/default/files/pollinator_garden_tips.pdf'),
];
export const BEGINNER_PLANTING_NOTE = 'These are starting points, not a planting calendar for every climate. Use your local frost dates, soil conditions and the seed packet or plant label. Harvest estimates vary with cultivar and weather; tomato estimates start at transplanting. Containers need drainage holes, potting mix and regular moisture checks. Choose only two or three plants to begin.';

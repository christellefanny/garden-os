/** Beginner shortlist. University Extension sources checked 2026-11-03.
 * Pairings are practical design suggestions, not guaranteed pest control.
 */
export type BeginnerPlantSource = { label: string; url: string };
export type BeginnerPlant = {
  id: string;
  name: string;
  kind: 'vegetable' | 'herb' | 'flower';
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
    id: 'slicing-tomato', name: 'Slicing tomato', kind: 'vegetable', season: 'Warm season',
    light: 'Full sun, ideally 6–8 hours or more.',
    why: 'Grow full-size tomatoes for sandwiches and salads, starting with just one well-supported plant.',
    start: 'Buy a healthy transplant labeled as a slicing tomato. A bush (determinate) variety, such as Bush Early Girl, is a manageable first choice. Install a sturdy cage at planting.',
    timing: 'Harden off gradually; plant outside after frost danger has passed and soil has warmed.',
    spacing: 'For a bush type, allow 24–30 in / 60–75 cm between plants and about 4 ft / 1.2 m between rows. Follow the cultivar label; larger vining types need different spacing and support.',
    care: 'Keep moisture even and water the soil rather than leaves. Feed according to the soil test or container fertilizer label. Check pots daily in hot weather and secure the cage against tipping.',
    container: 'Grow one plant per pot. For a more forgiving start, choose 10 gallons or larger with drainage holes and container potting mix; a full-size plant dries a small pot quickly.',
    timeToReward: 'Typically 65–90 days after transplanting, not after sowing; early varieties may be quicker. Check the cultivar label and allow for weather. Pick at its ripe color, or let fruit that has begun coloring finish indoors.',
    companions: 'Early lettuce may finish before the tomato canopy expands. Keep basil and flowers in neighboring pots if sharing would crowd the roots or block light.',
    caution: 'Bush types tend to give a more concentrated harvest; vining types keep growing and need taller support. Uneven watering can cause cracking or blossom-end rot. Choose a variety suited to your season.',
    sources: [source('Maryland Extension: tomatoes and transplant-to-harvest timing', 'https://www.extension.umd.edu/resource/growing-tomatoes-home-garden'), source('Iowa State Extension: container tomatoes and slicing varieties', 'https://yardandgarden.extension.iastate.edu/how-to/growing-tomatoes-containers'), source('Iowa State Extension: tomato spacing', 'https://yardandgarden.extension.iastate.edu/faq/what-proper-spacing-when-planting-tomatoes-garden'), source('Maryland Extension: container size and care', 'https://www.extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables')],
  },
  {
    id: 'sweet-bell-pepper', name: 'Sweet bell pepper', kind: 'vegetable', season: 'Warm season',
    light: 'Full sun, at least 6 hours; 8 or more is better.',
    why: 'One sweet pepper plant gives a manageable introduction to growing fruiting vegetables.',
    start: 'Buy a healthy transplant labeled sweet bell pepper. For seeds, start indoors about 8–10 weeks before your frost-free date; check the cultivar packet.',
    timing: 'Harden off, then transplant after frost risk has passed and soil is at least about 65°F / 18°C.',
    spacing: 'Allow 12–24 in / 30–60 cm between plants, following the label. A small cage or stake supports brittle branches.',
    care: 'Keep moisture even without waterlogging. Follow soil-test or container-feed directions; too much fertilizer is not a shortcut to fruit.',
    container: 'One plant in a drained pot of at least 5 gallons, filled with container potting mix.',
    timeToReward: 'Sweet peppers often need 70–90 days after transplanting. Pick firm, full-size fruit green or wait longer for its ripe color; snip rather than pull.',
    companions: 'Keep basil or marigolds in nearby pots for a sunny kitchen-garden grouping, with room around each plant. This is not a pest-control guarantee.',
    caution: 'Cold slows growth; very hot weather can interrupt fruit set. Choose a variety that fits your season. Sweet and hot peppers planted nearby do not make this season’s sweet fruit hot.',
    sources: [source('Maryland Extension: growing peppers', 'https://extension.umd.edu/resource/growing-peppers-home-garden'), source('Iowa State Extension: harvest timing from transplants', 'https://yardandgarden.extension.iastate.edu/how-to/vegetable-harvest-guide'), containerSource],
  },
  {
    id: 'sweet-basil', name: 'Sweet basil', kind: 'herb', season: 'Warm season',
    light: 'Full sun, with good air circulation.',
    why: 'A small culinary herb for frequent leaf picking close to the kitchen.',
    start: 'Buy a young sweet basil plant (Ocimum basilicum), or sow seeds about ⅛ in / 3 mm deep. Indoor starts need roughly 4–6 weeks before transplanting.',
    timing: 'Sow or set out hardened plants after frost, once conditions are warm. Seeds commonly sprout in 10–14 days in warm soil.',
    spacing: 'Thin to around 12 in / 30 cm apart for common sweet basil; check the variety’s mature spread.',
    care: 'Keep mix evenly moist, not soggy. Harvest shoots above a leaf pair to encourage branching, leaving healthy leaves. Feed container plants according to the product label.',
    container: 'Grow one plant in its own drained pot with container mix and room for the labeled mature size. Check moisture often; small pots dry quickly.',
    timeToReward: 'Begin light harvests once an established plant has 6–8 healthy leaves. Readiness depends on the size of a purchased start or on seedling growth, not one fixed countdown.',
    companions: 'Place near tomatoes or peppers where it will still get light and space. Separate pots make watering easier; do not count on basil to repel pests or improve tomato flavor.',
    caution: 'Frost and cold damage basil. Crowding and wet foliage favor disease. Harvest regularly before flowering for a leafy crop, and inspect yellowing or spotted leaves.',
    sources: [source('Utah State Extension: sweet basil, sowing and harvesting', 'https://extension.usu.edu/yardandgarden/research/basil-in-the-garden')],
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
export const BEGINNER_PLANTING_NOTE = 'These are starting points, not a planting calendar for every climate. Use your local frost dates, soil conditions and the seed packet or plant label. Harvest estimates vary with cultivar and weather; tomato and pepper estimates start at transplanting. Containers need drainage holes, potting mix and regular moisture checks. Choose only two or three plants to begin.';

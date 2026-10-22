// Curated guidance: missing relationships are unknown, never proof of compatibility.
export const companionSources = {
  umn: { name: "University of Minnesota Extension", url: "https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/companion-planting-in-home-gardens" },
  illinois: { name: "Illinois Extension", url: "https://extension.illinois.edu/blogs/good-growing/2025-03-07-companion-planting-combining-plants-healthy-well-balanced-garden" },
  blight: { name: "UMN Extension: late blight", url: "https://extension.umn.edu/agriculture/specialty-crops/vegetable-farming/disease-management/late-blight" },
  mint: { name: "Illinois Extension: mint", url: "https://extension.illinois.edu/blogs/ilriverhort/2017-05-26-mintsfriend-or-foe" },
  rosemary: { name: "Illinois Extension: rosemary", url: "https://extension.illinois.edu/herbs/rosemary" },
  basil: { name: "UC IPM: basil", url: "https://ipm.ucanr.edu/home-and-landscape/cultural-tips-for-growing-basil/" },
  beneficial: { name: "Illinois Extension: beneficial insects", url: "https://extension.illinois.edu/insects/beneficial-bugs" },
  flowers: { name: "Illinois Extension: flowers in vegetable gardens", url: "https://extension.illinois.edu/blogs/good-growing/2026-04-03-flowers-vegetable-garden" },
  nematodes: { name: "UF/IFAS: marigolds and nematodes", url: "https://ask.ifas.ufl.edu/publication/NG045" },
  sisters: { name: "Native Seeds/SEARCH: Three Sisters", url: "https://www.nativeseeds.org/blogs/blog-news/how-to-grow-a-three-sisters-garden" },
} as const;
type Source = keyof typeof companionSources;
const profiles = [
  ["sweet-potato", "Sweet potato", "sweet potatoes|sweet potato"],
  ["tomato", "Tomato", "tomatoes|tomato"],
  ["potato", "Potato", "potatoes|potato"],
  ["pepper", "Pepper", "peppers|pepper|habaneros|habanero|scotch bonnet|serrano|hungarian hot wax"],
  ["lettuce", "Lettuce", "lettuces|lettuce"],
  ["spinach", "Spinach", "spinach"],
  ["carrot", "Carrot", "carrots|carrot"],
  ["radish", "Radish", "radishes|radish"],
  ["brussels", "Brussels sprouts", "brussels sprouts|brussels sprout|brussel sprouts"],
  ["broccoli", "Broccoli", "broccoli"],
  ["cabbage", "Cabbage", "cabbages|cabbage"],
  ["cauliflower", "Cauliflower", "cauliflower"],
  ["kale", "Kale", "kale"],
  ["onion", "Onion", "onions|onion"],
  ["garlic", "Garlic", "garlic"],
  ["okra", "Okra", "okra"],
  ["bean", "Bean", "beans|bean"],
  ["pea", "Pea", "peas|pea"],
  ["corn", "Corn", "corn|maize|sweetcorn"],
  ["cucumber", "Cucumber", "cucumbers|cucumber"],
  ["squash", "Squash / pumpkin", "squash|pumpkins|pumpkin|zucchini|courgette"],
  ["eggplant", "Eggplant", "eggplants|eggplant|aubergines|aubergine|brinjals|brinjal"],
  ["beet", "Beet", "beets|beet|beetroot"],
  ["dill", "Dill", "dill"],
  ["cilantro", "Cilantro / coriander", "cilantro|coriander"],
  ["parsley", "Parsley", "parsley"],
  ["sage", "Sage", "sage"],
  ["sunflower", "Sunflower", "sunflowers|sunflower"],
  ["cosmos", "Cosmos", "cosmos"],
  ["basil", "Basil", "basil"],
  ["thyme", "Thyme", "thyme"],
  ["rosemary", "Rosemary", "rosemary"],
  ["mint", "Mint", "peppermint|spearmint|mint"],
  ["alyssum", "Sweet alyssum", "sweet alyssum|alyssum"],
  ["calendula", "Calendula", "calendula|pot marigolds|pot marigold"],
  ["marigold", "Marigold", "marigolds|marigold"],
  ["nasturtium", "Nasturtium", "nasturtiums|nasturtium"],
] as const;
const matchers = profiles.map(([id, label, aliases]) => ({ id, label, pattern: new RegExp(`\\b(?:${aliases})\\b`, "i") }));
export function companionProfile(name: string) {
  // Match the plant name, not its variety or notes. Ambiguous mixes stay unknown.
  if (/\bmix(?:es|ture)?\b|\bblend\b/i.test(name)) return undefined;
  const normalized = name.normalize("NFKC").replace(/[-_]/g, " ");
  // These are distinct crops and must not accidentally match their shorter names.
  if (/\b(?:catmint|cat mint|lemon mint|mountain mint|flowering cabbage|ornamental cabbage|russian sage|jerusalem sage|pineapple sage|mexican sage|meadow sage|clary sage)\b/i.test(normalized)) return undefined;
  return matchers.find(p => p.pattern.test(normalized));
}
type Crop = typeof profiles[number][0];
export type CompanionRule = {
  id: string;
  a: Crop;
  b: Crop;
  kind: "benefit" | "caution";
  reason: string;
  basis: "Research example" | "Space & timing" | "Disease risk" | "Watering needs" | "Support & ground cover";
  sources: Source[];
};
export const companionRules: CompanionRule[] = [
  { id: "tomato-basil", a: "tomato", b: "basil", kind: "benefit", reason: "Basil reduced tomato thrips in some trials. Keep normal spacing.", basis: "Research example", sources: ["umn"] },
  { id: "tomato-marigold", a: "tomato", b: "marigold", kind: "benefit", reason: "Marigolds reduced tomato thrips in some trials; effects vary.", basis: "Research example", sources: ["umn"] },
  ...(["tomato", "pepper"] as const).flatMap(a => (["lettuce", "spinach"] as const).map(b => ({ id: `${a}-${b}`, a, b, kind: "benefit" as const, reason: "Harvest early greens before the larger crop fills the bed.", basis: "Space & timing" as const, sources: ["umn" as const] }))),
  { id: "carrot-radish", a: "carrot", b: "radish", kind: "benefit", reason: "Harvest quick radishes first, leaving room for slower carrots.", basis: "Space & timing", sources: ["umn"] },
  { id: "broccoli-thyme", a: "broccoli", b: "thyme", kind: "benefit", reason: "Thyme reduced cabbageworm damage in one broccoli study.", basis: "Research example", sources: ["umn"] },
  { id: "broccoli-onion", a: "broccoli", b: "onion", kind: "benefit", reason: "Onions reduced cabbageworm damage in one broccoli study.", basis: "Research example", sources: ["umn"] },
  { id: "cabbage-nasturtium", a: "cabbage", b: "nasturtium", kind: "benefit", reason: "Nasturtiums reduced cabbageworm damage in a cabbage trial.", basis: "Research example", sources: ["umn"] },
  { id: "squash-nasturtium", a: "squash", b: "nasturtium", kind: "benefit", reason: "Nasturtiums reduced squash bugs in research trials.", basis: "Research example", sources: ["umn"] },
  { id: "squash-alyssum", a: "squash", b: "alyssum", kind: "benefit", reason: "Alyssum supported aphid predators in a squash study.", basis: "Research example", sources: ["umn"] },
  { id: "broccoli-nasturtium", a: "broccoli", b: "nasturtium", kind: "benefit", reason: "Nasturtiums reduced cabbageworm damage in a broccoli trial.", basis: "Research example", sources: ["umn"] },
  { id: "cabbage-onion", a: "cabbage", b: "onion", kind: "benefit", reason: "Onions reduced cabbageworm damage in a cabbage trial.", basis: "Research example", sources: ["umn"] },
  { id: "cabbage-marigold", a: "cabbage", b: "marigold", kind: "benefit", reason: "Marigolds reduced cabbageworm damage in a cabbage trial.", basis: "Research example", sources: ["umn"] },
  { id: "brussels-sage", a: "brussels", b: "sage", kind: "benefit", reason: "Sage reduced diamondback moth populations in greenhouse trials.", basis: "Research example", sources: ["umn"] },
  { id: "brussels-thyme", a: "brussels", b: "thyme", kind: "benefit", reason: "Thyme reduced diamondback moth populations in greenhouse trials.", basis: "Research example", sources: ["umn"] },
  { id: "squash-marigold", a: "squash", b: "marigold", kind: "benefit", reason: "Marigolds reduced squash bug and cucumber beetle damage in a trial.", basis: "Research example", sources: ["umn"] },
  { id: "corn-bean", a: "corn", b: "bean", kind: "benefit", reason: "In a Three Sisters planting, tall corn can support suitable climbing beans. Start corn first; vigorous beans can overwhelm it. Bush beans do not climb.", basis: "Support & ground cover", sources: ["sisters"] },
  { id: "corn-squash", a: "corn", b: "squash", kind: "benefit", reason: "In a Three Sisters planting, squash foliage shades soil and limits weeds. Establish corn first and leave room for vines so young plants are not shaded out.", basis: "Support & ground cover", sources: ["sisters"] },
  { id: "tomato-potato", a: "tomato", b: "potato", kind: "caution", reason: "Both host late blight. Consider separate beds, inspect both crops, and rotate planting sites; distance alone cannot prevent infection.", basis: "Disease risk", sources: ["blight"] },
  { id: "basil-rosemary", a: "basil", b: "rosemary", kind: "caution", reason: "Basil prefers moist soil; rosemary prefers drier soil. Separate pots make watering each plant easier.", basis: "Watering needs", sources: ["rosemary", "basil"] },
];
export type CompanionNote = { id: string; crops: readonly Crop[]; title: string; reason: string; sources: Source[] };
// General habitat and management advice is separate from specific crop-pair evidence.
export const companionNotes: CompanionNote[] = [
  { id: "small-flowers", crops: ["dill", "cilantro", "alyssum"], title: "Let some plants flower", reason: "Their small flowers supply nectar and pollen for beneficial insects. Keep some blooms available near vegetables; this supports habitat rather than guaranteeing pest control.", sources: ["beneficial"] },
  { id: "flowering-herbs", crops: ["parsley", "thyme"], title: "Make room for flowers", reason: "Allowing some herbs to bloom provides pollen and nectar and adds pollinator habitat to the vegetable garden.", sources: ["flowers"] },
  { id: "flower-habitat", crops: ["sunflower", "cosmos"], title: "Support beneficial insects", reason: "These flowers are visited by beneficial insects. Include varied bloom times in garden borders; account for mature size when choosing their location.", sources: ["beneficial"] },
  { id: "marigold-nematodes", crops: ["marigold"], title: "Nematode control needs a separate plan", reason: "A few marigolds beside vegetables are not reliable nematode protection. Effective use requires a suitable Tagetes variety, identified nematodes, and a preceding cover crop grown in the same soil for at least two months.", sources: ["nematodes"] },
];
export function companionGuidance(name: string) {
  const profile = companionProfile(name);
  const relationships = profile ? companionRules.filter(r => r.a === profile.id || r.b === profile.id).map(r => ({ ...r, companion: profiles.find(p => p[0] === (r.a === profile.id ? r.b : r.a))![1] })) : [];
  return { profile, relationships, notes: profile ? companionNotes.filter(n => n.crops.includes(profile.id)) : [], containment: profile?.id === "mint" };
}
export type CompanionPlant = { id: string; name: string; status?: string };
export function checkCompanionBed(plants: CompanionPlant[]) {
  const active = plants.filter(p => p.status !== "Finished");
  const known = new Map<Crop, string>();
  const unknown: string[] = [];
  for (const plant of active) {
    const profile = companionProfile(plant.name);
    if (profile) known.set(profile.id, profile.label);
    else if (!unknown.includes(plant.name)) unknown.push(plant.name);
  }
  const matches = companionRules.filter(r => known.has(r.a) && known.has(r.b)).map(r => ({ ...r, pair: `${known.get(r.a)} + ${known.get(r.b)}` }));
  return { matches, unknown, mint: known.has("mint"), count: active.length };
}

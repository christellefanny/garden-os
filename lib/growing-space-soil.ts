/** Read-only guidance. A raised-bed label alone does not establish construction. */
export type SoilContext = "ground" | "raised" | "container";
export type RaisedBedBase = "open-soil" | "closed-base";
type SoilSource = { title: string; url: string };
type SoilGuide = {
  title: string;
  intro: string;
  steps: Array<{ title: string; body: string }>;
  caution: string;
  sources: SoilSource[];
};

export function resolveSoilContext(spaceType?: string, raisedBedBase?: unknown): SoilContext | null {
  const type = typeof spaceType === "string" ? spaceType.trim().toLowerCase().replace(/\s+/g, " ") : "";
  if (type === "in-ground bed") return "ground";
  if (["container", "grow bag", "growing bag"].includes(type)) return "container";
  if (type === "raised bed") {
    if (raisedBedBase === "open-soil") return "raised";
    if (raisedBedBase === "closed-base") return "container";
  }
  return null;
}

const organicMatter = { title: "University of Maryland Extension: Organic Matter and Soil Amendments", url: "https://extension.umd.edu/resource/organic-matter-and-soil-amendments" };
const raisedBeds = { title: "University of Maryland Extension: Soil to Fill Raised Beds", url: "https://extension.umd.edu/resource/soil-fill-raised-beds" };
const containers = { title: "University of Maryland Extension: Growing Vegetables in Containers and Salad Tables", url: "https://extension.umd.edu/resource/growing-vegetables-containers-and-salad-tables" };
const pottingMedia = { title: "Iowa State University Extension: Potting Media Components and Handling", url: "https://yardandgarden.extension.iastate.edu/article/2025/03/potting-media-components-and-handling" };
const pottingMix = { title: "University of Florida IFAS Extension: Homemade Potting Mix", url: "https://sfyl.ifas.ufl.edu/lawn-and-garden/homemade-potting-mix/" };
const claySoil = { title: "Utah State University Extension: Gardening in Clay Soils", url: "https://extension.usu.edu/yardandgarden/research/gardening-in-clay-soils" };

export const soilGuides: Record<SoilContext, SoilGuide> = {
  ground: {
    title: "Build on the soil you have",
    intro: "An in-ground bed starts with your existing soil. You do not need to replace it with a bagged mix.",
    steps: [
      { title: "Get to know your soil", body: "Notice how quickly water drains and whether the soil is crumbly or compacted. A soil test can guide nutrient and pH changes before you buy amendments." },
      { title: "Improve only what needs improving", body: "Add finished compost if the soil needs organic matter. Work gently when soil is moist but not wet, and avoid walking on the growing area." },
      { title: "Protect the surface", body: "Use mulch to help retain moisture and protect the soil. Keep it clear of plant stems and check moisture beneath it before watering." },
    ],
    caution: "Do not add sand as a quick fix for clay soil. Avoid automatic fertilizer or pH changes; use a soil test to guide them.",
    sources: [organicMatter, claySoil],
  },
  raised: {
    title: "Start with the soil beneath your bed.",
    intro: "This guide is for a raised bed open to the soil below. A bed with a solid base needs container-style care instead.",
    steps: [
      { title: "Check the ground below", body: "Look at drainage and the condition of the existing soil. A raised frame does not by itself fix waterlogged ground or make contaminated soil safe." },
      { title: "Add fill only if needed", body: "If you need more fill, use suitable garden soil or topsoil. Add finished compost if the soil needs it." },
      { title: "Let the bed guide your care", body: "Check moisture through the rooting area and use a soil test before adjusting nutrients or pH. Keep the surface mulched and avoid compacting the bed." },
    ],
    caution: "There is no single fill recipe for every raised bed. Check the quality and source of any soil you bring in, and do not fill the bed with compost alone.",
    sources: [raisedBeds, organicMatter],
  },
  container: {
    title: "Give roots air and a way to drain",
    intro: "Pots, growing bags and closed-base raised beds need a lightweight potting mix suited to container growing.",
    steps: [
      { title: "Start with a suitable mix", body: "Choose a ready-made potting mix suited to your plants. Garden soil or topsoil alone can become too dense in a container. You do not need to buy every ingredient separately." },
      { title: "Check the drainage outlets", body: "Make sure excess water can leave through drainage holes, suitable outlets or the permeable sides and base of a growing bag. A solid-base bed needs drainage outlets too." },
      { title: "Water for the container", body: "Check moisture regularly and empty standing water from an ordinary saucer. An intentional self-watering reservoir is different: follow its instructions and keep its overflow clear." },
    ],
    caution: "Do not add a gravel layer at the bottom for drainage. It does not improve drainage and reduces the depth available for roots. Match feeding to your plants and any fertilizer already in the mix.",
    sources: [containers, pottingMedia],
  },
};

export const soilMaterials: Array<{
  id: string; name: string; role: string; helps: string; caution: string; sources: SoilSource[];
}> = [
  {
    id: "compost", name: "Compost", role: "Organic matter",
    helps: "Finished compost can improve soil structure and moisture retention where organic matter is needed.",
    caution: "Use only as needed. Compost varies in nutrients and salts; it is not a complete potting mix or a reason to skip a soil test. Use finished compost, not fresh or unfinished material around roots.",
    sources: [organicMatter, raisedBeds],
  },
  {
    id: "vermiculite", name: "Vermiculite", role: "Moisture retention",
    helps: "Horticultural vermiculite holds water and nutrients in potting mixes that need more moisture retention.",
    caution: "Optional, not a default addition. It may hold more moisture than a plant or an already water-retentive mix needs.",
    sources: [pottingMedia, pottingMix],
  },
  {
    id: "coco-coir", name: "Coco coir", role: "Moisture-holding potting ingredient",
    helps: "Horticultural coco coir can form part of a potting mix and helps it hold moisture.",
    caution: "Choose a low-salt horticultural product and hydrate compressed coir as directed before use. Coir is not fertilizer or a complete growing mix on its own.",
    sources: [pottingMedia, pottingMix],
  },
  {
    id: "perlite", name: "Perlite", role: "Aeration",
    helps: "Horticultural perlite adds air spaces to potting mixes where more aeration is needed.",
    caution: "Optional if the mix already drains well. It does not replace drainage outlets or provide fertilizer. Dampen dusty ingredients before handling and follow the label.",
    sources: [pottingMedia, pottingMix],
  },
  {
    id: "sand", name: "Sand", role: "Specialist mix ingredient",
    helps: "Suitable coarse horticultural sand is used in some plant-specific potting mixes, but it is not a routine addition.",
    caution: "Do not add sand as a quick fix for clay soil. Fine sand can reduce pore space, and sand adds weight to containers; use a suitable ready-made mix if unsure.",
    sources: [claySoil, pottingMedia],
  },
  {
    id: "gravel", name: "Gravel", role: "Not a bottom drainage layer",
    helps: "Gravel is not needed at the bottom of a pot. Keep that depth for the potting mix and roots instead.",
    caution: "A gravel layer does not improve container drainage. Use a suitable potting mix and clear drainage outlets instead.",
    sources: [containers, pottingMedia],
  },
];

export function spaceSoilSummary(context: SoilContext): { title: string; body: string } {
  if (context === "raised") return {
    title: "Start with the soil beneath your bed.",
    body: "If you need more fill, use suitable garden soil or topsoil. Add finished compost if the soil needs it.",
  };
  if (context === "ground") return {
    title: "Build on your existing soil.",
    body: "Check drainage and use a soil test to guide changes. Add finished compost if the soil needs it.",
  };
  return {
    title: "Start with a lightweight potting mix.",
    body: "Choose a mix suited to your plants and make sure excess water can drain. Skip a gravel layer at the bottom.",
  };
}

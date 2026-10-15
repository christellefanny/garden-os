import type { Space, SpaceDetails } from "./garden";
import type { VaultPlant } from "../components/PlantVault";
export type PlantFilter = "All" | "Vegetable" | "Flower" | "Herb" | "Fruit & Berry";
export const plantCatalog = Object.entries({
  Vegetable: "Tomato|Bell Pepper|Habanero Pepper|Scotch Bonnet Pepper|Serrano Pepper|Lettuce|Garlic|Onion|Okra|Sweet Potato|Broccoli|Carrot|Beet|Radish|Spinach|Kale|Cucumber|Zucchini|Bean|Pea|Eggplant|Cabbage|Cauliflower|Swiss Chard|Corn|Potato",
  Flower: "Dianthus|Tulip|Gladiator Allium|Daffodil|Zinnia|Cosmos|Sunflower|Marigold|Calendula|Painted Daisy|African Daisy|Salvia|Hollyhock|Wildflower Mix|Shade Flower Mix|Dahlia|Peony|Rose|Lavender|Echinacea|Snapdragon|Petunia|Hydrangea",
  Herb: "Basil|Chives|Cilantro|Dill|Mint|Oregano|Parsley|Rosemary|Sage|Thyme",
  "Fruit & Berry": "Strawberry|Blueberry|Raspberry|Blackberry|Apple|Pear|Grape",
}).flatMap(([category, names]) => names.split("|").map(name => ({ id: `catalog:${name}`, name, variety: "", category, source: "catalog" as const })));
export function catalogCategory(name: string) {
  const normalized = name.toLowerCase().replace(/tomatoes/g,"tomato").replace(/ies\b/g,"y").replace(/s\b/g,"");
  return plantCatalog.find(p => p.name.toLowerCase().replace(/s\b/g,"") === normalized)?.category;
}
export function inferPlantFilter(space: Space, details: SpaceDetails, gardenName: string, vault: VaultPlant[]): PlantFilter {
  // The individual bed wins over a broader garden name, including mixed gardens.
  for (const text of [space.name, gardenName]) {
    const flower = /flower|floral|blossom|bouquet|cutting garden|ornamental/i.test(text);
    const vegetable = /vegetable|veggie|kitchen garden|potager/i.test(text);
    if (flower !== vegetable) return flower ? "Flower" : "Vegetable";
  }
  const knownCategory = (category: string | undefined, name: string) => !category || category === "Other" ? catalogCategory(name) : category;
  const categories = new Set(details.plants.filter(p => p.status !== "Finished").map(p => knownCategory(vault.find(v => v.id === p.vaultPlantId)?.category || p.category, p.name)).filter(Boolean));
  if (categories.size === 1) {
    const category = [...categories][0];
    if (["Vegetable", "Flower", "Herb", "Fruit & Berry"].includes(category!)) return category as PlantFilter;
  }
  return "All";
}
export function plantChoices(vault: VaultPlant[], filter: PlantFilter, query = "") {
  const choices = [...vault.map(p => ({...p, category: p.category === "Other" ? catalogCategory(p.name) || p.category : p.category, id: `vault:${p.id}`, source: "vault" as const })), ...plantCatalog.filter(p => !vault.some(v => v.name.toLowerCase() === p.name.toLowerCase() && !v.variety))];
  return choices.filter(p => (filter === "All" || p.category === filter) && `${p.name} ${p.variety}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b) => a.name.localeCompare(b.name) || a.variety.localeCompare(b.variety));
}

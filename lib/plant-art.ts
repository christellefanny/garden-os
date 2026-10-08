const names = [
  "Tomato", "Pepper", "Garlic", "Onion", "Lettuce", "Kabocha squash", "Cucumber", "Sweet Potato", "Ginger", "Okra", "Broccoli", "Kale", "Spinach", "Arugula", "Radish", "Bush Beans",
  "Beans", "Carrot", "Celery", "Leek", "Corn", "Potato", "Zucchini", "Watermelon", "Cantaloupe", "Cabbage", "Broccoli raab", "Basil", "Thyme", "Mint", "Spearmint", "Sweet Mint",
  "Rosemary", "Parsley", "Lemon Balm", "Oregano", "Sage", "Chives", "Lemongrass", "Saffron", "Zinnia", "Cosmos", "French Marigold", "Dwarf Marigold", "Calendula", "Pansy", "Dwarf Petunia", "Sweet Alyssum",
  "Dahlia", "Nasturtium", "Sunflower", "Dianthus", "Sedum", "Catmint / Nepeta", "Coneflower / Echinacea", "Yarrow", "New England Aster", "Black-eyed Susan / Rudbeckia", "Astilbe", "Hosta", "Heuchera / Coral Bells", "Japanese Anemone", "Lamb's Ear", "Hydrangea",
  "Agastache / Hummingbird Mint", "Love-in-a-Mist / Nigella", "Penstemon / Beardtongue", "Japanese Forest Grass", "Brunnera", "Epimedium", "Queen Anne's Lace / Wild Carrot", "Raspberry", "Blackberry", "Blueberry", "Strawberry", "Pear", "Nectarine", "Peach", "Apple",
  // Tile 79 is the existing hot-pepper portrait; keep earlier tile positions stable.
  "Orange Hot Pepper",
  "Wildflower mix", "Painted Daisy", "African Daisy", "Salvia", "Hollyhocks", "Shade flower mix", "Tulips", "Gladiator allium",
] as const;
function normalize(name: string) {
  return name.trim().toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ");
}
const indexes = new Map<string, number>();
names.forEach((name, index) => {
  indexes.set(normalize(name), index);
  name.split(" / ").forEach((alias) => indexes.set(normalize(alias), index));
});
for (const [alias, name] of Object.entries({ "bell pepper": "Pepper", "hot pepper": "Pepper", "sweet potato": "Sweet Potato", "marigold": "French Marigold", "petunia": "Dwarf Petunia", "green beans": "Bush Beans", "romaine": "Lettuce", "sweet basil": "Basil", "broccoli rabe": "Broccoli raab" })) {
  indexes.set(normalize(alias), indexes.get(normalize(name))!);
}
for (const [alias, name] of Object.entries({ "wildflower seed mix": "Wildflower mix", "wildflowers mix": "Wildflower mix", "painted daisies": "Painted Daisy", "african daisies": "African Daisy", "hollyhock": "Hollyhocks", "shade flower seed mix": "Shade flower mix", "shade flowers mix": "Shade flower mix", "tulip": "Tulips", "allium gladiator": "Gladiator allium", "allium 'gladiator'": "Gladiator allium" })) {
  indexes.set(normalize(alias), indexes.get(normalize(name))!);
}

export function getPlantArt(name: string, variety = "") {
  let index = indexes.get(normalize(name));
  if (normalize(name) === "allium" && normalize(variety) === "gladiator") index = indexes.get("gladiator allium");
  if (index === undefined) return null;
  if (index === 1 && /habanero|scotch bonnet/i.test(variety)) index = 79;
  return {
    src: `/plant-vault/botanical-atlas-${Math.floor(index / 16) + 1}.webp`,
    column: index % 4,
    row: Math.floor((index % 16) / 4),
  };
}

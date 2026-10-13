const names = [
  "Tomato",
  "Pepper",
  "Garlic",
  "Onion",
  "Lettuce",
  "Kabocha squash",
  "Cucumber",
  "Sweet Potato",
  "Ginger",
  "Okra",
  "Broccoli",
  "Kale",
  "Spinach",
  "Arugula",
  "Radish",
  "Bush Beans",
  "Beans",
  "Carrot",
  "Celery",
  "Leek",
  "Corn",
  "Potato",
  "Zucchini",
  "Watermelon",
  "Cantaloupe",
  "Cabbage",
  "Broccoli raab",
  "Basil",
  "Thyme",
  "Mint",
  "Spearmint",
  "Sweet Mint",
  "Rosemary",
  "Parsley",
  "Lemon Balm",
  "Oregano",
  "Sage",
  "Chives",
  "Lemongrass",
  "Saffron",
  "Zinnia",
  "Cosmos",
  "French Marigold",
  "Dwarf Marigold",
  "Calendula",
  "Pansy",
  "Dwarf Petunia",
  "Sweet Alyssum",
  "Dahlia",
  "Nasturtium",
  "Sunflower",
  "Dianthus",
  "Sedum",
  "Catmint / Nepeta",
  "Coneflower / Echinacea",
  "Yarrow",
  "New England Aster",
  "Black-eyed Susan / Rudbeckia",
  "Astilbe",
  "Hosta",
  "Heuchera / Coral Bells",
  "Japanese Anemone",
  "Lamb's Ear",
  "Hydrangea",
  "Agastache / Hummingbird Mint",
  "Love-in-a-Mist / Nigella",
  "Penstemon / Beardtongue",
  "Japanese Forest Grass",
  "Brunnera",
  "Epimedium",
  "Queen Anne's Lace / Wild Carrot",
  "Raspberry",
  "Blackberry",
  "Blueberry",
  "Strawberry",
  "Pear",
  "Nectarine",
  "Peach",
  "Apple",
  // Tile 79 is the existing hot-pepper portrait; keep earlier tile positions stable.
  "Orange Hot Pepper",
  "Wildflower mix",
  "Painted Daisy",
  "African Daisy",
  "Salvia",
  "Hollyhocks",
  "Shade flower mix",
  "Tulips",
  "Gladiator allium",
] as const;
function normalize(name: string) {
  return name.trim().toLowerCase().replace(/[’']/g, "").replace(/\s+/g, " ");
}
const indexes = new Map<string, number>();
names.forEach((name, index) => {
  indexes.set(normalize(name), index);
  name.split(" / ").forEach((alias) => indexes.set(normalize(alias), index));
});
for (const [alias, name] of Object.entries({
  "bell pepper": "Pepper",
  "hot pepper": "Pepper",
  "sweet potato": "Sweet Potato",
  marigold: "French Marigold",
  petunia: "Dwarf Petunia",
  "green beans": "Bush Beans",
  romaine: "Lettuce",
  "sweet basil": "Basil",
  "broccoli rabe": "Broccoli raab",
})) {
  indexes.set(normalize(alias), indexes.get(normalize(name))!);
}
for (const [alias, name] of Object.entries({
  "wildflower seed mix": "Wildflower mix",
  "wildflowers mix": "Wildflower mix",
  "painted daisies": "Painted Daisy",
  "african daisies": "African Daisy",
  hollyhock: "Hollyhocks",
  "shade flower seed mix": "Shade flower mix",
  "shade flowers mix": "Shade flower mix",
  tulip: "Tulips",
  "allium gladiator": "Gladiator allium",
  "allium 'gladiator'": "Gladiator allium",
})) {
  indexes.set(normalize(alias), indexes.get(normalize(name))!);
}

export function getPlantArt(name: string, variety = "") {
  const illustrated = [
    "tomato",
    "bell pepper",
    "garlic",
    "okra",
    "lettuce",
    "zinnia",
    "basil",
    "mint",
    "dianthus",
    "cosmos",
    "tulips",
    "gladiator allium",
    "hollyhocks",
    "salvia",
    "sweet potato",
    "african daisy",
  ];
  let botanicalName = normalize(name);
  if (botanicalName === "tomatoes") botanicalName = "tomato";
  if (botanicalName === "pepper" && (!variety || /bell/i.test(variety)))
    botanicalName = "bell pepper";
  if (botanicalName === "tulip") botanicalName = "tulips";
  const botanicalIndex = illustrated.indexOf(botanicalName);
  if (botanicalIndex >= 0)
    return {
      src: "/conservatory/botanical-plate.webp",
      column: botanicalIndex % 4,
      row: Math.floor(botanicalIndex / 4),
      illustration: true,
    };
  // A bell-pepper portrait is not an accurate substitute for slender hot-pepper varieties.
  if (
    /pepper/.test(botanicalName) &&
    variety &&
    !/bell|habanero|scotch bonnet/i.test(variety)
  )
    return null;
  let index = indexes.get(normalize(name));
  if (normalize(name) === "allium" && normalize(variety) === "gladiator")
    index = indexes.get("gladiator allium");
  if (index === undefined) return null;
  if (index === 1 && /habanero|scotch bonnet/i.test(variety)) index = 79;
  return {
    illustration: false,
    src: `/plant-vault/botanical-atlas-${Math.floor(index / 16) + 1}.webp`,
    column: index % 4,
    row: Math.floor((index % 16) / 4),
  };
}

// Keep collection and growing-space artwork subject to the same cultivar checks.
export function distinctCultivar(name: string, variety: string) {
  return (
    (/dianthus/i.test(name) && /paint the town/i.test(variety)) ||
    (/lettuce/i.test(name) &&
      /red|purple|butter|romaine|oak|iceberg|little gem|lollo|salad bowl/i.test(
        variety,
      )) ||
    (/onion/i.test(name) &&
      /red|purple|white|yellow|sweet|vidalia|shallot|scallion|green|bunching/i.test(
        variety,
      )) ||
    (/tomato/i.test(name) &&
      /cherry|grape|roma|plum|beefsteak|heirloom|pear|yellow|orange|purple|black|green|brandywine|cherokee|san marzano|sungold|sun gold/i.test(
        variety,
      )) ||
    (/pepper/i.test(name) &&
      /habanero|scotch bonnet|serrano|jalape|cayenne|thai|ghost|reaper|poblano|shishito|banana|miniature|redskin|purple|orange|yellow|red|chocolate/i.test(
        variety,
      ))
  );
}
// This plate provides representative crop/type illustrations, not cultivar identification.
export function cropPortrait(name: string, variety = "") {
  const crop = normalize(name),
    description = normalize(`${name} ${variety}`);
  let index: number | undefined,
    caption = "Representative crop illustration";
  if (/\b(peppers?|habanero|scotch bonnet|serrano)\b/.test(crop)) {
    if (/scotch bonnet/.test(description)) {
      index = 1;
      caption = "Scotch bonnet pepper type";
    } else if (/habanero/.test(description)) {
      index = 0;
      caption = "Habanero pepper type";
    } else if (/serrano/.test(description)) {
      index = 2;
      caption = "Serrano pepper type";
    } else if (/bell|miniature|redskin/.test(description)) {
      if (/red|miniature|redskin/.test(description)) {
        index = 3;
        caption = "Red bell pepper type";
      } else {
        const art = getPlantArt("Bell Pepper");
        return art
          ? { ...art, caption: "Bell pepper illustration · variety may differ" }
          : null;
      }
    } else if (/hot|chili|chilli/.test(description)) {
      index = 2;
      caption = "Representative chili pepper illustration · variety may differ";
    } else {
      const art = getPlantArt("Bell Pepper");
      return art
        ? {
            ...art,
            caption: "Representative pepper illustration · variety may differ",
          }
        : null;
    }
  } else if (/\btomato(?:es)?\b/.test(crop)) {
    if (/roma|plum|san marzano/.test(description)) {
      index = 4;
      caption = "Plum tomato type";
    } else if (/cherry|sungold|sun gold/.test(description)) {
      index = 5;
      caption = "Cherry tomato type · color may differ";
    } else if (/cherokee|purple|black/.test(description)) {
      index = 7;
      caption = "Dark tomato type";
    } else {
      index = 6;
      caption = /beefsteak|brandywine/.test(description)
        ? "Beefsteak tomato type"
        : "Representative tomato illustration · variety may differ";
    }
  } else if (/\b(lettuce|romaine)\b/.test(crop)) {
    if (/romaine|little gem|\bcos\b/.test(description)) {
      index = 8;
      caption = "Romaine lettuce type";
    } else if (
      /oak|salad bowl/.test(description) &&
      !/red|purple/.test(description)
    ) {
      index = 11;
      caption = "Green oakleaf lettuce type";
    } else if (/red|purple|lollo/.test(description)) {
      index = 10;
      caption = "Red leaf lettuce type";
    } else {
      index = 9;
      caption = /butter/.test(description)
        ? "Butterhead lettuce type"
        : "Representative lettuce illustration · variety may differ";
    }
  } else if (/\b(onions?|scallions?)\b/.test(crop)) {
    if (/scallion|green onion|bunching|spring onion/.test(description)) {
      index = 15;
      caption = "Bunching onion type";
    } else if (/red|purple/.test(description)) {
      index = 12;
      caption = "Red bulb onion type";
    } else if (/white/.test(description)) {
      index = 14;
      caption = "White bulb onion type";
    } else {
      index = 13;
      caption = /yellow|sweet|vidalia/.test(description)
        ? "Yellow bulb onion type"
        : "Representative bulb onion illustration · variety may differ";
    }
  }
  return index === undefined
    ? null
    : {
        src: "/conservatory/crop-portraits-v2.webp",
        column: index % 4,
        row: Math.floor(index / 4),
        illustration: true,
        caption,
      };
}
export function getPortraitArt(name: string, variety = "") {
  const crop = cropPortrait(name, variety);
  if (crop) return crop;
  const art = distinctCultivar(name, variety)
    ? null
    : getPlantArt(name, variety);
  return art ? { ...art, caption: undefined } : null;
}

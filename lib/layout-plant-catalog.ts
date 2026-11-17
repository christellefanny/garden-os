/** Lightweight layout catalog mirrored from the public vegetable and flower Library.
 * Stable legacy IDs preserve saved layouts. Missing exact artwork uses a named marker,
 * never a photograph or a different species. Coverage is enforced by tests. */
export type DesignPlant = {id:string;name:string;group:"Vegetables"|"Flowers";libraryId:string;src?:string;sprite?:{column:number;row:number;columns:number}};
export const libraryDesignPlants: readonly DesignPlant[] = [
  {
    "id": "tomato",
    "name": "Tomato",
    "group": "Vegetables",
    "libraryId": "tomato",
    "src": "/planting-now/tomato.webp"
  },
  {
    "id": "pepper",
    "name": "Bell Pepper",
    "group": "Vegetables",
    "libraryId": "bell-pepper",
    "src": "/planting-now/pepper.webp"
  },
  {
    "id": "habanero-pepper",
    "name": "Habanero Pepper",
    "group": "Vegetables",
    "libraryId": "habanero-pepper",
    "src": "/conservatory/crop-portraits-v2.webp",
    "sprite": {
      "column": 0,
      "row": 0,
      "columns": 4
    }
  },
  {
    "id": "scotch-bonnet-pepper",
    "name": "Scotch Bonnet Pepper",
    "group": "Vegetables",
    "libraryId": "scotch-bonnet-pepper",
    "src": "/conservatory/crop-portraits-v2.webp",
    "sprite": {
      "column": 1,
      "row": 0,
      "columns": 4
    }
  },
  {
    "id": "serrano-pepper",
    "name": "Serrano Pepper",
    "group": "Vegetables",
    "libraryId": "serrano-pepper",
    "src": "/conservatory/crop-portraits-v2.webp",
    "sprite": {
      "column": 2,
      "row": 0,
      "columns": 4
    }
  },
  {
    "id": "lettuce",
    "name": "Lettuce",
    "group": "Vegetables",
    "libraryId": "lettuce",
    "src": "/planting-now/lettuce.webp"
  },
  {
    "id": "garlic",
    "name": "Garlic",
    "group": "Vegetables",
    "libraryId": "garlic",
    "src": "/planting-now/garlic.webp"
  },
  {
    "id": "onion",
    "name": "Onion",
    "group": "Vegetables",
    "libraryId": "onion",
    "src": "/conservatory/crop-portraits-v2.webp",
    "sprite": {
      "column": 1,
      "row": 3,
      "columns": 4
    }
  },
  {
    "id": "okra",
    "name": "Okra",
    "group": "Vegetables",
    "libraryId": "okra",
    "src": "/layout-inspiration/okra.webp"
  },
  {
    "id": "sweet-potato",
    "name": "Sweet Potato",
    "group": "Vegetables",
    "libraryId": "sweet-potato",
    "src": "/plant-vault/illustrated-collection-2.webp",
    "sprite": {
      "column": 0,
      "row": 3,
      "columns": 4
    }
  },
  {
    "id": "broccoli",
    "name": "Broccoli",
    "group": "Vegetables",
    "libraryId": "broccoli",
    "src": "/layout-inspiration/broccoli.webp"
  },
  {
    "id": "carrot",
    "name": "Carrot",
    "group": "Vegetables",
    "libraryId": "carrot",
    "src": "/layout-inspiration/carrot.webp"
  },
  {
    "id": "beet",
    "name": "Beet",
    "group": "Vegetables",
    "libraryId": "beet"
  },
  {
    "id": "radish",
    "name": "Radish",
    "group": "Vegetables",
    "libraryId": "radish",
    "src": "/planting-now/radish.webp"
  },
  {
    "id": "spinach",
    "name": "Spinach",
    "group": "Vegetables",
    "libraryId": "spinach",
    "src": "/planting-now/spinach.webp"
  },
  {
    "id": "kale",
    "name": "Kale",
    "group": "Vegetables",
    "libraryId": "kale",
    "src": "/planting-now/kale.webp"
  },
  {
    "id": "cucumber",
    "name": "Cucumber",
    "group": "Vegetables",
    "libraryId": "cucumber",
    "src": "/layout-inspiration/cucumber.webp"
  },
  {
    "id": "zucchini",
    "name": "Zucchini",
    "group": "Vegetables",
    "libraryId": "zucchini",
    "src": "/plant-vault/illustrated-collection-3.webp",
    "sprite": {
      "column": 2,
      "row": 2,
      "columns": 4
    }
  },
  {
    "id": "beans",
    "name": "Bean",
    "group": "Vegetables",
    "libraryId": "bean",
    "src": "/planting-now/beans.webp"
  },
  {
    "id": "peas",
    "name": "Pea",
    "group": "Vegetables",
    "libraryId": "pea",
    "src": "/planting-now/peas.webp"
  },
  {
    "id": "eggplant",
    "name": "Eggplant",
    "group": "Vegetables",
    "libraryId": "eggplant"
  },
  {
    "id": "cabbage",
    "name": "Cabbage",
    "group": "Vegetables",
    "libraryId": "cabbage"
  },
  {
    "id": "cauliflower",
    "name": "Cauliflower",
    "group": "Vegetables",
    "libraryId": "cauliflower",
    "src": "/conservatory/packet-botanical-plate.webp",
    "sprite": {
      "column": 0,
      "row": 0,
      "columns": 4
    }
  },
  {
    "id": "swiss-chard",
    "name": "Swiss Chard",
    "group": "Vegetables",
    "libraryId": "swiss-chard"
  },
  {
    "id": "corn",
    "name": "Sweet corn",
    "group": "Vegetables",
    "libraryId": "corn"
  },
  {
    "id": "potato",
    "name": "Potato",
    "group": "Vegetables",
    "libraryId": "potato",
    "src": "/plant-vault/illustrated-collection-3.webp",
    "sprite": {
      "column": 1,
      "row": 2,
      "columns": 4
    }
  },
  {
    "id": "dahlia",
    "name": "Dahlia",
    "group": "Flowers",
    "libraryId": "dahlias",
    "src": "/layout-inspiration/dahlia-transparent.webp"
  },
  {
    "id": "zinnia",
    "name": "Zinnia",
    "group": "Flowers",
    "libraryId": "zinnias",
    "src": "/layout-inspiration/zinnia-transparent.webp"
  },
  {
    "id": "cosmos",
    "name": "Cosmos",
    "group": "Flowers",
    "libraryId": "cosmos",
    "src": "/layout-inspiration/cosmos-transparent.webp"
  },
  {
    "id": "marigold",
    "name": "Marigold",
    "group": "Flowers",
    "libraryId": "marigolds",
    "src": "/layout-inspiration/marigold-transparent.webp"
  },
  {
    "id": "snapdragon",
    "name": "Snapdragon",
    "group": "Flowers",
    "libraryId": "snapdragons",
    "src": "/layout-inspiration/snapdragon-transparent.webp"
  },
  {
    "id": "alyssum",
    "name": "Sweet alyssum",
    "group": "Flowers",
    "libraryId": "alyssum",
    "src": "/layout-inspiration/alyssum-transparent.webp"
  },
  {
    "id": "calendula",
    "name": "Calendula",
    "group": "Flowers",
    "libraryId": "calendula",
    "src": "/cut-flowers/calendula.webp"
  },
  {
    "id": "sunflowers",
    "name": "Annual Sunflowers",
    "group": "Flowers",
    "libraryId": "sunflowers",
    "src": "/plant-vault/illustrated-collection-5.webp",
    "sprite": {
      "column": 3,
      "row": 1,
      "columns": 4
    }
  },
  {
    "id": "lisianthus",
    "name": "Lisianthus",
    "group": "Flowers",
    "libraryId": "lisianthus",
    "src": "/layout-inspiration/lisianthus-transparent.webp"
  },
  {
    "id": "rudbeckia",
    "name": "Black-eyed Susan",
    "group": "Flowers",
    "libraryId": "rudbeckia",
    "src": "/cut-flowers/rudbeckia.webp"
  },
  {
    "id": "heuchera",
    "name": "Heuchera / Coral Bells",
    "group": "Flowers",
    "libraryId": "heuchera",
    "src": "/plant-vault/illustrated-collection-6.webp",
    "sprite": {
      "column": 2,
      "row": 0,
      "columns": 4
    }
  },
  {
    "id": "hosta",
    "name": "Hostas",
    "group": "Flowers",
    "libraryId": "hosta",
    "src": "/plant-vault/illustrated-collection-6.webp",
    "sprite": {
      "column": 1,
      "row": 0,
      "columns": 4
    }
  },
  {
    "id": "statice",
    "name": "Statice",
    "group": "Flowers",
    "libraryId": "statice",
    "src": "/cut-flowers/statice.webp"
  },
  {
    "id": "strawflower",
    "name": "Strawflower",
    "group": "Flowers",
    "libraryId": "strawflower",
    "src": "/cut-flowers/strawflower.webp"
  },
  {
    "id": "gomphrena",
    "name": "Gomphrena",
    "group": "Flowers",
    "libraryId": "gomphrena",
    "src": "/cut-flowers/gomphrena.webp"
  },
  {
    "id": "celosia",
    "name": "Celosia",
    "group": "Flowers",
    "libraryId": "celosia",
    "src": "/cut-flowers/celosia.webp"
  },
  {
    "id": "amaranth",
    "name": "Amaranth",
    "group": "Flowers",
    "libraryId": "amaranth",
    "src": "/cut-flowers/amaranth.webp"
  },
  {
    "id": "nigella",
    "name": "Nigella",
    "group": "Flowers",
    "libraryId": "nigella",
    "src": "/cut-flowers/nigella.webp"
  },
  {
    "id": "scabiosa",
    "name": "Scabiosa",
    "group": "Flowers",
    "libraryId": "scabiosa",
    "src": "/cut-flowers/scabiosa.webp"
  },
  {
    "id": "ammi-majus",
    "name": "Ammi Majus",
    "group": "Flowers",
    "libraryId": "ammi-majus",
    "src": "/cut-flowers/ammi-majus.webp"
  },
  {
    "id": "bupleurum",
    "name": "Bupleurum",
    "group": "Flowers",
    "libraryId": "bupleurum",
    "src": "/cut-flowers/bupleurum.webp"
  },
  {
    "id": "orlaya",
    "name": "Orlaya",
    "group": "Flowers",
    "libraryId": "orlaya",
    "src": "/cut-flowers/orlaya.webp"
  },
  {
    "id": "bells-of-ireland",
    "name": "Bells of Ireland",
    "group": "Flowers",
    "libraryId": "bells-of-ireland",
    "src": "/cut-flowers/bells-of-ireland.webp"
  },
  {
    "id": "larkspur",
    "name": "Larkspur",
    "group": "Flowers",
    "libraryId": "larkspur",
    "src": "/cut-flowers/larkspur.webp"
  },
  {
    "id": "bachelors-buttons",
    "name": "Bachelor's Buttons",
    "group": "Flowers",
    "libraryId": "bachelors-buttons",
    "src": "/cut-flowers/bachelors-buttons.webp"
  },
  {
    "id": "sweet-peas",
    "name": "Sweet Peas",
    "group": "Flowers",
    "libraryId": "sweet-peas",
    "src": "/cut-flowers/sweet-peas.webp"
  },
  {
    "id": "nasturtium",
    "name": "Nasturtium",
    "group": "Flowers",
    "libraryId": "nasturtium",
    "src": "/plant-vault/illustrated-collection-5.webp",
    "sprite": {
      "column": 2,
      "row": 1,
      "columns": 4
    }
  },
  {
    "id": "chantilly-snapdragons",
    "name": "Chantilly Snapdragons",
    "group": "Flowers",
    "libraryId": "chantilly-snapdragons",
    "src": "/cut-flowers/chantilly-snapdragons.webp"
  },
  {
    "id": "rudbeckia-sahara",
    "name": "Rudbeckia Sahara",
    "group": "Flowers",
    "libraryId": "rudbeckia-sahara",
    "src": "/cut-flowers/rudbeckia-sahara.webp"
  },
  {
    "id": "pansies",
    "name": "Pansies",
    "group": "Flowers",
    "libraryId": "pansies",
    "src": "/flower-corner-art/pansies.png"
  },
  {
    "id": "violas",
    "name": "Violas",
    "group": "Flowers",
    "libraryId": "violas",
    "src": "/flower-corner-art/violas.png"
  },
  {
    "id": "daffodils",
    "name": "Daffodils",
    "group": "Flowers",
    "libraryId": "daffodils",
    "src": "/flower-corner-art/daffodils.png"
  },
  {
    "id": "yarrow",
    "name": "Yarrow",
    "group": "Flowers",
    "libraryId": "yarrow",
    "src": "/cut-flowers/yarrow.webp"
  },
  {
    "id": "astrantia",
    "name": "Astrantia",
    "group": "Flowers",
    "libraryId": "astrantia",
    "src": "/cut-flowers/astrantia.webp"
  },
  {
    "id": "china-asters",
    "name": "China Asters",
    "group": "Flowers",
    "libraryId": "china-asters",
    "src": "/flower-corner-art/china-asters.png"
  },
  {
    "id": "perennial-asters",
    "name": "Perennial Asters",
    "group": "Flowers",
    "libraryId": "perennial-asters",
    "src": "/flower-corner-art/perennial-asters.png"
  },
  {
    "id": "feverfew",
    "name": "Feverfew",
    "group": "Flowers",
    "libraryId": "feverfew",
    "src": "/cut-flowers/feverfew.webp"
  },
  {
    "id": "hydrangeas",
    "name": "Hydrangeas",
    "group": "Flowers",
    "libraryId": "hydrangeas",
    "src": "/cut-flowers/hydrangeas.webp"
  },
  {
    "id": "ranunculus",
    "name": "Ranunculus",
    "group": "Flowers",
    "libraryId": "ranunculus",
    "src": "/cut-flowers/ranunculus.webp"
  },
  {
    "id": "dianthus",
    "name": "Dianthus",
    "group": "Flowers",
    "libraryId": "dianthus",
    "src": "/plant-vault/illustrated-collection-5.webp",
    "sprite": {
      "column": 1,
      "row": 2,
      "columns": 4
    }
  },
  {
    "id": "japanese-anemone",
    "name": "Japanese Anemone",
    "group": "Flowers",
    "libraryId": "japanese-anemone",
    "src": "/plant-vault/illustrated-collection-6.webp",
    "sprite": {
      "column": 3,
      "row": 0,
      "columns": 4
    }
  },
  {
    "id": "astilbe",
    "name": "Astilbe",
    "group": "Flowers",
    "libraryId": "astilbe",
    "src": "/plant-vault/illustrated-collection-6.webp",
    "sprite": {
      "column": 0,
      "row": 0,
      "columns": 4
    }
  },
  {
    "id": "catmint",
    "name": "Catmint",
    "group": "Flowers",
    "libraryId": "catmint",
    "src": "/plant-vault/illustrated-collection-5.webp",
    "sprite": {
      "column": 3,
      "row": 2,
      "columns": 4
    }
  },
  {
    "id": "tulips",
    "name": "Tulips",
    "group": "Flowers",
    "libraryId": "tulips",
    "src": "/plant-vault/illustrated-collection-7.webp",
    "sprite": {
      "column": 2,
      "row": 1,
      "columns": 4
    }
  },
  {
    "id": "ornamental-alliums",
    "name": "Ornamental Alliums",
    "group": "Flowers",
    "libraryId": "ornamental-alliums",
    "src": "/plant-vault/illustrated-collection-7.webp",
    "sprite": {
      "column": 1,
      "row": 1,
      "columns": 4
    }
  },
  {
    "id": "japanese-painted-fern",
    "name": "Japanese Painted Fern",
    "group": "Flowers",
    "libraryId": "japanese-painted-fern",
    "src": "/flower-corner-art/japanese-painted-fern.png"
  },
  {
    "id": "autumn-fern",
    "name": "Autumn Fern",
    "group": "Flowers",
    "libraryId": "autumn-fern",
    "src": "/flower-corner-art/autumn-fern.png"
  },
  {
    "id": "brunnera",
    "name": "Brunnera / Siberian Bugloss",
    "group": "Flowers",
    "libraryId": "brunnera",
    "src": "/flower-corner-art/brunnera.png"
  },
  {
    "id": "pulmonaria",
    "name": "Pulmonaria / Lungwort",
    "group": "Flowers",
    "libraryId": "pulmonaria",
    "src": "/flower-corner-art/pulmonaria.png"
  },
  {
    "id": "bergenia",
    "name": "Bergenia / Pigsqueak",
    "group": "Flowers",
    "libraryId": "bergenia",
    "src": "/flower-corner-art/bergenia.png"
  },
  {
    "id": "ligularia",
    "name": "Ligularia / Leopard Plant",
    "group": "Flowers",
    "libraryId": "ligularia",
    "src": "/flower-corner-art/ligularia.png"
  },
  {
    "id": "tiarella",
    "name": "Tiarella / Foamflower",
    "group": "Flowers",
    "libraryId": "tiarella",
    "src": "/flower-corner-art/tiarella.png"
  },
  {
    "id": "bleeding-heart",
    "name": "Old-fashioned Bleeding Heart",
    "group": "Flowers",
    "libraryId": "bleeding-heart",
    "src": "/flower-corner-art/bleeding-heart.png"
  },
  {
    "id": "hellebores",
    "name": "Hellebores / Lenten Rose",
    "group": "Flowers",
    "libraryId": "hellebores",
    "src": "/flower-corner-art/hellebores.png"
  },
  {
    "id": "coleus",
    "name": "Coleus",
    "group": "Flowers",
    "libraryId": "coleus",
    "src": "/flower-corner-art/coleus.png"
  }
];

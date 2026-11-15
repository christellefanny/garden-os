import type { CareTechnique } from './flower-care-visuals';

type SpeciesCareArtwork = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  source: { title: string; url: string };
};

/** Explicit review allowlist. Never fall back to artwork for another species or care mode. */
export const speciesCareArtwork: Record<string, Partial<Record<CareTechnique, SpeciesCareArtwork>>> = {
  "snapdragons": {
    deadheading: {
      src: "/flower-corner-care/species/snapdragons-deadheading.png", width: 1254, height: 1254,
      alt: "Watercolor pink snapdragon spike with faded brown lower florets, fresh two-lipped middle flowers and unopened tip buds.",
      caption: "Faded lower flowers do not mean the whole spike is finished. Preserve the upper buds; remove the spike after its flowers finish.",
      source: { title: "Iowa State Extension", url: "https://yardandgarden.extension.iastate.edu/article/1994/3-23-1994/snappy.html" },
    },
  },
  "chantilly-snapdragons": {
    deadheading: {
      src: "/flower-corner-care/species/chantilly-snapdragons-deadheading.png", width: 1254, height: 1254,
      alt: "Watercolor Chantilly-type snapdragon spike with open-faced pale-yellow flowers, faded brown lower flowers and unopened upper buds.",
      caption: "This representative Chantilly spike still has upper buds to open. Remove it after the whole spike finishes, preserving healthy branching growth.",
      source: { title: "Illinois Extension", url: "https://extension.illinois.edu/flowers/snapdragon" },
    },
  },
  "scabiosa": {
    deadheading: {
      src: "/flower-corner-care/species/scabiosa-deadheading.png", width: 1254, height: 1254,
      alt: "Watercolor scabiosa with a purple pincushion flower, projecting pale stamens, a brown spent head, an unopened bud and divided foliage.",
      caption: "Remove faded scabiosa heads, keeping unopened buds and healthy growth. Leave selected heads if wanted for seed. This is a flower-stage example, not a cutting diagram.",
      source: { title: "NC State Extension", url: "https://plants.ces.ncsu.edu/plants/scabiosa-atropurpurea/" },
    },
  },
  "dianthus": {
    deadheading: {
      src: "/flower-corner-care/species/dianthus-deadheading.png", width: 1254, height: 1254,
      alt: "Watercolor garden pink with five fringed pink petals, a faded flower, an unopened bud, tubular calyces and narrow gray-green leaves.",
      caption: "Garden-pink example: remove faded flowers while keeping buds and healthy foliage. Other Dianthus forms differ; this is not an identification guide for every hybrid.",
      source: { title: "RHS dianthus guide", url: "https://www.rhs.org.uk/plants/dianthus/growing-guide" },
    },
  },
  "feverfew": {
    deadheading: {
      src: "/flower-corner-care/species/feverfew-deadheading.png", width: 1254, height: 1254,
      alt: "Watercolor feverfew with faded cream-brown daisy heads, a fresh white flower, unopened buds and healthy lobed leaves.",
      caption: "Feverfew (Tanacetum parthenium): remove spent flowers promptly to limit self-seeding, preserving unopened buds and healthy growth.",
      source: { title: "NC State Extension", url: "https://plants.ces.ncsu.edu/plants/tanacetum-parthenium/" },
    },
  },
  coleus: {
    deadheading: {
      src: '/flower-corner-care/species/coleus-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor coleus with opposite burgundy-and-green serrated leaves and a lavender flower spike, with snips around the spike stem above the leaves.',
      caption: 'Optional flower-spike removal when foliage is the priority. Keep healthy leaves and developing shoots; the pictured spike is flowering, not spent.',
      source: { title: 'SDSU Extension', url: 'https://extension.sdstate.edu/coleus-color-every-garden' },
    },
  },
  daffodils: {
    deadheading: {
      src: '/flower-corner-care/species/daffodils-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor comparison of a spent trumpet daffodil with its green seed capsule, and a deadheaded daffodil retaining green stalk and leaves.',
      caption: 'Remove the faded flower and seed capsule, leaving the green stalk and leaves. This comparison illustrates what to retain, not a measured cutting height.',
      source: { title: 'RHS deadheading guide', url: 'https://www.rhs.org.uk/garden-jobs/deadheading-plants' },
    },
  },
  heuchera: {
    cutback: {
      src: '/flower-corner-care/species/heuchera-cutback.png', width: 1254, height: 1254,
      alt: 'Watercolor heuchera crown with healthy rounded lobed leaves and new central growth, plus one isolated dry brown outer leaf.',
      caption: 'Remove individual dead or damaged leaves while preserving healthy foliage and the crown. In cold regions, leave winter cleanup until spring.',
      source: { title: 'RHS heuchera guide', url: 'https://www.rhs.org.uk/plants/heuchera/growing-guide' },
    },
  },
  marigolds: {
    deadheading: {
      src: '/flower-corner-care/species/marigolds-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor French marigold with a dry orange-brown flower head, pinnately divided serrated leaves and an unopened side bud.',
      caption: 'French marigold (Tagetes patula) example: distinguish the faded flower from the unopened side bud. Remove spent heads while preserving healthy growth.',
      source: { title: 'Wisconsin Extension', url: 'https://hort.extension.wisc.edu/articles/marigolds/' },
    },
  },
  cosmos: {
    deadheading: {
      src: '/flower-corner-care/species/cosmos-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor cosmos showing a faded pink flower above finely divided foliage and an unopened round bud on a side branch.',
      caption: 'Remove faded flowers while keeping unopened buds and healthy side shoots. This shows a spent flower beside a bud, not an exact cutting position.',
      source: { title: 'NC State Extension', url: 'https://plants.ces.ncsu.edu/plants/cosmos-bipinnatus/' },
    },
  },
  calendula: {
    deadheading: {
      src: '/flower-corner-care/species/calendula-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor calendula with a fresh orange flower at left, a spent brown-petaled head at center and a healthy opening bud at right, above simple green leaves.',
      caption: 'Flower-stage example: the brown center head is spent; the orange flower at left and opening bud at right are still growing. Remove spent heads unless saving seed.',
      source: { title: 'Wisconsin Extension', url: 'https://hort.extension.wisc.edu/articles/calendula-calendula-officinalis/' },
    },
  },
  rudbeckia: {
    deadheading: {
      src: '/flower-corner-care/species/rudbeckia-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor black-eyed Susan with faded golden petals around a dark dome, hairy alternate leaves and an unopened side bud.',
      caption: 'Black-eyed Susan (Rudbeckia hirta): remove faded flowers for continued display, or retain selected heads for seed and wildlife. Preserve unopened buds.',
      source: { title: 'NC State Extension', url: 'https://plants.ces.ncsu.edu/plants/rudbeckia-hirta/' },
    },
  },
  'rudbeckia-sahara': {
    deadheading: {
      src: '/flower-corner-care/species/rudbeckia-sahara-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor semi-double Sahara rudbeckia with a faded peach-pink head, hairy alternate leaves and an unopened bud.',
      caption: 'A semi-double Sahara example: distinguish the faded head from the unopened bud. Remove spent heads or retain selected ones for seed and wildlife; this seed strain varies in color and form.',
      source: { title: 'RHS Sahara guide', url: 'https://www.rhs.org.uk/plants/383358/rudbeckia-hirta-sahara-mixed-d/details' },
    },
  },
  'sweet-peas': {
    deadheading: {
      src: '/flower-corner-care/species/sweet-peas-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor sweet pea sprig with a fresh pink flower at left, a faded brown flower in the center, an unopened bud at right, paired leaflets and a curling tendril.',
      caption: 'Remove faded flowers while preserving unopened buds. This illustrates flower stages, not seed pods; remove unwanted developing pods too. Sweet peas are not edible peas.',
      source: { title: 'RHS sweet pea guide', url: 'https://www.rhs.org.uk/plants/lathyrus/growing-guide' },
    },
  },
  catmint: {
    cutback: {
      src: '/flower-corner-care/species/catmint-cutback.png', width: 1254, height: 1254,
      alt: 'Watercolor garden catmint with faded lavender flower spikes above healthy gray-green foliage, illustrating a trim of the spent upper growth.',
      caption: 'Illustrative post-flowering trim: shorten faded flowering growth while preserving healthy leafy growth. The mark is not a fixed cutting height for every plant.',
      source: { title: 'RHS catmint guide', url: 'https://www.rhs.org.uk/plants/nepeta' },
    },
  },
  pansies: {
    deadheading: {
      src: '/flower-corner-care/species/pansies-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor garden pansy with a wilted broad-faced flower, a closed purple bud and an intact fresh flower above scalloped green leaves.',
      caption: 'Remove faded pansy flowers, keeping unopened buds and healthy blooms. This illustrates flower stages rather than a cutting position.',
      source: { title: 'NC State Extension', url: 'https://plants.ces.ncsu.edu/plants/viola-x-wittrockiana/' },
    },
  },
  violas: {
    deadheading: {
      src: '/flower-corner-care/species/violas-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor horned viola with a faded flower at left, a fresh five-petalled violet flower with a long spur, and an unopened bud at right.',
      caption: 'Horned viola (Viola cornuta) example: remove faded flowers while protecting unopened buds. Bedding hybrids can differ in appearance.',
      source: { title: 'RHS horned viola guide', url: 'https://www.rhs.org.uk/plants/18990/viola-cornuta/details' },
    },
  },
  nasturtium: {
    deadheading: {
      src: '/flower-corner-care/species/nasturtium-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor nasturtium with a fresh orange spurred flower at left, a crumpled brown flower in the center, an unopened bud at right and round radial-veined leaves.',
      caption: 'The brown, crumpled flower is spent. Keep fresh flowers, unopened buds and healthy leaves. This illustrates flower stages, not a measured cutting point.',
      source: { title: 'Wisconsin Extension', url: 'https://hort.extension.wisc.edu/articles/nasturtium-tropaeolum-majus/' },
    },
  },
  zinnias: {
    deadheading: {
      src: '/flower-corner-care/species/zinnias-deadheading.png', width: 1254, height: 1254,
      alt: 'Watercolor double zinnia with a faded brown-pink flower, snips above a healthy opposite leaf pair, and developing buds left intact below.',
      caption: 'Remove the spent flower above a healthy leaf node, preserving the leaves and developing shoots below. Example of a double-flowered zinnia.',
      source: { title: 'Seed Savers Exchange', url: 'https://seedsavers.org/grow-zinnia/' },
    },
  },
  tulips: {
    cutback: {
      src: '/flower-corner-care/species/tulips-cutback.png', width: 1254, height: 1254,
      alt: 'Watercolor tulips after flowering, with healthy broad leaves left intact around bare flower stems.',
      caption: 'Leave green tulip foliage intact until it dies back naturally. This illustrates foliage retention, not a cutting position.',
      source: { title: 'Iowa State Extension', url: 'https://yardandgarden.extension.iastate.edu/faq/when-can-i-remove-tulip-foliage' },
    },
  },
};

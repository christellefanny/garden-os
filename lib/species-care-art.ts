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

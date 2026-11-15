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

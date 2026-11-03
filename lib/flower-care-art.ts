import type { CareVisualMode } from './flower-care-visuals';

/** AI-generated watercolor technique examples. Plant-specific text controls care. */
export type CareArtwork = {
  src: string;
  width: number;
  height: number;
  alt: string;
  example: string;
};

export const careArtwork: Record<CareVisualMode, CareArtwork> = {
  "pinch": {
    src: "/flower-corner-care/pinch.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: snips remove a young dahlia tip above a healthy leaf pair, leaving the leaves and side buds intact.",
    example: "Young dahlia shoot",
  },
  "leave-intact": {
    src: "/flower-corner-care/leave-intact.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: a healthy emerging hosta crown with intact unfurling shoots and no cutting tools.",
    example: "Healthy emerging hosta crown",
  },
  "deadhead": {
    src: "/flower-corner-care/deadhead.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: snips remove a faded zinnia flower above a healthy leaf node while retaining an unopened side bud.",
    example: "Zinnia spent flower",
  },
  "selective": {
    src: "/flower-corner-care/selective.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: one dead leaf is removed from a heuchera-style crown, with healthy leaves and new central growth protected.",
    example: "Heuchera-style leafy crown with one dead leaf",
  },
  "trim": {
    src: "/flower-corner-care/trim.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: a light trim removes catmint's spent upper flower stems while retaining the leafy living lower growth.",
    example: "Catmint light trim",
  },
  "dormant": {
    src: "/flower-corner-care/dormant.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: dry frost-killed dahlia stems are shortened above the crown; living foliage is not being cut.",
    example: "Dahlia after frost has killed the tops",
  },
  "bulb": {
    src: "/flower-corner-care/bulb.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor examples: intact green daffodil leaves beside naturally yellowing foliage, with no scissors or leaf cutting.",
    example: "Daffodil foliage aging naturally",
  },
  "woody": {
    src: "/flower-corner-care/woody.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: hydrangea wood with visible intact live buds; no pruning action or cut position is prescribed.",
    example: "Hydrangea woody stems with live buds",
  },
  "bulb-flower": {
    src: "/flower-corner-care/bulb-flower.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: snips remove a spent daffodil flower and ovary high on its scape, preserving every green leaf.",
    example: "Spent daffodil flower with leaves retained",
  },
  "flower-stalk": {
    src: "/flower-corner-care/flower-stalk.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: a dry hosta flower stalk is cut above its base, separately from healthy leaves and new shoots.",
    example: "Hosta spent flowering stalk",
  },
  "flower-spike": {
    src: "/flower-corner-care/flower-spike.png",
    width: 1254,
    height: 1254,
    alt: "Watercolor example: a coleus flower spike is removed above the upper leaf pair, preserving colorful foliage and side shoots.",
    example: "Coleus flowering spike removal",
  },
};


/** Visual labels only. The complete advice, sources and checklist remain in garden-learning.ts. */
export type BeginnerGuidePresentation = {
  label: string;
  image: { src: string; alt: string; width: number; height: number };
  stepTitles: string[];
};

export const beginnerGuidePresentation: Record<string, BeginnerGuidePresentation> = {
  space: {
    label: 'Space',
    image: { src: '/layout-inspiration/courtyard-open-entry.webp', alt: 'Watercolor of two raised beds and terracotta containers beside a clear garden path', width: 900, height: 900 },
    stepTitles: ['Watch the light', 'Match plants to sunlight', 'Choose your growing space', 'Keep your first project small'],
  },
  timing: {
    label: 'Timing',
    image: { src: '/flower-guides/seasonal.webp', alt: 'Watercolor of flowering bulbs, a seedling tray, a trowel and an open garden notebook', width: 1536, height: 1024 },
    stepTitles: ['Find your winter hardiness zone', 'A cold-winter garden: Zone 4', 'A mild-winter garden: Zone 10', 'Look up your local frost dates', 'Match the plant to the window'],
  },
  soil: {
    label: 'Soil',
    image: { src: '/container-art/terracotta.webp', alt: 'Illustrated terracotta container filled with dark growing mix', width: 640, height: 599 },
    stepTitles: ['Give containers the right mix', 'Let excess water escape', 'Test the soil in your beds', 'Check what the test includes'],
  },
  essentials: {
    label: 'Essentials',
    image: { src: '/interiors/tasks.webp', alt: 'Watercolor of a watering can, hand trowel and potted herb', width: 900, height: 600 },
    stepTitles: ['Your two-pot starter list', 'Work out how much mix to buy', 'Choose seeds or garden-ready plants', 'Adjust the list for a bed', 'Keep your tools simple', 'What can wait'],
  },
  planting: {
    label: 'Planting',
    image: { src: '/interiors/vault.webp', alt: 'Watercolor of young plants in terracotta pots beside seed packets and loose seeds', width: 900, height: 600 },
    stepTitles: ['Read the packet first', 'Choose how to start', 'Ease seedlings into outdoor life', 'Give every plant room'],
  },
  care: {
    label: 'Care',
    image: { src: '/flower-guides/care.webp', alt: 'Watercolor of flowering plants beside a watering can and garden snips', width: 1536, height: 1024 },
    stepTitles: ['Check moisture regularly', 'Water thoroughly, then let it drain', 'Adjust as plants grow', 'Look closely and keep notes'],
  },
};

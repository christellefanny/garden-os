/** Visual labels only. The complete advice, sources and checklist remain in garden-learning.ts. */
export type BeginnerGuidePresentation = {
  label: string;
  image: { src: string; alt: string; width: number; height: number };
  stepTitles: string[];
};

export const beginnerGuidePresentation: Record<string, BeginnerGuidePresentation> = {
  space: {
    label: 'Space',
    image: { src: '/beginner-guide-art/space.png', alt: 'Watercolor of wooden raised beds, containers and fabric grow bags in varied heights and materials', width: 1536, height: 1024 },
    stepTitles: ['Watch the light', 'Match plants to sunlight', 'Choose your growing space', 'Keep your first project small'],
  },
  timing: {
    label: 'Timing',
    image: { src: '/beginner-guide-art/timing.png', alt: 'Watercolor of two planted gardens blending from hardy perennials to tropical flowers and foliage, not a zone map or planting calendar', width: 1536, height: 1024 },
    stepTitles: ['Find your winter hardiness zone', 'A cold-winter garden: Zone 4', 'A mild-winter garden: Zone 10', 'Look up your local frost dates', 'Match the plant to the window'],
  },
  soil: {
    label: 'Soil',
    image: { src: '/beginner-guide-art/soil.png', alt: 'Watercolor comparison of loose garden soil, fibrous potting mix with white perlite, and sandy soil', width: 1536, height: 1024 },
    stepTitles: ['Give containers the right mix', 'Let excess water escape', 'Test the soil in your beds', 'Check what the test includes'],
  },
  essentials: {
    label: 'Essentials',
    image: { src: '/beginner-guide-art/essentials.png', alt: 'Watercolor of a small wooden growing bed, practical garden tools and a modest seed-starting tray', width: 1536, height: 1024 },
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

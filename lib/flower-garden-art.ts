export const cutFlowerSubjects = [
  "Dahlias", "Lisianthus", "Statice", "Sweet Alyssum",
  "Strawflower", "Snapdragons", "Calendula", "Cosmos",
  "Rudbeckia", "Gomphrena", "Celosia", "Amaranth",
  "Nigella", "Yarrow", "Scabiosa", "Ammi Majus",
  "Chantilly Snapdragons", "Bupleurum", "Astrantia", "Asters",
  "Feverfew", "Larkspur", "Orlaya", "Bachelor's Buttons",
  "Bells of Ireland", "Sweet Peas", "Rudbeckia Sahara", "Hydrangeas",
  "Ranunculus", "Zinnias",
] as const;

export function getFlowerGardenArt(name: string) {
  const index = cutFlowerSubjects.findIndex(subject => subject.toLowerCase() === name.trim().toLowerCase());
  if (index < 0) return null;
  return {
    src: `/flower-portraits/botanical-cut-flowers-${Math.floor(index / 16) + 1}.webp`,
    column: index % 4,
    row: Math.floor((index % 16) / 4),
  };
}

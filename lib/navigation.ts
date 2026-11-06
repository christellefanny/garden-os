// Stable route identities: retain Flower Garden for existing bookmarks and stored state.
export const destinations = [
  "Dashboard", "Beginner’s Guide", "My Gardens", "Plant Vault", "Flower Garden",
  "Garden Layout", "Garden Inspiration", "Growing Calendar", "Flower Corner", "Tasks", "Journal",
  "Settings", "Help",
] as const;
export type Destination = typeof destinations[number];

export function navigationDestinations(guest = false): Destination[] {
  return destinations.filter(name => name !== "Flower Garden" && (!guest || name !== "Plant Vault"));
}

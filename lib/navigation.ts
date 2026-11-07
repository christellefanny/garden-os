// Stable route identities: retain Flower Garden for existing bookmarks and stored state.
export const destinations = [
  "Dashboard", "Beginner’s Guide", "Plant Vault", "Flower Garden",
  "Garden Layout", "My Gardens", "Garden Inspiration", "Growing Calendar", "Flower Corner", "Tasks", "Journal",
  "Settings", "Help",
] as const;
export type Destination = typeof destinations[number];

export const growingCalendarSections = [
  { page: "Growing Calendar", label: "Calendar" },
  { page: "Tasks", label: "Tasks" },
  { page: "Journal", label: "Garden Journal" },
] as const satisfies ReadonlyArray<{ page: Destination; label: string }>;

export function isGrowingCalendarDestination(page: Destination): boolean {
  return growingCalendarSections.some(section => section.page === page);
}

export function sidebarDestination(page: Destination): Destination {
  if (isGrowingCalendarDestination(page)) return "Growing Calendar";
  return page === "Flower Garden" ? "My Gardens" : page;
}

export function navigationDestinations(guest = false): Destination[] {
  return destinations.filter(name => name !== "Flower Garden" && name !== "Tasks" && name !== "Journal" && (!guest || name !== "Plant Vault"));
}

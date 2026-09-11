/**
 * Google Maps gives every venue one of dozens of categories ("Frans
 * restaurant", "Wijngroothandel en -importeur", "Tapasbar"…). For deciding who
 * to mail, a handful of types is what matters.
 */
export const VENUE_TYPES = [
  "wijnbar",
  "restaurant",
  "wijnhandel",
  "bar",
  "overig",
] as const;

export type VenueType = (typeof VENUE_TYPES)[number];

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  wijnbar: "Wijnbar",
  restaurant: "Restaurant",
  wijnhandel: "Wijnhandel",
  // Kept apart on purpose: a cocktail bar is not a wine bar, and lumping them
  // together would make the wine-bar filter lie.
  bar: "Andere bar",
  overig: "Overig",
};

export function venueType(category: string | null): VenueType {
  const value = (category ?? "").toLowerCase();
  if (!value) return "overig";
  // Order matters: "wijnbar" also contains "bar", and "Tapas restaurant" is a
  // restaurant while "Tapasbar" is a bar.
  if (value.includes("wijnbar")) return "wijnbar";
  if (/wijnhandel|wijngroothandel|wijnmakerij|wijnwinkel|slijterij/.test(value)) {
    return "wijnhandel";
  }
  if (/restaurant|bistro|brasserie|eetcaf/.test(value)) return "restaurant";
  if (/bar|pub/.test(value)) return "bar";
  return "overig";
}

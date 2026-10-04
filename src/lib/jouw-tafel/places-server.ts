import rawPlaces from "@/lib/jouw-tafel/nl-places.json";
import { buildPlaceIndex, findPlace, type PlaceIndex, type RawPlace } from "@/lib/jouw-tafel/places";

// Server side of places.ts: the list is imported directly here (never in a
// client bundle).

let index: PlaceIndex | null = null;

export function placeIndex(): PlaceIndex {
  index ??= buildPlaceIndex(rawPlaces as RawPlace[]);
  return index;
}

/** The list's label for a place, any spelling or alias ("den bosch" ->
 * "Den Bosch", "Hengelo (Gelderland)"), or null when it is not on the list. */
export function placeLabel(name: string): string | null {
  return findPlace(placeIndex(), name)?.label ?? null;
}

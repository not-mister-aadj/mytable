// Dutch places (woonplaatsen, from PDOK; see scripts/build-nl-places.ts) for
// the quiz's "Andere stad" field: a fixed list to pick from. A picked place
// is its own place (a waitlist), never counted as one of our cities. Pure
// and client-safe: the list itself is passed in, so the ~130 KB JSON is only
// loaded where it is needed (lazily on the "Andere stad" field, directly on
// the server via places-server.ts).

import { cityMatchKey } from "@/lib/waitlist-city";

/** One woonplaats as stored in nl-places.json. */
export type RawPlace = { n: string; p: string; g?: string; lat: number; lon: number };

/** A place as shown and stored: `label` is its usual name, with the
 * province for names that exist more than once ("Oosterhout (Noord-Brabant)"),
 * or the municipality when the province is not enough ("Beek (Montferland)"). */
export type Place = RawPlace & { label: string; key: string };

export type PlaceIndex = {
  places: Place[];
  /** By label key, name key and alias key (a shared name gives the first). */
  byKey: Map<string, Place>;
  /** Every search key per place (name, label, aliases). */
  searchKeys: Map<Place, string[]>;
};

const PROVINCES: Record<string, string> = {
  DR: "Drenthe",
  FL: "Flevoland",
  FR: "Friesland",
  GD: "Gelderland",
  GR: "Groningen",
  LB: "Limburg",
  NB: "Noord-Brabant",
  NH: "Noord-Holland",
  OV: "Overijssel",
  UT: "Utrecht",
  ZH: "Zuid-Holland",
  ZL: "Zeeland",
};

/** The name we show (and store) where it differs from the official one. */
const DISPLAY: Record<string, string> = {
  "'s-Gravenhage": "Den Haag",
  "'s-Hertogenbosch": "Den Bosch",
};

/** Other names people type, per official name. */
const ALIASES: Record<string, string[]> = {
  "'s-Gravenhage": ["The Hague"],
};

/** Matching key: case, accents, apostrophes and hyphens ignored. */
export function placeKey(value: string): string {
  return cityMatchKey(value.replace(/['’`]/g, ""));
}

export function buildPlaceIndex(raw: readonly RawPlace[]): PlaceIndex {
  const counts = new Map<string, number>();
  for (const p of raw) counts.set(placeKey(p.n), (counts.get(placeKey(p.n)) ?? 0) + 1);
  const places: Place[] = raw.map((p) => {
    const name = DISPLAY[p.n] ?? p.n;
    const label = (counts.get(placeKey(p.n)) ?? 0) > 1 ? `${name} (${p.g ?? PROVINCES[p.p] ?? p.p})` : name;
    return { ...p, label, key: placeKey(name) };
  });
  const byKey = new Map<string, Place>();
  const searchKeys = new Map<Place, string[]>();
  for (const place of places) {
    const keys = [
      ...new Set([placeKey(place.label), place.key, placeKey(place.n), ...(ALIASES[place.n] ?? []).map(placeKey)]),
    ];
    searchKeys.set(place, keys);
    for (const key of keys) if (!byKey.has(key)) byKey.set(key, place);
  }
  return { places, byKey, searchKeys };
}

/** The place for a name or label, any spelling or alias, else null. */
export function findPlace(index: PlaceIndex, name: string): Place | null {
  return index.byKey.get(placeKey(name)) ?? null;
}

/**
 * Up to `limit` places for what someone typed: names (or aliases) that start
 * with it first, then names that contain it; shorter names first within
 * each group.
 */
export function searchPlaces(index: PlaceIndex, query: string, limit = 6): Place[] {
  const q = placeKey(query);
  if (!q) return [];
  const prefix: Place[] = [];
  const contains: Place[] = [];
  for (const place of index.places) {
    const keys = index.searchKeys.get(place) ?? [place.key];
    if (keys.some((k) => k.startsWith(q))) prefix.push(place);
    else if (keys.some((k) => k.includes(q))) contains.push(place);
  }
  const order = (a: Place, b: Place) => a.label.length - b.label.length || a.label.localeCompare(b.label, "nl");
  return [...prefix.sort(order), ...contains.sort(order)].slice(0, limit);
}

import { unstable_cache } from "next/cache";

export type GeocodeResult = { lat: string; lng: string };

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

/** Resolve coordinates for a Dutch venue from city + street address. */
export async function geocodeVenueAddress(
  city: string,
  address: string | null,
): Promise<GeocodeResult | null> {
  const cityTrim = city.trim();
  if (!cityTrim) return null;

  const query = address?.trim()
    ? `${address.trim()}, ${cityTrim}, Netherlands`
    : `${cityTrim}, Netherlands`;

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
    countrycodes: "nl",
  });

  try {
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MyTable/1.0 (venue geocoding; https://mytable.club)",
      },
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = data[0];
    if (!hit?.lat || !hit.lon) return null;

    const lat = Number.parseFloat(hit.lat);
    const lng = Number.parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat: String(lat), lng: String(lng) };
  } catch {
    return null;
  }
}

/** Cached geocode (same city + address → one external lookup per ~30 days). */
export function geocodeVenueCached(city: string, address: string | null) {
  const key = `${city.trim().toLowerCase()}|${(address ?? "").trim().toLowerCase()}`;
  return unstable_cache(
    () => geocodeVenueAddress(city, address),
    ["venue-geocode", key],
    { revalidate: 60 * 60 * 24 * 30 },
  )();
}

export function parseStoredCoords(
  latitude: string | null | undefined,
  longitude: string | null | undefined,
): GeocodeResult | null {
  const lat = latitude ? Number.parseFloat(latitude) : NaN;
  const lng = longitude ? Number.parseFloat(longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat: String(lat), lng: String(lng) };
}

import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";
import type { RouteMapPoint } from "@/data/experience-route-map";
import type { Venue } from "@/db/schema";
import { parseStoredCoords } from "@/lib/geocode";
import { venueToExperienceVenue } from "@/lib/venue-display";
import type { PreviewEventData } from "./event-preview";

function venuesInPickerOrder(
  ids: string[],
  allVenues: Venue[],
): Venue[] {
  const byId = new Map(allVenues.map((v) => [v.id, v]));
  return ids
    .map((id) => byId.get(id))
    .filter((v): v is Venue => Boolean(v));
}

export function buildPreviewVenues(
  data: PreviewEventData,
  allVenues: Venue[],
): ExperienceVenue[] {
  const ids = data.extras.venueIds ?? [];
  if (!ids.length || !allVenues.length) return [];

  const locale: Locale = data.previewLocale ?? "nl";
  const rows = venuesInPickerOrder(ids, allVenues);
  return rows.map((v) => venueToExperienceVenue(v, locale));
}

/** Route pins in admin preview from saved venue coordinates */
export function buildPreviewRoutePoints(
  data: PreviewEventData,
  allVenues: Venue[],
): RouteMapPoint[] {
  const ids = data.extras.venueIds ?? [];
  if (!ids.length) return [];

  const points: RouteMapPoint[] = [];
  for (const venue of venuesInPickerOrder(ids, allVenues)) {
    const coords = parseStoredCoords(venue.latitude, venue.longitude);
    if (!coords) continue;
    const lat = Number.parseFloat(coords.lat);
    const lng = Number.parseFloat(coords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    points.push({ label: venue.name, lat, lng });
  }
  return points;
}

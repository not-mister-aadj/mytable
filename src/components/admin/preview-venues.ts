import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";
import type { RouteMapPoint } from "@/data/experience-route-map";
import type { Venue } from "@/db/schema";
import { parseStoredCoords } from "@/lib/geocode";
import {
  isLocationTbdVenueId,
  locationTbdExperienceVenue,
  normalizeVenueId,
} from "@/lib/location-tbd-venue";
import { venueToExperienceVenue } from "@/lib/venue-display";
import type { PreviewEventData } from "./event-preview";

export function buildPreviewVenues(
  data: PreviewEventData,
  allVenues: Venue[],
): ExperienceVenue[] {
  const ids = data.extras.venueIds ?? [];
  if (!ids.length) return [];

  const locale: Locale = data.previewLocale ?? "nl";
  return ids
    .map((id) => {
      const normalizedId = normalizeVenueId(id);
      if (isLocationTbdVenueId(normalizedId)) {
        return locationTbdExperienceVenue(locale);
      }
      const venue = allVenues.find((v) => v.id === normalizedId);
      return venue ? venueToExperienceVenue(venue, locale) : null;
    })
    .filter((v): v is ExperienceVenue => v !== null);
}

/** Route pins in admin preview from saved venue coordinates */
export function buildPreviewRoutePoints(
  data: PreviewEventData,
  allVenues: Venue[],
): RouteMapPoint[] {
  const ids = data.extras.venueIds ?? [];
  if (!ids.length) return [];

  const points: RouteMapPoint[] = [];
  for (const id of ids) {
    const normalizedId = normalizeVenueId(id);
    if (isLocationTbdVenueId(normalizedId)) continue;
    const venue = allVenues.find((v) => v.id === normalizedId);
    if (!venue) continue;
    const coords = parseStoredCoords(venue.latitude, venue.longitude);
    if (!coords) continue;
    const lat = Number.parseFloat(coords.lat);
    const lng = Number.parseFloat(coords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    points.push({ label: venue.name, lat, lng });
  }
  return points;
}

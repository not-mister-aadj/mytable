import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";
import type { Venue } from "@/db/schema";
import { venueToExperienceVenue } from "@/lib/venue-display";
import type { PreviewEventData } from "./event-preview";

export function buildPreviewVenues(
  data: PreviewEventData,
  allVenues: Venue[],
): ExperienceVenue[] {
  const ids = data.extras.venueIds ?? [];
  if (!ids.length || !allVenues.length) return [];

  const locale: Locale = data.previewLocale ?? "nl";
  const byId = new Map(allVenues.map((v) => [v.id, v]));
  const rows = ids
    .map((id) => byId.get(id))
    .filter((v): v is Venue => Boolean(v));

  if (!rows.length) return [];

  const cityLower = (data.city || "").toLowerCase();
  const inCity = rows.filter((v) => v.city.toLowerCase() === cityLower);
  const list = inCity.length > 0 ? inCity : rows;

  return list.map((v) => venueToExperienceVenue(v, locale));
}

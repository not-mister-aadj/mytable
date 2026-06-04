import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";
import type { Venue } from "@/db/schema";
import {
  coerceImageSettings,
  DEFAULT_VENUE_IMAGE,
  parseImageSettings,
} from "@/lib/image-settings";

export function venueToExperienceVenue(
  venue: Venue,
  locale: Locale,
): ExperienceVenue {
  const description =
    locale === "nl"
      ? venue.descriptionNl ?? venue.descriptionEn ?? ""
      : venue.descriptionEn ?? venue.descriptionNl ?? "";
  const imageSettings =
    parseImageSettings(venue.imageMeta) ??
    coerceImageSettings(venue.imageUrl, "venue");
  const imageUrl = imageSettings?.url ?? venue.imageUrl;

  return {
    name: venue.name,
    area: venue.area ?? venue.city,
    atmosphere: venue.atmosphere ?? "",
    description,
    image: imageUrl ?? DEFAULT_VENUE_IMAGE,
    imageSettings: imageSettings ?? undefined,
  };
}

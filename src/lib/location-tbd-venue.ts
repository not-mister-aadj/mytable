import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";
import { images } from "@/data/images";
import { coerceImageSettings } from "@/lib/image-settings";

/** Sentinel id stored in event extras.venueIds — not a database row */
export const LOCATION_TBD_VENUE_ID = "mytable:location-tbd";

const LOCATION_TBD_IMAGE = images.cityWalk;

export function isLocationTbdVenueId(id: string): boolean {
  const normalized = normalizeVenueId(id);
  return normalized === LOCATION_TBD_VENUE_ID;
}

/** Map legacy / trimmed ids to the canonical sentinel */
export function normalizeVenueId(id: string): string {
  const trimmed = id.trim();
  if (
    trimmed === LOCATION_TBD_VENUE_ID ||
    trimmed === "location-tbd" ||
    trimmed.endsWith(":location-tbd")
  ) {
    return LOCATION_TBD_VENUE_ID;
  }
  return trimmed;
}

export function filterMapVenueIds(ids: string[]): string[] {
  return ids.filter((id) => !isLocationTbdVenueId(id));
}

const copy = {
  nl: {
    pickerLabel: "Locatie nog niet bekend",
    pickerHint: "Placeholder tussen stops. Verschijnt niet op de kaart.",
    name: "Nog niet bekend",
    area: "Volgt nog",
    atmosphere: "Binnenkort",
    title: "Nog niet alle locaties zijn bekend",
    description:
      "We zijn nog bezig met de definitieve selectie. Ken of ben jij een leuke plek?",
  },
  en: {
    pickerLabel: "Location not yet announced",
    pickerHint: "Placeholder between stops. Not shown on the map.",
    name: "To be announced",
    area: "Coming soon",
    atmosphere: "Soon",
    title: "Not all locations are known yet",
    description:
      "We're still finalizing the lineup. Know a great spot, or have one yourself?",
  },
} as const;

export function locationTbdPickerCopy(locale: Locale = "nl") {
  return copy[locale];
}

export function isLocationTbdVenue(venue: ExperienceVenue): boolean {
  return venue.kind === "locationTbd";
}

export function locationTbdExperienceVenue(locale: Locale): ExperienceVenue {
  const c = copy[locale];
  const imageSettings = coerceImageSettings(LOCATION_TBD_IMAGE, "venue");
  return {
    kind: "locationTbd",
    name: c.name,
    area: c.area,
    atmosphere: c.atmosphere,
    description: c.description,
    image: imageSettings?.url ?? LOCATION_TBD_IMAGE,
    imageSettings: imageSettings ?? undefined,
    title: c.title,
  };
}

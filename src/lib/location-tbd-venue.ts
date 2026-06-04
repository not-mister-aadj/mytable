import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";

/** Sentinel id stored in event extras.venueIds — not a database row */
export const LOCATION_TBD_VENUE_ID = "mytable:location-tbd";

export function isLocationTbdVenueId(id: string): boolean {
  return id === LOCATION_TBD_VENUE_ID;
}

export function filterMapVenueIds(ids: string[]): string[] {
  return ids.filter((id) => !isLocationTbdVenueId(id));
}

const copy = {
  nl: {
    pickerLabel: "Locatie nog niet bekend",
    pickerHint: "Placeholder tussen stops — verschijnt niet op de kaart",
    name: "Nog niet bekend",
    area: "Volgt nog",
    atmosphere: "Binnenkort",
    title: "Nog niet alle locaties zijn bekend",
    description:
      "We zijn nog bezig met de definitieve selectie. De exacte stop en adres sturen we je per mail. Ken jij een leuke plek? Laat het ons weten.",
  },
  en: {
    pickerLabel: "Location not yet announced",
    pickerHint: "Placeholder between stops — not shown on the map",
    name: "To be announced",
    area: "Coming soon",
    atmosphere: "Soon",
    title: "Not all locations are known yet",
    description:
      "We're still finalizing the lineup. The exact stop and address will arrive by email. Know a great spot? Get in touch.",
  },
} as const;

export function locationTbdPickerCopy(locale: Locale = "nl") {
  return copy[locale];
}

export function locationTbdExperienceVenue(locale: Locale): ExperienceVenue {
  const c = copy[locale];
  return {
    kind: "locationTbd",
    name: c.name,
    area: c.area,
    atmosphere: c.atmosphere,
    description: c.description,
    image: "",
    title: c.title,
  };
}

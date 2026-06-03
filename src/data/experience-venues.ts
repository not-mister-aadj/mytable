import type { ExperienceItem, ExperienceVenue } from "@/i18n/types";
import { images } from "@/data/images";

const tastingVenues: ExperienceVenue[] = [
  {
    name: "Partnerrestaurant",
    area: "Centrum",
    atmosphere: "Chef's special",
    description:
      "Eén locatie, één tafel. De chef bereidt specials voor de groep, wijn en spijs die bij elkaar passen.",
    image: images.restaurantInterior,
  },
];

export function getExperienceVenues(
  _experienceId: string,
  _mood: ExperienceItem["mood"],
): ExperienceVenue[] {
  return tastingVenues;
}

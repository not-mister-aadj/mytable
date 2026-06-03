import type { ExperienceItem, ExperienceVenue } from "@/i18n/types";
import { images } from "@/data/images";

const rotterdamWineWalk: ExperienceVenue[] = [
  {
    name: "Petite Marie",
    area: "Witte de With",
    atmosphere: "Cozy & Warm",
    description:
      "Een kleine wijnbar waar gesprekken vanzelf ontstaan en de eerste glazen rustig worden ingeschonken.",
    image: images.wineBar,
  },
  {
    name: "Bar Boteco",
    area: "Westelijk Handelsterrein",
    atmosphere: "Shared Dining",
    description:
      "Drukke tafels, goede wijn en een ontspannen sfeer waar iedereen snel aansluit.",
    image: images.restaurantInterior,
  },
  {
    name: "Café de la Bourse",
    area: "Oude Haven",
    atmosphere: "Natural Wines",
    description:
      "Een stop met karakter: lichte wijnen, bites en uitzicht op het water tussen de wandelingen door.",
    image: images.wineGlasses,
  },
  {
    name: "Tableau",
    area: "Meent",
    atmosphere: "Long Table Friendly",
    description:
      "We sluiten af aan een lange tafel waar mensen vaak nog even blijven voor een laatste drankje.",
    image: images.restaurantDining,
  },
];

const defaultWineWalk: ExperienceVenue[] = [
  {
    name: "De eerste stop",
    area: "Centrum",
    atmosphere: "Intimate Atmosphere",
    description:
      "Een verborgen wijnbar met warm licht en een korte intro voordat de middag echt begint.",
    image: images.wineBar,
  },
  {
    name: "Tussenstop",
    area: "Stadsrand",
    atmosphere: "Modern Bistro",
    description:
      "Hier proef je iets nieuws en wissel je van tafel zonder dat het gehaast voelt.",
    image: images.restaurantInterior,
  },
  {
    name: "Laatste tafel",
    area: "Karakterwijk",
    atmosphere: "Cozy & Warm",
    description:
      "De afsluiting: een plek waar gesprekken blijven hangen en de middag rustig uitloopt.",
    image: images.cheers,
  },
];

const sharedDinnerVenues: ExperienceVenue[] = [
  {
    name: "Restaurant De Tafel",
    area: "Centrum",
    atmosphere: "Shared Dining",
    description:
      "Eén lange tafel, doordacht menu en een sfeer die voelt als uit eten met vrienden.",
    image: images.restaurantDining,
  },
  {
    name: "Keuken & Gezelschap",
    area: "Oude stad",
    atmosphere: "Intimate Atmosphere",
    description:
      "Open keuken, warme verlichting en een avond die draait om smaak en gesprek.",
    image: images.restaurantInterior,
  },
];

const tastingVenues: ExperienceVenue[] = [
  {
    name: "Proeflokaal",
    area: "Centrum",
    atmosphere: "Natural Wines",
    description:
      "Een rustige proefruimte waar elke flight persoonlijk wordt uitgelegd zonder wijnles.",
    image: images.wineGlasses,
  },
  {
    name: "Chef's counter",
    area: "Food quarter",
    atmosphere: "Modern Bistro",
    description:
      "Bijpassende bites bij elke proef, zodat je de middag als één samenhangend moment beleeft.",
    image: images.wineBar,
  },
];

const sundayTableVenues: ExperienceVenue[] = [
  {
    name: "Brunch Studio",
    area: "Stadsdeel",
    atmosphere: "Cozy & Warm",
    description:
      "Zachte jazz, goede koffie en een tafel waar zondag echt als zondag voelt.",
    image: images.brunch,
  },
  {
    name: "Garden Room",
    area: "Parkbuurt",
    atmosphere: "Long Table Friendly",
    description:
      "Licht, groen en ontspannen: de plek waar nieuwe gesprekken vanzelf ontstaan.",
    image: images.brunch,
  },
];

const mysteryVenues: ExperienceVenue[] = [
  {
    name: "Locatie wordt gedeeld",
    area: "Stadscentrum",
    atmosphere: "Mystery",
    description:
      "Een verrassingsrestaurant dat we pas na boeking onthullen. Verwacht karakter en sfeer.",
    image: images.mysteryDinner,
  },
];

export const experienceVenuesById: Partial<Record<string, ExperienceVenue[]>> = {
  "sunday-wine-walk": rotterdamWineWalk,
  "wine-walk-amsterdam": defaultWineWalk,
  "women-wine-walk": defaultWineWalk,
};

export const moodDefaultVenues: Record<
  Exclude<ExperienceItem["mood"], "all">,
  ExperienceVenue[]
> = {
  wineWalks: defaultWineWalk,
  sharedDinners: sharedDinnerVenues,
  tastings: tastingVenues,
  sundayTables: sundayTableVenues,
  mysteryTables: mysteryVenues,
};

export function getExperienceVenues(
  experienceId: string,
  mood: ExperienceItem["mood"],
): ExperienceVenue[] {
  const override = experienceVenuesById[experienceId];
  if (override) return override;
  if (mood === "all") return defaultWineWalk;
  return moodDefaultVenues[mood];
}

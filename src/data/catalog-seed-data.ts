/**
 * Seed source for DB migration. Mirrors experience-catalog.ts entries.
 */
import type { ExperienceItem } from "@/i18n/types";
import { images } from "@/data/images";
import { experienceSlugById } from "@/data/experience-slugs";

export type CatalogSeedEntry = {
  id: string;
  slug: string;
  city: string;
  dateTimeNl: string;
  dateTimeEn: string;
  price: number;
  status: ExperienceItem["status"];
  femaleOnly?: boolean;
  image: string;
  tagline?: { nl: string; en: string };
  names: { nl: string; en: string };
  categories: { nl: string; en: string };
};

export const catalogSeedEntries: CatalogSeedEntry[] = [
  {
    id: "wine-tasting-girls-amsterdam",
    slug: experienceSlugById["wine-tasting-girls-amsterdam"],
    city: "Amsterdam",
    names: {
      nl: "Wijnproeverij · girls only",
      en: "Wine tasting · girls only",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTimeNl: "Zondag 23 juni · 18:00–21:00",
    dateTimeEn: "Sunday 23 June · 18:00–21:00",
    price: 49,
    status: "soldOut",
    femaleOnly: true,
    image: images.wineBar,
    tagline: {
      nl: "Eén restaurant, één tafel, alleen voor vrouwen die van wijn en goed gezelschap houden.",
      en: "One restaurant, one table, for women who love wine and good company.",
    },
  },
  {
    id: "wine-tasting-mixed-rotterdam",
    slug: experienceSlugById["wine-tasting-mixed-rotterdam"],
    city: "Rotterdam",
    names: {
      nl: "Wijnproeverij · gemengde groep",
      en: "Wine tasting · mixed group",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTimeNl: "Zondag 16 juni · 18:00–21:00",
    dateTimeEn: "Sunday 16 June · 18:00–21:00",
    price: 45,
    status: "almostFull",
    image: images.wineGlasses,
    tagline: {
      nl: "Schuif aan bij een gemengde tafel in één restaurant, solo, met vrienden of op date.",
      en: "Join a mixed table at one restaurant, solo, with friends, or on a date.",
    },
  },
  {
    id: "wine-tasting-girls-utrecht",
    slug: experienceSlugById["wine-tasting-girls-utrecht"],
    city: "Utrecht",
    names: {
      nl: "Wijnproeverij · girls only",
      en: "Wine tasting · girls only",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTimeNl: "Zondag 22 juni · 18:00–21:00",
    dateTimeEn: "Sunday 22 June · 18:00–21:00",
    price: 52,
    status: "new",
    femaleOnly: true,
    image: images.wineBar,
  },
  {
    id: "wine-tasting-mixed-den-haag",
    slug: experienceSlugById["wine-tasting-mixed-den-haag"],
    city: "Den Haag",
    names: {
      nl: "Wijnproeverij · gemengde groep",
      en: "Wine tasting · mixed group",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTimeNl: "Donderdag 20 juni · 19:00–22:00",
    dateTimeEn: "Thursday 20 June · 19:00–22:00",
    price: 45,
    status: "almostFull",
    image: images.restaurantInterior,
  },
  {
    id: "wine-tasting-mixed-amsterdam",
    slug: experienceSlugById["wine-tasting-mixed-amsterdam"],
    city: "Amsterdam",
    names: {
      nl: "Wijnproeverij · gemengde groep",
      en: "Wine tasting · mixed group",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTimeNl: "Vrijdag 28 juni · 19:00–22:00",
    dateTimeEn: "Friday 28 June · 19:00–22:00",
    price: 47,
    status: "available",
    image: images.wineGlasses,
  },
  {
    id: "wine-tasting-girls-rotterdam",
    slug: experienceSlugById["wine-tasting-girls-rotterdam"],
    city: "Rotterdam",
    names: {
      nl: "Wijnproeverij · girls only",
      en: "Wine tasting · girls only",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTimeNl: "Zondag 30 juni · 14:00–17:00",
    dateTimeEn: "Sunday 30 June · 14:00–17:00",
    price: 48,
    status: "almostFull",
    femaleOnly: true,
    image: images.restaurantDining,
  },
  {
    id: "wine-tasting-mixed-utrecht",
    slug: experienceSlugById["wine-tasting-mixed-utrecht"],
    city: "Utrecht",
    names: {
      nl: "Wijnproeverij · gemengde groep",
      en: "Wine tasting · mixed group",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTimeNl: "Vrijdag 5 juli · 19:00–22:00",
    dateTimeEn: "Friday 5 July · 19:00–22:00",
    price: 46,
    status: "available",
    image: images.wineBar,
  },
  {
    id: "wine-tasting-girls-den-haag",
    slug: experienceSlugById["wine-tasting-girls-den-haag"],
    city: "Den Haag",
    names: {
      nl: "Wijnproeverij · girls only",
      en: "Wine tasting · girls only",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTimeNl: "Zondag 7 juli · 18:00–21:00",
    dateTimeEn: "Sunday 7 July · 18:00–21:00",
    price: 50,
    status: "new",
    femaleOnly: true,
    image: images.cheers,
  },
];

const DEFAULT_CAPACITY = 14;

export function spotsSoldFromStatus(
  status: ExperienceItem["status"],
  capacity: number = DEFAULT_CAPACITY,
): number {
  switch (status) {
    case "soldOut":
      return capacity;
    case "almostFull":
      return capacity - 4;
    default:
      return 0;
  }
}

export { DEFAULT_CAPACITY };

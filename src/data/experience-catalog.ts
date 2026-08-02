import type { Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { images } from "@/data/images";

type CatalogEntry = {
  id: string;
  city: string;
  dateTime: string;
  price: number;
  status: ExperienceItem["status"];
  image: string;
  tagline?: { nl: string; en: string };
  names: { nl: string; en: string };
  categories: { nl: string; en: string };
};

const catalog: CatalogEntry[] = [
  {
    id: "wine-tasting-girls-amsterdam",
    city: "Amsterdam",
    names: {
      nl: "Wijnproeverij",
      en: "Wine tasting",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTime: "Zondag 23 juni · 18:00–21:00",
    price: 49,
    status: "soldOut",
    image: images.wineBar,
    tagline: {
      nl: "Eén restaurant, één tafel — voor wie van wijn en goed gezelschap houdt.",
      en: "One restaurant, one table — for people who love wine and good company.",
    },
  },
  {
    id: "wine-tasting-mixed-rotterdam",
    city: "Rotterdam",
    names: {
      nl: "Wijnproeverij",
      en: "Wine tasting",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTime: "Zondag 16 juni · 18:00–21:00",
    price: 45,
    status: "closed",
    image: images.wineGlasses,
    tagline: {
      nl: "Schuif aan bij een tafel in één restaurant, solo, met vrienden of op date.",
      en: "Join a table at one restaurant, solo, with friends, or on a date.",
    },
  },
  {
    id: "wine-tasting-girls-utrecht",
    city: "Utrecht",
    names: {
      nl: "Wijnproeverij",
      en: "Wine tasting",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTime: "Zondag 22 juni · 18:00–21:00",
    price: 52,
    status: "closed",
    image: images.wineBar,
  },
  {
    id: "wine-tasting-mixed-den-haag",
    city: "Den Haag",
    names: {
      nl: "Wijnproeverij",
      en: "Wine tasting",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTime: "Donderdag 20 juni · 19:00–22:00",
    price: 45,
    status: "closed",
    image: images.restaurantInterior,
  },
  {
    id: "wine-tasting-mixed-amsterdam",
    city: "Amsterdam",
    names: {
      nl: "Wijnproeverij",
      en: "Wine tasting",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTime: "Vrijdag 28 juni · 19:00–22:00",
    price: 47,
    status: "closed",
    image: images.wineGlasses,
  },
  {
    id: "wine-tasting-girls-rotterdam",
    city: "Rotterdam",
    names: {
      nl: "Wijnproeverij",
      en: "Wine tasting",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTime: "Zondag 30 juni · 14:00–17:00",
    price: 48,
    status: "closed",
    image: images.restaurantDining,
  },
  {
    id: "wine-tasting-mixed-utrecht",
    city: "Utrecht",
    names: {
      nl: "Wijnproeverij",
      en: "Wine tasting",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTime: "Vrijdag 5 juli · 19:00–22:00",
    price: 46,
    status: "closed",
    image: images.wineBar,
  },
  {
    id: "wine-tasting-girls-den-haag",
    city: "Den Haag",
    names: {
      nl: "Wijnproeverij",
      en: "Wine tasting",
    },
    categories: { nl: "PROEVERIJ", en: "TASTING" },
    dateTime: "Zondag 7 juli · 18:00–21:00",
    price: 50,
    status: "closed",
    image: images.cheers,
  },
];

export function getCatalogExperiences(locale: Locale): ExperienceItem[] {
  const lang = locale === "nl" ? "nl" : "en";
  return catalog.map((entry) => ({
    id: entry.id,
    city: entry.city,
    experienceName: entry.names[lang],
    category: entry.categories[lang],
    dateTime: entry.dateTime,
    price: entry.price,
    status: entry.status,
    mood: "tastings",
    image: entry.image,
    femaleOnly: false,
    tagline: entry.tagline?.[lang],
  }));
}

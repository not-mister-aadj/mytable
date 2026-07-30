import type { Locale } from "@/i18n/config";

export const GIRLS_ONLY_CITY_SLUGS = [
  "amsterdam",
  "rotterdam",
  "den-haag",
  "utrecht",
  "eindhoven",
  "groningen",
  "almere",
  "tilburg",
  "breda",
  "nijmegen",
  "arnhem",
] as const;

export type GirlsOnlyCitySlug = (typeof GIRLS_ONLY_CITY_SLUGS)[number];

export type GirlsOnlyCityLocalCopy = {
  body: string;
  points: [string, string, string];
};

export type GirlsOnlyCityDefinition = {
  slug: GirlsOnlyCitySlug;
  /** Matches `events.city` / waitlist city labels */
  cityName: string;
  regionNl: string;
  regionEn: string;
  heroImage: string;
  /** Short local hook for the image panel */
  hookNl: string;
  hookEn: string;
  localNl: GirlsOnlyCityLocalCopy;
  localEn: GirlsOnlyCityLocalCopy;
};

const IMAGES = {
  hero: "/girls-only/hero-poster.jpg",
  wine: "/girls-only/wine-moment.jpg",
  table: "/girls-only/table-group.jpg",
  laughing: "/girls-only/table-wine-laughing.jpg",
  glasses: "/girls-only/smiling-glasses.jpg",
  duo: "/girls-only/duo-table.jpg",
  bar: "/girls-only/laughing-bar.jpg",
  group: "/girls-only/group-bar.jpg",
  crowd: "/girls-only/crowd-evening.jpg",
  connect: "/girls-only/connecting.jpg",
  phone: "/girls-only/phone-moment.jpg",
} as const;

const OFFER_POINTS_NL: [string, string, string] = [
  "Elke eerste zondag",
  "Nieuwe mensen. Solo welkom.",
  "Daarna culinaire ervaringen",
];

const OFFER_POINTS_EN: [string, string, string] = [
  "Every first Sunday",
  "New people. Solo welcome.",
  "Then culinary experiences",
];

function localNl(city: string, region: string): GirlsOnlyCityLocalCopy {
  return {
    body: `Sunday Table in ${city} (${region}). Elke eerste zondag. Nieuwe mensen. Daarna culinaire ervaringen.`,
    points: OFFER_POINTS_NL,
  };
}

function localEn(city: string, region: string): GirlsOnlyCityLocalCopy {
  return {
    body: `Sunday Table in ${city} (${region}). Every first Sunday. New people. Then culinary experiences.`,
    points: OFFER_POINTS_EN,
  };
}

export const GIRLS_ONLY_CITIES: Record<
  GirlsOnlyCitySlug,
  GirlsOnlyCityDefinition
> = {
  amsterdam: {
    slug: "amsterdam",
    cityName: "Amsterdam",
    regionNl: "Noord-Holland",
    regionEn: "North Holland",
    heroImage: IMAGES.hero,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Amsterdam", "Noord-Holland"),
    localEn: localEn("Amsterdam", "North Holland"),
  },
  rotterdam: {
    slug: "rotterdam",
    cityName: "Rotterdam",
    regionNl: "Zuid-Holland",
    regionEn: "South Holland",
    heroImage: IMAGES.table,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Rotterdam", "Zuid-Holland"),
    localEn: localEn("Rotterdam", "South Holland"),
  },
  "den-haag": {
    slug: "den-haag",
    cityName: "Den Haag",
    regionNl: "Zuid-Holland",
    regionEn: "South Holland",
    heroImage: IMAGES.glasses,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Den Haag", "Zuid-Holland"),
    localEn: localEn("The Hague", "South Holland"),
  },
  utrecht: {
    slug: "utrecht",
    cityName: "Utrecht",
    regionNl: "Utrecht",
    regionEn: "Utrecht",
    heroImage: IMAGES.wine,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Utrecht", "Utrecht"),
    localEn: localEn("Utrecht", "Utrecht"),
  },
  eindhoven: {
    slug: "eindhoven",
    cityName: "Eindhoven",
    regionNl: "Noord-Brabant",
    regionEn: "North Brabant",
    heroImage: IMAGES.laughing,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Eindhoven", "Noord-Brabant"),
    localEn: localEn("Eindhoven", "North Brabant"),
  },
  groningen: {
    slug: "groningen",
    cityName: "Groningen",
    regionNl: "Groningen",
    regionEn: "Groningen",
    heroImage: IMAGES.duo,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Groningen", "Groningen"),
    localEn: localEn("Groningen", "Groningen"),
  },
  almere: {
    slug: "almere",
    cityName: "Almere",
    regionNl: "Flevoland",
    regionEn: "Flevoland",
    heroImage: IMAGES.connect,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Almere", "Flevoland"),
    localEn: localEn("Almere", "Flevoland"),
  },
  tilburg: {
    slug: "tilburg",
    cityName: "Tilburg",
    regionNl: "Noord-Brabant",
    regionEn: "North Brabant",
    heroImage: IMAGES.bar,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Tilburg", "Noord-Brabant"),
    localEn: localEn("Tilburg", "North Brabant"),
  },
  breda: {
    slug: "breda",
    cityName: "Breda",
    regionNl: "Noord-Brabant",
    regionEn: "North Brabant",
    heroImage: IMAGES.group,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Breda", "Noord-Brabant"),
    localEn: localEn("Breda", "North Brabant"),
  },
  nijmegen: {
    slug: "nijmegen",
    cityName: "Nijmegen",
    regionNl: "Gelderland",
    regionEn: "Gelderland",
    heroImage: IMAGES.crowd,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Nijmegen", "Gelderland"),
    localEn: localEn("Nijmegen", "Gelderland"),
  },
  arnhem: {
    slug: "arnhem",
    cityName: "Arnhem",
    regionNl: "Gelderland",
    regionEn: "Gelderland",
    heroImage: IMAGES.phone,
    hookNl: "Elke eerste zondag.",
    hookEn: "Every first Sunday.",
    localNl: localNl("Arnhem", "Gelderland"),
    localEn: localEn("Arnhem", "Gelderland"),
  },
};

export function isGirlsOnlyCitySlug(value: string): value is GirlsOnlyCitySlug {
  return (GIRLS_ONLY_CITY_SLUGS as readonly string[]).includes(value);
}

export function getGirlsOnlyCity(
  slug: string,
): GirlsOnlyCityDefinition | undefined {
  if (!isGirlsOnlyCitySlug(slug)) return undefined;
  return GIRLS_ONLY_CITIES[slug];
}

export function listGirlsOnlyCities(): GirlsOnlyCityDefinition[] {
  return GIRLS_ONLY_CITY_SLUGS.map((slug) => GIRLS_ONLY_CITIES[slug]);
}

/** City names for waitlist / priority multi-select (stable order). */
export function listGirlsOnlyCityNames(): string[] {
  return listGirlsOnlyCities().map((city) => city.cityName);
}

export function girlsOnlyCityDisplayRegion(
  city: GirlsOnlyCityDefinition,
  locale: Locale,
): string {
  return locale === "en" ? city.regionEn : city.regionNl;
}

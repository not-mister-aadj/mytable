import {
  GIRLS_ONLY_CITIES,
  GIRLS_ONLY_CITY_SLUGS,
  type GirlsOnlyCityDefinition,
  type GirlsOnlyCitySlug,
} from "@/data/girls-only-cities";
import type { GirlsOnlyCityPageLabels } from "@/i18n/girls-only-city.types";

const sharedStatus = {
  available: "Available",
  almostFull: "Almost full",
  soldOut: "Sold out",
  closed: "Closed",
  new: "New",
} as const;

function buildCityPageEn(
  city: GirlsOnlyCityDefinition,
): GirlsOnlyCityPageLabels {
  const name = city.cityName;
  const enName = name === "Den Haag" ? "The Hague" : name;

  return {
    meta: {
      title: `Sunday Table in ${enName} · MyTable`,
      description: `Sunday Table in ${enName}. Every first Sunday. New people. Then culinary experiences.`,
    },
    breadcrumbHome: "Home",
    breadcrumbGirlsOnly: "Sunday Table",
    hero: {
      regionLabel: city.regionEn,
      headline: `Sunday Table in ${enName}`,
      subheadline:
        "Every first Sunday. New people. Then culinary experiences.",
      trustBullets: ["Solo welcome", "Matching", "Then culinary plans"],
      ctaBook: "Claim your seat",
      ctaPriority: "Go to Sunday Table",
      imageAlt: `Sunday Table in ${enName}`,
      seatsLeft: "{count} seats left · {city} · {date}",
    },
    events: {
      eyebrow: "Agenda",
      title: `Tables in ${enName}`,
      subtitle: `Next Sunday Table in ${enName}.`,
      emptyTitle: `Every first Sunday in ${enName}`,
      emptyBody: "Claim your seat. We match you at the table.",
      emptyCta: "Go to Sunday Table",
      viewAll: "All Sundays",
    },
    priority: {
      eyebrow: "Sunday Table",
      title: `${enName}`,
      subtitle: "Every first Sunday. New people. Then culinary experiences.",
      nameLabel: "First name",
      namePlaceholder: "Your first name",
      emailLabel: "Email",
      emailPlaceholder: "you@email.com",
      cta: "Go to Sunday Table",
      success: "You’re on the list.",
      error: "Sign-up failed. Try again later.",
      privacyNote: "Sunday Table updates only.",
    },
    included: {
      eyebrow: "The offer",
      title: `Sunday Table in ${enName}`,
      subtitle: "Every first Sunday. New people. Culinary plans.",
      items: [
        {
          title: "Every first Sunday",
          description: "Fixed rhythm. Every month.",
        },
        {
          title: "New people",
          description: "Matched at the table. Solo welcome.",
        },
        {
          title: "A drink",
          description: "Consumptions on location.",
        },
        {
          title: "Then culinary experiences",
          description: "Wine Walks, tastings, dinners.",
        },
      ],
    },
    local: {
      eyebrow: enName,
      title: `Sunday Table in ${enName}`,
      body: city.localEn.body,
      points: [...city.localEn.points],
    },
    howItWorks: {
      eyebrow: "The offer",
      title: `${enName}`,
      steps: [
        {
          title: "Clubmember",
          description: "Access to Sunday Table.",
        },
        {
          title: "First Sunday",
          description: "New people. Matching.",
        },
        {
          title: "Then",
          description: "Culinary experiences together.",
        },
      ],
    },
    faq: {
      title: `FAQ · ${enName}`,
      items: [
        {
          question: `What is Sunday Table in ${enName}?`,
          answer:
            "Every first Sunday. New people. Then culinary experiences.",
        },
        {
          question: "Solo?",
          answer: "Yes. Solo is the default.",
        },
        {
          question: `Where in ${enName}?`,
          answer: "Partner venue. Address after matching.",
        },
        {
          question: "Cost?",
          answer:
            "Via Clubmember. Drinks and bites on location. Culinary tickets separate, 10% off.",
        },
        {
          question: "When?",
          answer: "Every first Sunday of the month.",
        },
        {
          question: "Dating?",
          answer: "No.",
        },
      ],
    },
    otherCities: {
      title: "Other cities",
      subtitle: "Pick your city.",
      nationalCta: "All cities",
    },
    finalCta: {
      title: `Sunday Table in ${enName}`,
      subtitle: "Every first Sunday. New people. Culinary plans.",
      ctaBook: "Claim your seat",
      ctaPriority: "Go to Sunday Table",
    },
    status: sharedStatus,
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserve",
    viewTableCta: "View table",
    perPersonFrom: "from",
    socialPromise: "Every first Sunday. New people. Culinary plans.",
  };
}

export const girlsOnlyCityPagesEn = Object.fromEntries(
  GIRLS_ONLY_CITY_SLUGS.map((slug) => [
    slug,
    buildCityPageEn(GIRLS_ONLY_CITIES[slug]),
  ]),
) as Record<GirlsOnlyCitySlug, GirlsOnlyCityPageLabels>;

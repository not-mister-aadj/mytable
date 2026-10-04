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
  comingSoon: "Coming soon",
} as const;

function buildCityPageEn(
  city: GirlsOnlyCityDefinition,
): GirlsOnlyCityPageLabels {
  const name = city.cityName;
  const enName = name === "Den Haag" ? "The Hague" : name;

  return {
    meta: {
      title: `Meet new people in ${enName} · Sunday Social`,
      description: `Join 4 to 6 new people on a Sunday afternoon in ${enName}. Join the waitlist and be the first to hear when the first table in ${enName} opens.`,
    },
    breadcrumbHome: "Home",
    breadcrumbGirlsOnly: "Sunday Social",
    hero: {
      regionLabel: city.regionEn,
      headline: `Sunday Social in ${enName}`,
      subheadline:
        "Every month. New people. Then culinary experiences.",
      trustBullets: ["Solo welcome", "Matching", "Then culinary plans"],
      ctaBook: "Claim your seat",
      ctaPriority: "Go to Sunday Social",
      imageAlt: `Sunday Social in ${enName}`,
      seatsLeft: "{count} seats left · {city} · {date}",
    },
    events: {
      eyebrow: "Agenda",
      title: `Tables in ${enName}`,
      subtitle: `Next Sunday Social in ${enName}.`,
      emptyTitle: `Every month in ${enName}`,
      emptyBody: "Claim your seat. We match you at the table.",
      emptyCta: "Go to Sunday Social",
      viewAll: "All Sundays",
    },
    priority: {
      eyebrow: "Sunday Social",
      title: `${enName}`,
      subtitle: "Every month. New people. Then culinary experiences.",
      nameLabel: "First name",
      namePlaceholder: "Your first name",
      emailLabel: "Email",
      emailPlaceholder: "you@email.com",
      cta: "Go to Sunday Social",
      success: "You’re on the list.",
      error: "Sign-up failed. Try again later.",
      privacyNote: "Sunday Social updates only.",
    },
    included: {
      eyebrow: "The offer",
      title: `Sunday Social in ${enName}`,
      subtitle: "Every month. New people. Culinary plans.",
      items: [
        {
          title: "Every month",
          description: "Fixed rhythm. Every month.",
        },
        {
          title: "New people",
          description: "Matched at the table. Solo welcome.",
        },
        {
          title: "Bring a +1",
          description: "No extra cost, while seats last.",
        },
        {
          title: "MyTable picks",
          description: "Best wine bars and restaurants, often with a discount.",
        },
      ],
    },
    local: {
      eyebrow: enName,
      title: `Sunday Social in ${enName}`,
      body: city.localEn.body,
      points: [...city.localEn.points],
    },
    howItWorks: {
      eyebrow: "The offer",
      title: `${enName}`,
      steps: [
        {
          title: "Waitlist",
          description: "Join the list for your city.",
        },
        {
          title: "On a Sunday",
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
          question: `What is Sunday Social in ${enName}?`,
          answer:
            "Every month. New people. Then culinary experiences.",
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
            "Joining the waitlist is free. Once a table is ready for you, you'll hear the price. You pay for drinks and bites yourself, on location.",
        },
        {
          question: "When?",
          answer: "Once a month, on a Sunday afternoon.",
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
      title: `Sunday Social in ${enName}`,
      subtitle: "Every month. New people. Culinary plans.",
      ctaBook: "Claim your seat",
      ctaPriority: "Go to Sunday Social",
    },
    status: sharedStatus,
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserve",
    viewTableCta: "View table",
    perPersonFrom: "from",
    socialPromise: "Every month. New people. Culinary plans.",
  };
}

export const girlsOnlyCityPagesEn = Object.fromEntries(
  GIRLS_ONLY_CITY_SLUGS.map((slug) => [
    slug,
    buildCityPageEn(GIRLS_ONLY_CITIES[slug]),
  ]),
) as Record<GirlsOnlyCitySlug, GirlsOnlyCityPageLabels>;

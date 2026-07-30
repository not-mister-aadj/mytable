import {
  GIRLS_ONLY_CITIES,
  GIRLS_ONLY_CITY_SLUGS,
  type GirlsOnlyCityDefinition,
  type GirlsOnlyCitySlug,
} from "@/data/girls-only-cities";
import type { GirlsOnlyCityPageLabels } from "@/i18n/girls-only-city.types";

const sharedStatus = {
  available: "Beschikbaar",
  almostFull: "Bijna vol",
  soldOut: "Uitverkocht",
  closed: "Gesloten",
  new: "Nieuw",
} as const;

function buildCityPageNl(
  city: GirlsOnlyCityDefinition,
): GirlsOnlyCityPageLabels {
  const name = city.cityName;

  return {
    meta: {
      title: `Sunday Table in ${name} · MyTable`,
      description: `Sunday Table in ${name}. Elke eerste zondag. Nieuwe mensen. Daarna culinaire ervaringen.`,
    },
    breadcrumbHome: "Home",
    breadcrumbGirlsOnly: "Sunday Table",
    hero: {
      regionLabel: city.regionNl,
      headline: `Sunday Table in ${name}`,
      subheadline:
        "Elke eerste zondag. Nieuwe mensen. Daarna culinaire ervaringen.",
      trustBullets: ["Solo welkom", "Matching", "Daarna culinaire plannen"],
      ctaBook: "Claim je plek",
      ctaPriority: "Naar Sunday Table",
      imageAlt: `Sunday Table in ${name}`,
      seatsLeft: "{count} plekken over · {city} · {date}",
    },
    events: {
      eyebrow: "Agenda",
      title: `Tafels in ${name}`,
      subtitle: `Volgende Sunday Table in ${name}.`,
      emptyTitle: `Elke eerste zondag in ${name}`,
      emptyBody: "Claim je plek. Wij matchen je aan tafel.",
      emptyCta: "Naar Sunday Table",
      viewAll: "Alle zondagen",
    },
    priority: {
      eyebrow: "Sunday Table",
      title: `${name}`,
      subtitle: "Elke eerste zondag. Nieuwe mensen. Daarna culinaire ervaringen.",
      nameLabel: "Voornaam",
      namePlaceholder: "Je voornaam",
      emailLabel: "E-mail",
      emailPlaceholder: "jij@email.nl",
      cta: "Naar Sunday Table",
      success: "Je staat erop.",
      error: "Aanmelden mislukte. Probeer later opnieuw.",
      privacyNote: "Alleen updates over Sunday Table.",
    },
    included: {
      eyebrow: "Het aanbod",
      title: `Sunday Table in ${name}`,
      subtitle: "Elke eerste zondag. Nieuwe mensen. Culinaire plannen.",
      items: [
        {
          title: "Elke eerste zondag",
          description: "Vaste ritme. Elke maand.",
        },
        {
          title: "Nieuwe mensen",
          description: "Matching aan tafel. Solo welkom.",
        },
        {
          title: "Een drankje",
          description: "Consumpties op locatie.",
        },
        {
          title: "Daarna culinaire ervaringen",
          description: "Wine Walks, proeverijen, diners.",
        },
      ],
    },
    local: {
      eyebrow: name,
      title: `Sunday Table in ${name}`,
      body: city.localNl.body,
      points: [...city.localNl.points],
    },
    howItWorks: {
      eyebrow: "Het aanbod",
      title: `${name}`,
      steps: [
        {
          title: "Clubmember",
          description: "Toegang tot Sunday Table.",
        },
        {
          title: "Eerste zondag",
          description: "Nieuwe mensen. Matching.",
        },
        {
          title: "Daarna",
          description: "Samen culinaire ervaringen.",
        },
      ],
    },
    faq: {
      title: `FAQ · ${name}`,
      items: [
        {
          question: `Wat is Sunday Table in ${name}?`,
          answer:
            "Elke eerste zondag. Nieuwe mensen. Daarna culinaire ervaringen.",
        },
        {
          question: "Solo?",
          answer: "Ja. Solo is standaard.",
        },
        {
          question: `Waar in ${name}?`,
          answer: "Partnerlocatie. Adres na matching.",
        },
        {
          question: "Kosten?",
          answer:
            "Via Clubmember. Drank en hapjes op locatie. Culinaire tickets apart, 10% korting.",
        },
        {
          question: "Wanneer?",
          answer: "Elke eerste zondag van de maand.",
        },
        {
          question: "Dating?",
          answer: "Nee.",
        },
      ],
    },
    otherCities: {
      title: "Andere steden",
      subtitle: "Kies jouw stad.",
      nationalCta: "Alle steden",
    },
    finalCta: {
      title: `Sunday Table in ${name}`,
      subtitle: "Elke eerste zondag. Nieuwe mensen. Culinaire plannen.",
      ctaBook: "Claim je plek",
      ctaPriority: "Naar Sunday Table",
    },
    status: sharedStatus,
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserveer",
    viewTableCta: "Bekijk tafel",
    perPersonFrom: "vanaf",
    socialPromise: "Elke eerste zondag. Nieuwe mensen. Culinaire plannen.",
  };
}

export const girlsOnlyCityPagesNl = Object.fromEntries(
  GIRLS_ONLY_CITY_SLUGS.map((slug) => [
    slug,
    buildCityPageNl(GIRLS_ONLY_CITIES[slug]),
  ]),
) as Record<GirlsOnlyCitySlug, GirlsOnlyCityPageLabels>;

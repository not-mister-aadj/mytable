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
      title: `Girls-only wine tasting in ${enName}`,
      description: `Girls-only wine tasting in ${enName} on Sunday afternoon. Book solo or with friends. Four wines, bites, one table. No date? Priority list.`,
    },
    breadcrumbHome: "Home",
    breadcrumbGirlsOnly: "Girls-only",
    hero: {
      regionLabel: city.regionEn,
      headline: `Girls-only wine tasting in ${enName}`,
      subheadline: `Girls-only wine & bites in ${enName} without the hassle: you book, MyTable handles wine, bites, and a table of great women. Solo welcome. Friends get their own table.`,
      trustBullets: [
        `Solo welcome in ${enName}`,
        "Not dating",
        "25-45 · beginners OK",
      ],
      ctaBook: `See ${enName} tables`,
      ctaPriority: "Join priority list",
      imageAlt: `Women enjoying wine and bites at a girls-only afternoon in ${enName}`,
    },
    events: {
      eyebrow: "Agenda",
      title: `Upcoming girls-only tables in ${enName}`,
      subtitle: `Reserve your seat for the next girls-only Sunday in ${enName}.`,
      emptyTitle: `No girls-only table in ${enName} planned yet`,
      emptyBody: `New ${enName} Sundays open once the venue is set. Join the priority list. You’ll hear first.`,
      viewAll: "See all Sundays",
    },
    priority: {
      eyebrow: "Priority list",
      title: `Be first in line in ${enName}`,
      subtitle: `Leave your email. When a girls-only table opens in ${enName}, you’ll hear first, before the public agenda.`,
      nameLabel: "First name",
      namePlaceholder: "Your first name",
      emailLabel: "Email",
      emailPlaceholder: "you@email.com",
      cta: "Join the list",
      success: `You’re on the list. We’ll email you when ${enName} opens.`,
      error: "Sign-up failed. Please try again later.",
      privacyNote: "No spam. Only when a table opens in your city.",
    },
    included: {
      eyebrow: "What’s included",
      title: `Girls-only wine & bites in ${enName}`,
      subtitle: `Everything set for a Sunday afternoon in ${enName}: wine, bites, and the right table mix.`,
      items: [
        {
          title: "Four wines",
          description:
            "A guided tasting with context. Beginners and wine fans sit side by side.",
        },
        {
          title: "Paired bites",
          description:
            "Small plates that match the wines. Not a formal dinner, still delicious.",
        },
        {
          title: "Solo or with friends",
          description: `Solo? You’ll sit with other women in ${enName}. With friends? Reserve your own table.`,
        },
        {
          title: "One partner venue",
          description:
            "One restaurant, no city walk. Address and time arrive after booking.",
        },
      ],
    },
    local: {
      eyebrow: `About ${enName}`,
      title: `Looking for girls-only wine & bites in ${enName}`,
      body: city.localEn.body,
      points: [...city.localEn.points],
    },
    howItWorks: {
      eyebrow: "How it works",
      title: `Book a girls-only table in ${enName}`,
      steps: [
        {
          title: "Pick your Sunday",
          description: `Browse open tables in ${enName}, or join the priority list if no date is open yet.`,
        },
        {
          title: "Book solo or as a group",
          description:
            "Solo seats sit with other solos and duos. Friends get their own table.",
        },
        {
          title: "Show up and enjoy",
          description:
            "We handle wine, bites, and atmosphere. You enjoy an easy afternoon.",
        },
      ],
    },
    faq: {
      title: `FAQ about girls-only in ${enName}`,
      items: [
        {
          question: `What is a girls-only wine tasting in ${enName}?`,
          answer: `A Sunday afternoon with four wines, paired bites, and a table of women. MyTable handles the venue and seating in ${enName}. You book solo or with friends.`,
        },
        {
          question: `Can I book a girls-only table in ${enName} solo?`,
          answer:
            "Yes. Solo is the default. You’ll sit with other women who also came alone or as a duo, not with existing friend groups.",
        },
        {
          question: `Where in ${enName} does the tasting take place?`,
          answer: `At one partner restaurant in ${enName}. The city is on the table card. After booking we email the address, time, and practical details.`,
        },
        {
          question: `What does a girls-only table in ${enName} cost?`,
          answer:
            "The per-person price is on the table card and in checkout. It covers four wines, bites, and the guided afternoon. No hidden extras.",
        },
        {
          question: `What if no ${enName} date is open?`,
          answer: `Join the priority list. When we open a new girls-only Sunday in ${enName}, you get the first email, before the public agenda.`,
        },
        {
          question: `Is girls-only in ${enName} a dating event?`,
          answer:
            "No. It’s wine, bites, and an easy afternoon. No speed dating and no forced networking.",
        },
      ],
    },
    otherCities: {
      title: "Girls-only in other cities",
      subtitle: "Also live elsewhere in the Netherlands. Pick your city.",
      nationalCta: "View all cities",
    },
    finalCta: {
      title: `Ready for girls-only in ${enName}?`,
      subtitle: `Book an open table, or join the priority list for the next ${enName} Sunday.`,
      ctaBook: `See ${enName} tables`,
      ctaPriority: "Join priority list",
    },
    status: sharedStatus,
    femaleOnlyBadge: "Girls only",
    reserveCta: "Reserve",
    viewTableCta: "View table",
    perPersonFrom: "from",
    socialPromise:
      "Four wines, paired bites, one table. You book, we handle the rest.",
  };
}

export const girlsOnlyCityPagesEn: Record<
  GirlsOnlyCitySlug,
  GirlsOnlyCityPageLabels
> = Object.fromEntries(
  GIRLS_ONLY_CITY_SLUGS.map((slug) => [
    slug,
    buildCityPageEn(GIRLS_ONLY_CITIES[slug]),
  ]),
) as Record<GirlsOnlyCitySlug, GirlsOnlyCityPageLabels>;

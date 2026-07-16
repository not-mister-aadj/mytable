import type { ExperienceFaqItem, ExperienceItem } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import { experiencePath } from "@/i18n/config";
import { companyLegal } from "@/lib/company-legal";
import { absoluteImageUrl, absoluteUrl, getSeoSiteUrl } from "@/lib/seo/site";

export type JsonLd = Record<string, unknown>;

function orgId(): string {
  return `${getSeoSiteUrl()}/#organization`;
}

function websiteId(): string {
  return `${getSeoSiteUrl()}/#website`;
}

export function organizationJsonLd(): JsonLd {
  const site = getSeoSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": orgId(),
    name: companyLegal.tradeName,
    legalName: companyLegal.legalName,
    url: site,
    email: companyLegal.email,
    logo: absoluteUrl("/icon-192.png"),
    image: absoluteUrl("/girls-only/hero-poster.jpg"),
    sameAs: ["https://instagram.com/mytable.club"],
    address: {
      "@type": "PostalAddress",
      streetAddress: companyLegal.address.line1,
      postalCode: companyLegal.address.postalCode,
      addressLocality: companyLegal.address.city,
      addressCountry: "NL",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: companyLegal.email,
      availableLanguage: ["Dutch", "English"],
    },
  };
}

export function websiteJsonLd(locale: Locale): JsonLd {
  const site = getSeoSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(),
    url: site,
    name: "MyTable",
    alternateName: "MyTable Club",
    description:
      locale === "en"
        ? "Social wine tastings and chef's specials at one table across the Netherlands."
        : "Sociale wijnproeverijen en chef's specials aan één tafel door heel Nederland.",
    inLanguage: ["nl", "en"],
    publisher: { "@id": orgId() },
  };
}

export function faqPageJsonLd(
  items: ExperienceFaqItem[],
  pageUrl: string,
): JsonLd | null {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: pageUrl,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function eventStatus(experience: ExperienceItem): string {
  if (experience.status === "soldOut") {
    return "https://schema.org/EventSoldOut";
  }
  if (experience.status === "closed") {
    return "https://schema.org/EventCancelled";
  }
  return "https://schema.org/EventScheduled";
}

export function eventJsonLd(input: {
  experience: ExperienceItem & { slug: string };
  locale: Locale;
  description: string;
  venueName?: string;
  venueAddress?: string;
  endsAtIso?: string | null;
}): JsonLd {
  const { experience, locale, description, venueName, venueAddress, endsAtIso } =
    input;
  const url = absoluteUrl(experiencePath(locale, experience.slug));
  const image = absoluteImageUrl(experience.image);
  const remaining =
    experience.capacity != null && experience.spotsSold != null
      ? Math.max(0, experience.capacity - experience.spotsSold)
      : undefined;

  const locationName = venueName?.trim() || experience.city;
  const location: JsonLd = {
    "@type": "Place",
    name: locationName,
    address: {
      "@type": "PostalAddress",
      addressLocality: experience.city,
      addressCountry: "NL",
      ...(venueAddress ? { streetAddress: venueAddress } : {}),
    },
  };

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: experience.experienceName,
    description,
    url,
    ...(image ? { image: [image] } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: eventStatus(experience),
    ...(experience.startsAt ? { startDate: experience.startsAt } : {}),
    ...(endsAtIso ? { endDate: endsAtIso } : {}),
    location,
    organizer: {
      "@type": "Organization",
      "@id": orgId(),
      name: "MyTable",
      url: getSeoSiteUrl(),
    },
    offers: {
      "@type": "Offer",
      url,
      price: experience.price,
      priceCurrency: "EUR",
      availability:
        experience.status === "soldOut" || experience.status === "closed"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
    },
    ...(experience.capacity != null
      ? { maximumAttendeeCapacity: experience.capacity }
      : {}),
    ...(remaining != null ? { remainingAttendeeCapacity: remaining } : {}),
    isAccessibleForFree: false,
    inLanguage: locale === "en" ? "en" : "nl",
  };
}

export function itemListJsonLd(input: {
  name: string;
  description: string;
  pageUrl: string;
  items: { name: string; url: string; position: number }[];
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    description: input.description,
    url: input.pageUrl,
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  };
}

/** City landing page: Service + WebPage for local SEO. */
export function girlsOnlyCityJsonLd(input: {
  pageUrl: string;
  locale: Locale;
  cityName: string;
  region: string;
  title: string;
  description: string;
}): JsonLd[] {
  const { pageUrl, locale, cityName, region, title, description } = input;
  const inLanguage = locale === "en" ? "en" : "nl";

  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      inLanguage,
      isPartOf: { "@id": websiteId() },
      about: { "@id": `${pageUrl}#service` },
      breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: title,
      description,
      url: pageUrl,
      provider: { "@id": orgId() },
      serviceType:
        locale === "en"
          ? "Girls-only wine tasting"
          : "Girls-only wijnproeverij",
      areaServed: {
        "@type": "City",
        name: cityName,
        containedInPlace: {
          "@type": "AdministrativeArea",
          name: region,
        },
      },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceCurrency: "EUR",
        url: pageUrl,
      },
    },
  ];
}

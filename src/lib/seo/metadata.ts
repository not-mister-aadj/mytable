import type { Metadata } from "next";
import {
  agendaPath,
  experiencePath,
  girlsOnlyCityPath,
  localePath,
  privacyPath,
  termsPath,
  type Locale,
} from "@/i18n/config";
import { absoluteImageUrl, absoluteUrl } from "@/lib/seo/site";

export type SeoPathKind =
  | "home"
  | "agenda"
  | "girlsOnly"
  | "girlsOnlyCity"
  | "experience"
  | "privacy"
  | "terms";

function pathFor(kind: SeoPathKind, locale: Locale, slug?: string): string {
  switch (kind) {
    case "home":
    case "girlsOnly":
      return localePath(locale);
    case "agenda":
      return agendaPath(locale);
    case "girlsOnlyCity":
      if (!slug) throw new Error("girlsOnlyCity SEO path requires city slug");
      return girlsOnlyCityPath(locale, slug);
    case "experience":
      if (!slug) throw new Error("experience SEO path requires slug");
      return experiencePath(locale, slug);
    case "privacy":
      return privacyPath(locale);
    case "terms":
      return termsPath(locale);
  }
}

/** hreflang + canonical for NL (default) / EN pairs. */
export function localeAlternates(
  kind: SeoPathKind,
  locale: Locale,
  slug?: string,
): NonNullable<Metadata["alternates"]> {
  const nlPath = pathFor(kind, "nl", slug);
  const enPath = pathFor(kind, "en", slug);
  const canonicalPath = pathFor(kind, locale, slug);

  return {
    canonical: canonicalPath,
    languages: {
      nl: absoluteUrl(nlPath),
      en: absoluteUrl(enPath),
      "x-default": absoluteUrl(nlPath),
    },
  };
}

export function buildPageMetadata(input: {
  locale: Locale;
  kind: SeoPathKind;
  title: string;
  description: string;
  slug?: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const { locale, kind, title, description, slug, image, noIndex } = input;
  const url = absoluteUrl(pathFor(kind, locale, slug));
  const ogImage = absoluteImageUrl(image) ?? absoluteUrl("/girls-only/hero-poster.jpg");

  return {
    title,
    description,
    alternates: localeAlternates(kind, locale, slug),
    robots: noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_GB" : "nl_NL",
      alternateLocale: locale === "en" ? ["nl_NL"] : ["en_GB"],
      url,
      siteName: "MyTable",
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

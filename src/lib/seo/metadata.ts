import type { Metadata } from "next";
import {
  agendaPath,
  blogCategoryPath,
  blogPath,
  blogPostPath,
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
  | "blog"
  | "blogPost"
  | "blogCategory"
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
    case "blog":
      return blogPath(locale);
    case "blogPost":
      if (!slug) throw new Error("blogPost SEO path requires slug");
      return blogPostPath(locale, slug);
    case "blogCategory":
      if (!slug) throw new Error("blogCategory SEO path requires category");
      return blogCategoryPath(locale, slug);
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
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
  };
}): Metadata {
  const { locale, kind, title, description, slug, image, noIndex, article } =
    input;
  const url = absoluteUrl(pathFor(kind, locale, slug));
  const ogImage =
    absoluteImageUrl(image) ?? absoluteUrl("/girls-only/hero-poster.jpg");
  const isArticle = kind === "blogPost";

  return {
    title,
    description,
    alternates: localeAlternates(kind, locale, slug),
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: isArticle ? "article" : "website",
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
      ...(isArticle && article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime ?? article.publishedTime,
            authors: ["MyTable"],
            section: article.section,
            tags: article.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    ...(isArticle && article
      ? {
          other: {
            "article:published_time": article.publishedTime,
            "article:modified_time":
              article.modifiedTime ?? article.publishedTime,
            ...(article.section
              ? { "article:section": article.section }
              : {}),
          },
        }
      : {}),
  };
}

import type { MetadataRoute } from "next";
import {
  agendaPath,
  experiencePath,
  girlsOnlyPath,
  localePath,
  privacyPath,
  termsPath,
} from "@/i18n/config";
import { getAgendaExperiences } from "@/lib/experiences";
import {
  absoluteImageUrl,
  absoluteUrl,
  getSeoSiteUrl,
  sitemapXmlUrl,
} from "@/lib/seo/site";

/** Refresh when events publish / sell out. */
export const revalidate = 3600;

function sitemapImages(urls: Array<string | undefined | null>): string[] | undefined {
  const escaped = urls
    .filter((url): url is string => Boolean(url))
    .map(sitemapXmlUrl);
  return escaped.length ? escaped : undefined;
}

function localizedEntry(input: {
  nlPath: string;
  enPath: string;
  lastModified?: Date | string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  images?: string[];
}): MetadataRoute.Sitemap {
  const nlUrl = absoluteUrl(input.nlPath);
  const enUrl = absoluteUrl(input.enPath);
  const languages = { nl: nlUrl, en: enUrl, "x-default": nlUrl };
  const images = input.images ? sitemapImages(input.images) : undefined;

  return [
    {
      url: nlUrl,
      lastModified: input.lastModified,
      changeFrequency: input.changeFrequency,
      priority: input.priority,
      alternates: { languages },
      ...(images ? { images } : {}),
    },
    {
      url: enUrl,
      lastModified: input.lastModified,
      changeFrequency: input.changeFrequency,
      priority: Math.max(0.1, input.priority - 0.05),
      alternates: { languages },
      ...(images ? { images } : {}),
    },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Touch site URL so build fails loudly if misconfigured in logs
  getSeoSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = [
    ...localizedEntry({
      nlPath: localePath("nl"),
      enPath: localePath("en"),
      changeFrequency: "daily",
      priority: 1,
      images: [absoluteUrl("/girls-only/hero-poster.jpg")],
    }),
    ...localizedEntry({
      nlPath: girlsOnlyPath("nl"),
      enPath: girlsOnlyPath("en"),
      changeFrequency: "daily",
      priority: 0.98,
      images: [absoluteUrl("/girls-only/hero-poster.jpg")],
    }),
    ...localizedEntry({
      nlPath: agendaPath("nl"),
      enPath: agendaPath("en"),
      changeFrequency: "hourly",
      priority: 0.95,
    }),
    ...localizedEntry({
      nlPath: privacyPath("nl"),
      enPath: privacyPath("en"),
      changeFrequency: "yearly",
      priority: 0.2,
    }),
    ...localizedEntry({
      nlPath: termsPath("nl"),
      enPath: termsPath("en"),
      changeFrequency: "yearly",
      priority: 0.2,
    }),
  ];

  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    const experiences = await getAgendaExperiences("nl");
    eventEntries = experiences.flatMap((experience) => {
      if (!experience.slug) return [];
      const image = absoluteImageUrl(experience.image);
      const lastModified = experience.startsAt
        ? new Date(experience.startsAt)
        : new Date();
      const priority =
        experience.status === "soldOut" || experience.status === "closed"
          ? 0.4
          : experience.femaleOnly
            ? 0.9
            : 0.85;

      return localizedEntry({
        nlPath: experiencePath("nl", experience.slug),
        enPath: experiencePath("en", experience.slug),
        lastModified,
        changeFrequency: "daily",
        priority,
        images: image ? [image] : undefined,
      });
    });
  } catch (err) {
    console.error("[sitemap] failed to load events", err);
  }

  return [...staticEntries, ...eventEntries];
}

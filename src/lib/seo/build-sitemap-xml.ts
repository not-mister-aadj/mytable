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
} from "@/i18n/config";
import {
  BLOG_CATEGORY_ORDER,
  getBlogPostsSorted,
} from "@/data/blog";
import { listGirlsOnlyCities } from "@/data/girls-only-cities";
import { getAgendaExperiences } from "@/lib/experiences";
import { absoluteImageUrl, absoluteUrl, getSeoSiteUrl } from "@/lib/seo/site";

type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

type SitemapUrl = {
  loc: string;
  lastmod: string;
  changefreq: ChangeFreq;
  priority: number;
  images?: string[];
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Drop query strings so image URLs stay XML-safe and stable. */
function cleanImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.split("?")[0] ?? url;
  }
}

function toLastmod(value?: Date | string | null): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  // Seconds precision — widely accepted by Google/sitemap validators.
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function pair(input: {
  nlPath: string;
  enPath: string;
  changefreq: ChangeFreq;
  priority: number;
  lastmod?: Date | string | null;
  images?: string[];
}): SitemapUrl[] {
  const lastmod = toLastmod(input.lastmod);
  const images = input.images?.map(cleanImageUrl).filter(Boolean);

  return [
    {
      loc: absoluteUrl(input.nlPath),
      lastmod,
      changefreq: input.changefreq,
      priority: input.priority,
      images,
    },
    {
      loc: absoluteUrl(input.enPath),
      lastmod,
      changefreq: input.changefreq,
      priority: Math.max(0.1, Number((input.priority - 0.05).toFixed(2))),
      images,
    },
  ];
}

export async function collectSitemapUrls(): Promise<SitemapUrl[]> {
  getSeoSiteUrl();
  const now = new Date();

  const urls: SitemapUrl[] = [
    ...pair({
      nlPath: localePath("nl"),
      enPath: localePath("en"),
      changefreq: "daily",
      priority: 1,
      lastmod: now,
      images: [absoluteUrl("/girls-only/hero-poster.jpg")],
    }),
    ...listGirlsOnlyCities().flatMap((city) =>
      pair({
        nlPath: girlsOnlyCityPath("nl", city.slug),
        enPath: girlsOnlyCityPath("en", city.slug),
        changefreq: "daily",
        priority: 0.92,
        lastmod: now,
        images: [absoluteUrl(city.heroImage)],
      }),
    ),
    ...pair({
      nlPath: agendaPath("nl"),
      enPath: agendaPath("en"),
      changefreq: "daily",
      priority: 0.9,
      lastmod: now,
    }),
    ...pair({
      nlPath: blogPath("nl"),
      enPath: blogPath("en"),
      changefreq: "weekly",
      priority: 0.75,
      lastmod: now,
    }),
    ...BLOG_CATEGORY_ORDER.flatMap((category) =>
      pair({
        nlPath: blogCategoryPath("nl", category),
        enPath: blogCategoryPath("en", category),
        changefreq: "weekly",
        priority: 0.68,
        lastmod: now,
      }),
    ),
    ...getBlogPostsSorted().flatMap((post) =>
      pair({
        nlPath: blogPostPath("nl", post.slug),
        enPath: blogPostPath("en", post.slug),
        changefreq: "monthly",
        priority: post.featured ? 0.72 : 0.65,
        lastmod: post.updatedAt ?? post.publishedAt,
        images: [absoluteUrl(post.image)],
      }),
    ),
    ...pair({
      nlPath: privacyPath("nl"),
      enPath: privacyPath("en"),
      changefreq: "yearly",
      priority: 0.3,
      lastmod: now,
    }),
    ...pair({
      nlPath: termsPath("nl"),
      enPath: termsPath("en"),
      changefreq: "yearly",
      priority: 0.3,
      lastmod: now,
    }),
  ];

  try {
    const experiences = await getAgendaExperiences("nl");
    for (const experience of experiences) {
      if (!experience.slug) continue;
      const image = absoluteImageUrl(experience.image);
      const closed =
        experience.status === "soldOut" || experience.status === "closed";
      urls.push(
        ...pair({
          nlPath: experiencePath("nl", experience.slug),
          enPath: experiencePath("en", experience.slug),
          changefreq: "daily",
          priority: closed ? 0.4 : experience.femaleOnly ? 0.85 : 0.8,
          lastmod: experience.startsAt ?? now,
          images: image ? [image] : undefined,
        }),
      );
    }
  } catch (err) {
    console.error("[sitemap] failed to load events", err);
  }

  return urls;
}

/**
 * Match the browser-friendly format used by sites like glazenwasser.nl:
 * single-line urlset attrs, no xhtml:link (that namespace makes Chrome
 * render the file as HTML and hide the tags).
 * Hreflang stays on page metadata — that is the primary signal for Google.
 */
export function renderSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((entry) => {
      const parts = [`<url>`, `<loc>${escapeXml(entry.loc)}</loc>`];

      for (const image of entry.images ?? []) {
        parts.push(
          `<image:image>`,
          `<image:loc>${escapeXml(image)}</image:loc>`,
          `</image:image>`,
        );
      }

      parts.push(
        `<lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
        `<changefreq>${entry.changefreq}</changefreq>`,
        `<priority>${entry.priority}</priority>`,
        `</url>`,
      );

      return parts.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`;
}

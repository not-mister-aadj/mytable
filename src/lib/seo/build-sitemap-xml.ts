import {
  agendaPath,
  experiencePath,
  girlsOnlyPath,
  localePath,
  privacyPath,
  termsPath,
} from "@/i18n/config";
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
  alternates?: { nl: string; en: string };
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
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function pair(input: {
  nlPath: string;
  enPath: string;
  changefreq: ChangeFreq;
  priority: number;
  lastmod?: Date | string | null;
  images?: string[];
}): SitemapUrl[] {
  const nl = absoluteUrl(input.nlPath);
  const en = absoluteUrl(input.enPath);
  const lastmod = toLastmod(input.lastmod);
  const images = input.images?.map(cleanImageUrl).filter(Boolean);

  return [
    {
      loc: nl,
      lastmod,
      changefreq: input.changefreq,
      priority: input.priority,
      alternates: { nl, en },
      images,
    },
    {
      loc: en,
      lastmod,
      changefreq: input.changefreq,
      priority: Math.max(0.1, Number((input.priority - 0.05).toFixed(2))),
      alternates: { nl, en },
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
      changefreq: "weekly",
      priority: 1,
      lastmod: now,
      images: [absoluteUrl("/girls-only/hero-poster.jpg")],
    }),
    ...pair({
      nlPath: girlsOnlyPath("nl"),
      enPath: girlsOnlyPath("en"),
      changefreq: "daily",
      priority: 0.95,
      lastmod: now,
      images: [absoluteUrl("/girls-only/hero-poster.jpg")],
    }),
    ...pair({
      nlPath: agendaPath("nl"),
      enPath: agendaPath("en"),
      changefreq: "daily",
      priority: 0.9,
      lastmod: now,
    }),
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

export function renderSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((entry) => {
      const lines = [
        "  <url>",
        `    <loc>${escapeXml(entry.loc)}</loc>`,
      ];

      if (entry.alternates) {
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="nl" href="${escapeXml(entry.alternates.nl)}" />`,
          `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(entry.alternates.en)}" />`,
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(entry.alternates.nl)}" />`,
        );
      }

      for (const image of entry.images ?? []) {
        lines.push(
          "    <image:image>",
          `      <image:loc>${escapeXml(image)}</image:loc>`,
          "    </image:image>",
        );
      }

      lines.push(
        `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        "  </url>",
      );

      return lines.join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>
${body}
</urlset>
`;
}

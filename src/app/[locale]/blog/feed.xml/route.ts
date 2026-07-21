import {
  blogPosts,
  getBlogPostUpdatedAt,
  localizeBlogPost,
} from "@/data/blog";
import { blogPath, blogPostPath, isValidLocale } from "@/i18n/config";
import { absoluteImageUrl, absoluteUrl, getSeoSiteUrl } from "@/lib/seo/site";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(_request: Request, { params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    return new Response("Not found", { status: 404 });
  }

  const site = getSeoSiteUrl();
  const channelTitle =
    locale === "en" ? "MyTable blog" : "MyTable blog";
  const channelDesc =
    locale === "en"
      ? "Guides and tips for girls-only wine tastings"
      : "Gidsen en tips voor girls-only wijnproeverijen";

  const items = [...blogPosts]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .map((post) => {
      const local = localizeBlogPost(post, locale);
      const url = absoluteUrl(blogPostPath(locale, post.slug));
      const image = absoluteImageUrl(post.image) ?? absoluteUrl(post.image);
      const updated = getBlogPostUpdatedAt(post);
      return `
    <item>
      <title>${escapeXml(local.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(local.metaDescription)}</description>
      <pubDate>${new Date(`${post.publishedAt}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${escapeXml(local.categoryLabel)}</category>
      <enclosure url="${escapeXml(image)}" type="image/jpeg" />
      <source url="${escapeXml(absoluteUrl(blogPath(locale)))}">${escapeXml(channelTitle)}</source>
      <atom:updated>${escapeXml(`${updated}T12:00:00Z`)}</atom:updated>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(absoluteUrl(blogPath(locale)))}</link>
    <description>${escapeXml(channelDesc)}</description>
    <language>${locale === "en" ? "en-GB" : "nl-NL"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(absoluteUrl(`${blogPath(locale)}/feed.xml`))}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(absoluteUrl("/icon-192.png"))}</url>
      <title>${escapeXml(channelTitle)}</title>
      <link>${escapeXml(site)}</link>
    </image>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

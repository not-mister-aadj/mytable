import {
  collectSitemapUrls,
  renderSitemapXml,
} from "@/lib/seo/build-sitemap-xml";

/** Shared sitemap response used by /sitemap and /sitemap.xml */
export async function getSitemapResponse(): Promise<Response> {
  const urls = await collectSitemapUrls();
  const xml = renderSitemapXml(urls);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Avoid Content-Disposition filename quirks that confuse some crawlers.
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import {
  collectSitemapUrls,
  renderSitemapXml,
} from "@/lib/seo/build-sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  const urls = await collectSitemapUrls();
  const xml = renderSitemapXml(urls);

  return new Response(xml, {
    headers: {
      // Google expects application/xml; charset helps parsers and GSC.
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

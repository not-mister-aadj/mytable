import { getSitemapResponse } from "@/lib/seo/sitemap-response";

export const revalidate = 3600;

/** Extensionless sitemap URL — more reliable for Google Search Console on Vercel/Next. */
export async function GET() {
  return getSitemapResponse();
}

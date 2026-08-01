import type { MetadataRoute } from "next";
import { getSeoSiteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const site = getSeoSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/api/",
          "/boeking/bevestigd",
          "/boeking/geannuleerd",
          "/en/boeking/bevestigd",
          "/en/boeking/geannuleerd",
          "/nl/",
        ],
      },
    ],
    sitemap: [`${site}/sitemap`, `${site}/sitemap.xml`],
    host: site.replace(/^https?:\/\//, ""),
  };
}

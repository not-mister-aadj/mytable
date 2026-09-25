import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    // Next.js 16 defaults to only allowing quality 75. The homepage hero
    // gallery and format cards use 90 for less visible compression on
    // detailed photos — without listing it here, that prop is silently
    // coerced back down to 75.
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/sitemap",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
          {
            key: "Content-Disposition",
            value: "inline",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
          {
            key: "Content-Disposition",
            value: "inline",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
  async redirects() {
    // City pages moved from /girls-only to /sunday-table. The slug pattern
    // only matches plain slugs, so the /girls-only/*.jpg images keep working.
    return [
      {
        source: "/girls-only/:city([a-z-]+)",
        destination: "/sunday-table/:city",
        permanent: true,
      },
      {
        source: "/:locale(en|nl)/girls-only/:city([a-z-]+)",
        destination: "/:locale/sunday-table/:city",
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Avoid ad-blockers blocking error reports
  tunnelRoute: "/monitoring",
});

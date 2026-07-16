import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/girls-only",
        destination: "/",
        permanent: true,
      },
      {
        source: "/en/girls-only",
        destination: "/en",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

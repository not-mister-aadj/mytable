import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ForceLightAppearance } from "@/components/ForceLightAppearance";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://www.mytable.club";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MyTable",
  authors: [{ name: "MyTable", url: siteUrl }],
  creator: "MyTable",
  publisher: "MyTable",
  category: "food",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "MyTable",
    locale: "nl_NL",
    alternateLocale: ["en_GB"],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#f7f1e8" },
  ],
};

// Fonts live in the repo (src/app/fonts, OFL), so a build never depends on Google Fonts.
const cormorant = localFont({
  variable: "--font-cormorant",
  display: "swap",
  src: [
    { path: "./fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
});

const dmSans = localFont({
  variable: "--font-dm-sans",
  display: "swap",
  src: [
    { path: "./fonts/dm-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/dm-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/dm-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      data-color-mode="light"
      className={`${cormorant.variable} ${dmSans.variable} bg-cream text-wine`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="light only" />
      </head>
      <body
        className="min-h-screen bg-cream font-sans text-wine antialiased"
        suppressHydrationWarning
      >
        <ForceLightAppearance />
        {children}
      </body>
    </html>
  );
}

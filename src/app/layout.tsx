import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
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

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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

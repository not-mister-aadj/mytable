import type { Metadata } from "next";
import {
  guardLegalPage,
  LegalPage,
} from "@/components/legal/LegalPage";
import { isValidLocale } from "@/i18n/config";
import { getLegalDocument } from "@/i18n/get-legal-document";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const document = getLegalDocument(locale, "privacy");
  return buildPageMetadata({
    locale,
    kind: "privacy",
    title: `${document.metaTitle} | MyTable`,
    description:
      locale === "en"
        ? "Privacy policy for MyTable bookings, website and marketing communications."
        : "Privacybeleid van MyTable voor boekingen, website en marketingcommunicatie.",
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = guardLegalPage(locale, "privacy");
  return <LegalPage locale={validLocale} kind="privacy" />;
}

import type { Metadata } from "next";
import {
  guardLegalPage,
  LegalPage,
} from "@/components/legal/LegalPage";
import { isValidLocale } from "@/i18n/config";
import { getLegalDocument } from "@/i18n/get-legal-document";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const document = getLegalDocument(locale, "privacy");
  return { title: document.metaTitle };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = guardLegalPage(locale, "privacy");
  return <LegalPage locale={validLocale} kind="privacy" />;
}

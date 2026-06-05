import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  guardLegalPage,
  LegalPage,
} from "@/components/legal/LegalPage";
import { getLegalDocument } from "@/i18n/get-legal-document";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "en") return {};
  const document = getLegalDocument("en", "terms");
  return { title: document.metaTitle };
}

export default async function TermsEnPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "en") notFound();
  guardLegalPage(locale, "terms");
  return <LegalPage locale="en" kind="terms" />;
}

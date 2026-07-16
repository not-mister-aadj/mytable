import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  guardLegalPage,
  LegalPage,
} from "@/components/legal/LegalPage";
import { getLegalDocument } from "@/i18n/get-legal-document";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== "nl") return {};
  const document = getLegalDocument("nl", "terms");
  return buildPageMetadata({
    locale: "nl",
    kind: "terms",
    title: `${document.metaTitle} | MyTable`,
    description:
      "Algemene voorwaarden voor boekingen en deelname aan MyTable-ervaringen.",
  });
}

export default async function TermsNlPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== "nl") notFound();
  guardLegalPage(locale, "terms");
  return <LegalPage locale="nl" kind="terms" />;
}

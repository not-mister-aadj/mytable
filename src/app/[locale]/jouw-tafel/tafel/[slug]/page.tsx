import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelTablePage, jouwTafelTableMetadata } from "@/components/jouw-tafel/JouwTafelTablePages";
import { isValidLocale, type Locale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return jouwTafelTableMetadata(locale as Locale);
}

/** The table page after Kies je zondag. English: /en/your-table/table/{slug}. */
export default async function JouwTafelTableRoute({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelTablePage locale={locale as Locale} slug={slug} />;
}

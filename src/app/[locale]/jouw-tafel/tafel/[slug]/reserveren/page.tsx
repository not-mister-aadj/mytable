import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelReservePage, jouwTafelReserveMetadata } from "@/components/jouw-tafel/JouwTafelTablePages";
import { isValidLocale, type Locale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return jouwTafelReserveMetadata(locale as Locale);
}

/** Reserveren for a table. English: /en/your-table/table/{slug}/reserve. */
export default async function JouwTafelReserveRoute({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelReservePage locale={locale as Locale} slug={slug} />;
}

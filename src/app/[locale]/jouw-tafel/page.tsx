import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelPage, jouwTafelMetadata } from "@/components/jouw-tafel/JouwTafelPage";
import { isValidLocale, type Locale } from "@/i18n/config";

/** Upcoming tables and list stats are cached in getJouwTafelData; the page
 * HTML follows within five minutes (sooner when a sale revalidates it). */
export const revalidate = 300;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return jouwTafelMetadata(locale as Locale);
}

/** Dutch at /jouw-tafel. /en/jouw-tafel also works (in English), so a
 * hand-typed English link never 404s; the English URL is /en/your-table. */
export default async function JouwTafelRoute({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelPage locale={locale as Locale} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelQuizPage, jouwTafelQuizMetadata } from "@/components/jouw-tafel/JouwTafelQuizPage";
import { isValidLocale, type Locale } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return jouwTafelQuizMetadata(locale as Locale);
}

/** The quiz after signing up or logging in from /jouw-tafel, ending at
 * "Kies je zondag". The English URL is /en/your-table/start. */
export default async function JouwTafelStartRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelQuizPage locale={locale as Locale} searchParams={await searchParams} />;
}

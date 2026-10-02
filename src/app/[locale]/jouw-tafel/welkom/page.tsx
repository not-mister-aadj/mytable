import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  JouwTafelWelcomePage,
  jouwTafelWelcomeMetadata,
} from "@/components/jouw-tafel/JouwTafelAccountPages";
import { isValidLocale, type Locale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return jouwTafelWelcomeMetadata(locale as Locale);
}

/** After signing up or logging in from /jouw-tafel. The English URL is
 * /en/your-table/welcome. */
export default async function JouwTafelWelcomeRoute({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelWelcomePage locale={locale as Locale} />;
}

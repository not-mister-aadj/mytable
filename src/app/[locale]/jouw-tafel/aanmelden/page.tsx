import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  JouwTafelPlaceholderPage,
  jouwTafelPlaceholderMetadata,
} from "@/components/jouw-tafel/JouwTafelPage";
import { isValidLocale, type Locale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return jouwTafelPlaceholderMetadata(locale as Locale, "signup");
}

/** "Aanmelden" from /jouw-tafel. Placeholder until accounts exist; the
 * English URL is /en/your-table/sign-up. */
export default async function JouwTafelSignUpRoute({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelPlaceholderPage locale={locale as Locale} kind="signup" />;
}

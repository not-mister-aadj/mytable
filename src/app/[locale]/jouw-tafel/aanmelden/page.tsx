import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  JouwTafelAuthPage,
  jouwTafelAuthMetadata,
  type AccountSearchParams,
} from "@/components/jouw-tafel/JouwTafelAccountPages";
import { isValidLocale, type Locale } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<AccountSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return jouwTafelAuthMetadata(locale as Locale, "signup");
}

/** "Aanmelden" from /jouw-tafel: email + 6-digit code (and Google in normal
 * browsers). The English URL is /en/your-table/sign-up. */
export default async function JouwTafelSignUpRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelAuthPage locale={locale as Locale} screen="signup" searchParams={await searchParams} />;
}

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
  return jouwTafelAuthMetadata(locale as Locale, "login");
}

/** "Inloggen" from /jouw-tafel. The English URL is /en/your-table/log-in. */
export default async function JouwTafelLogInRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelAuthPage locale={locale as Locale} screen="login" searchParams={await searchParams} />;
}

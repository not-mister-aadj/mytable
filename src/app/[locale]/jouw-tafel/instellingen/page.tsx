import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelSettingsPage, jouwTafelSettingsMetadata } from "@/components/jouw-tafel/JouwTafelSettingsPage";
import { isValidLocale, type Locale } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return jouwTafelSettingsMetadata(locale as Locale);
}

/** Settings for members. The English URL is /en/your-table/settings. */
export default async function JouwTafelSettingsRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelSettingsPage locale={locale as Locale} searchParams={await searchParams} />;
}

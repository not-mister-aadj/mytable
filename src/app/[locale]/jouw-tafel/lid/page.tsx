import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JouwTafelMembershipPage, jouwTafelMembershipMetadata } from "@/components/jouw-tafel/JouwTafelMembershipPage";
import { isValidLocale, type Locale } from "@/i18n/config";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  return jouwTafelMembershipMetadata(locale as Locale);
}

/** The membership page. The English URL is /en/your-table/membership. */
export default async function JouwTafelMembershipRoute({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <JouwTafelMembershipPage locale={locale as Locale} searchParams={await searchParams} />;
}

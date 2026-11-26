import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MakersView } from "@/components/makers/MakersView";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { makerCopy } from "@/lib/makers/copy";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

/** Only linked from the footer: kept out of search. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const t = makerCopy(locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: "makers",
    title: t.metaTitle,
    description: t.metaDescription,
    image: "/girls-only/phone-moment.jpg",
    noIndex: true,
  });
}

export default async function MakersPage({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const dict = getDictionary(locale);
  return <MakersView locale={locale} headerDict={dict.header} footerDict={dict.footer} />;
}

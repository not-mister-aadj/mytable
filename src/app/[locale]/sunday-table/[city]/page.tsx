import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SundayTableLpView } from "@/components/sunday-table-lp/SundayTableLpView";
import {
  clubmemberPath,
  isValidLocale,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { fillCity, getSundayTableLpLabels } from "@/i18n/get-sunday-table-lp";
import {
  sundayTableLpCityFromSlug,
  SUNDAY_TABLE_LP_CITIES,
} from "@/data/sunday-table-lp-cities";
import { getMemberUser } from "@/lib/member-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

export function generateStaticParams() {
  return ["nl", "en"].flatMap((locale) =>
    SUNDAY_TABLE_LP_CITIES.map((city) => ({
      locale,
      city: city.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug } = await params;
  if (!isValidLocale(locale)) return {};
  const city = sundayTableLpCityFromSlug(citySlug);
  if (!city) return {};
  const labels = getSundayTableLpLabels(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: "sundayTableLpCity",
    slug: city.slug,
    title: fillCity(labels.meta.titleCity, city.name),
    description: fillCity(labels.meta.descriptionCity, city.name),
    image: "/girls-only/table-group.jpg",
  });
}

export default async function SundayTableLpCityPage({ params }: Props) {
  const { locale: localeParam, city: citySlug } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const city = sundayTableLpCityFromSlug(citySlug);
  if (!city) notFound();

  const user = await getMemberUser();
  if (user) {
    redirect(clubmemberPath(locale));
  }

  const dict = getDictionary(locale);
  const labels = getSundayTableLpLabels(locale);

  return (
    <SundayTableLpView
      locale={locale}
      labels={labels}
      headerDict={dict.header}
      footerDict={dict.footer}
      cityName={city.name}
      citySlug={city.slug}
    />
  );
}

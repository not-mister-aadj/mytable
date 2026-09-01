import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormatLandingView } from "@/components/format-lp/FormatLandingView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  FORMAT_LP_CITY_SLUGS,
  formatLpCityFromSlug,
  formatLpCityRegion,
} from "@/data/format-lp-cities";
import {
  chefsSpecialLpCityPath,
  chefsSpecialLpPath,
  isValidLocale,
  localePath,
  type Locale,
} from "@/i18n/config";
import { fillCity } from "@/i18n/get-sunday-table-lp";
import { getDictionary } from "@/i18n/get-dictionary";
import { getChefsSpecialLpLabels } from "@/i18n/get-format-lp";
import {
  breadcrumbJsonLd,
  experienceCityJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

export function generateStaticParams() {
  return ["nl", "en"].flatMap((locale) =>
    FORMAT_LP_CITY_SLUGS.map((city) => ({ locale, city })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug } = await params;
  if (!isValidLocale(locale)) return {};
  const city = formatLpCityFromSlug(citySlug);
  if (!city) return {};
  const labels = getChefsSpecialLpLabels(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: "chefsSpecialLpCity",
    slug: city.slug,
    title: fillCity(labels.meta.titleCity ?? labels.meta.title, city.cityName),
    description: fillCity(
      labels.meta.descriptionCity ?? labels.meta.description,
      city.cityName,
    ),
    image: city.heroImage,
  });
}

export default async function ChefsSpecialLpCityPage({ params }: Props) {
  const { locale: localeParam, city: citySlug } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const city = formatLpCityFromSlug(citySlug);
  if (!city) notFound();

  const dict = getDictionary(locale);
  const labels = getChefsSpecialLpLabels(locale);
  const pageUrl = absoluteUrl(chefsSpecialLpCityPath(locale, city.slug));
  const title = fillCity(labels.meta.titleCity ?? labels.meta.title, city.cityName);
  const description = fillCity(
    labels.meta.descriptionCity ?? labels.meta.description,
    city.cityName,
  );

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(locale),
          ...experienceCityJsonLd({
            pageUrl,
            locale,
            cityName: city.cityName,
            region: formatLpCityRegion(city.slug, locale),
            title,
            description,
            serviceType: locale === "en" ? "Chef's table dinner" : "Chef's Table diner",
          }),
          breadcrumbJsonLd(pageUrl, [
            { name: "Home", path: localePath(locale) },
            { name: labels.meta.title, path: chefsSpecialLpPath(locale) },
            { name: city.cityName, path: chefsSpecialLpCityPath(locale, city.slug) },
          ]),
        ]}
      />
      <FormatLandingView
        locale={locale}
        labels={labels}
        headerDict={dict.header}
        footerDict={dict.footer}
        waitlistInterest="chefs_special"
        cityName={city.cityName}
      />
    </>
  );
}

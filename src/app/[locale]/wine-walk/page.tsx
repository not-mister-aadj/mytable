import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormatLandingView } from "@/components/format-lp/FormatLandingView";
import { JsonLd } from "@/components/seo/JsonLd";
import { listFormatLpCities } from "@/data/format-lp-cities";
import {
  isValidLocale,
  localePath,
  wineWalkLpCityPath,
  wineWalkLpPath,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getWineWalkLpLabels } from "@/i18n/get-format-lp";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const labels = getWineWalkLpLabels(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: "wineWalkLp",
    title: labels.meta.title,
    description: labels.meta.description,
    image: "/girls-only/duo-table.jpg",
  });
}

export default async function WineWalkLpPage({ params }: Props) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const dict = getDictionary(locale);
  const labels = getWineWalkLpLabels(locale);
  const pageUrl = absoluteUrl(wineWalkLpPath(locale));
  const cities = listFormatLpCities().map((city) => ({
    slug: city.slug,
    name: city.cityName,
    href: wineWalkLpCityPath(locale, city.slug),
  }));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(locale),
          faqPageJsonLd(labels.faq.items, pageUrl),
          breadcrumbJsonLd(pageUrl, [
            { name: "Home", path: localePath(locale) },
            { name: labels.meta.title, path: wineWalkLpPath(locale) },
          ]),
        ]}
      />
      <FormatLandingView
        locale={locale}
        labels={labels}
        headerDict={dict.header}
        footerDict={dict.footer}
        waitlistInterest="wine_walk"
        cities={cities}
      />
    </>
  );
}

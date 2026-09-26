import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SundayTableCityView } from "@/components/sunday-table-lp/SundayTableCityView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  isValidLocale,
  localePath,
  sundayTableLpCityPath,
  sundayTableLpPath,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  fillCity,
  getSundayTableCityLabels,
  getSundayTableLpLabels,
} from "@/i18n/get-sunday-table-lp";
import {
  sundayTableLpCityFromSlug,
  SUNDAY_TABLE_LP_CITIES,
} from "@/data/sunday-table-lp-cities";
import {
  getUpcomingSundayTableDates,
  nextBookablePerBracket,
} from "@/lib/sunday-table-city-dates";
import { getGirlsOnlyCity, listGirlsOnlyCities } from "@/data/girls-only-cities";
import {
  GirlsOnlyCityPage,
  girlsOnlyCityMetadata,
} from "@/components/girls-only/GirlsOnlyCityPage";
import {
  breadcrumbJsonLd,
  experienceCityJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

/** Cities with a full Sunday Table landing page get that page; every other
 * city gets the lighter city SEO page. */
function seoOnlyCity(citySlug: string) {
  return sundayTableLpCityFromSlug(citySlug) ? undefined : getGirlsOnlyCity(citySlug);
}

/** English copy says "The Hague"; the database and URLs keep "Den Haag". */
function cityDisplayName(name: string, locale: Locale): string {
  return locale === "en" && name === "Den Haag" ? "The Hague" : name;
}

export function generateStaticParams() {
  const slugs = new Set([
    ...SUNDAY_TABLE_LP_CITIES.map((city) => city.slug),
    ...listGirlsOnlyCities().map((city) => city.slug),
  ]);
  return ["nl", "en"].flatMap((locale) =>
    [...slugs].map((city) => ({ locale, city })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug } = await params;
  if (!isValidLocale(locale)) return {};
  const seoCity = seoOnlyCity(citySlug);
  if (seoCity) return girlsOnlyCityMetadata(seoCity, locale as Locale);
  const city = sundayTableLpCityFromSlug(citySlug);
  if (!city) return {};
  const labels = getSundayTableLpLabels(locale as Locale);
  const cityName = cityDisplayName(city.name, locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: "sundayTableLpCity",
    slug: city.slug,
    title: fillCity(labels.meta.titleCity, cityName),
    description: fillCity(labels.meta.descriptionCity, cityName),
    image: "/girls-only/table-group.jpg",
  });
}

export default async function SundayTableLpCityPage({ params }: Props) {
  const { locale: localeParam, city: citySlug } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const seoCity = seoOnlyCity(citySlug);
  if (seoCity) return <GirlsOnlyCityPage city={seoCity} locale={locale} />;
  const city = sundayTableLpCityFromSlug(citySlug);
  if (!city) notFound();

  // Keeping this page free of cookies()/auth reads is what lets it stay
  // statically prerendered (ISR) instead of rendering on every request.
  const dict = getDictionary(locale);
  const labels = getSundayTableLpLabels(locale);
  const cityLabels = getSundayTableCityLabels(locale);
  const cityName = cityDisplayName(city.name, locale);
  const pageUrl = absoluteUrl(sundayTableLpCityPath(locale, city.slug));
  const title = fillCity(labels.meta.titleCity, cityName);
  const description = fillCity(labels.meta.descriptionCity, cityName);
  // Both current Sunday Table cities sit in the same province; add a real
  // per-city region lookup here if this list grows beyond Zuid-Holland.
  const region = locale === "en" ? "South Holland" : "Zuid-Holland";
  const dates = await getUpcomingSundayTableDates(city.name, city.slug, locale);
  const faqItems = cityLabels.faq.items.map((item) => ({
    question: item.question,
    answer: fillCity(item.answer, cityName),
  }));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(locale),
          ...experienceCityJsonLd({
            pageUrl,
            locale,
            cityName,
            region,
            title,
            description,
            serviceType: locale === "en" ? "Recurring social dinner" : "Terugkerend sociaal diner",
          }),
          faqPageJsonLd(faqItems, pageUrl),
          breadcrumbJsonLd(pageUrl, [
            { name: "Home", path: localePath(locale) },
            { name: "Sunday Table", path: sundayTableLpPath(locale) },
            { name: cityName, path: sundayTableLpCityPath(locale, city.slug) },
          ]),
        ]}
      />
      <SundayTableCityView
        locale={locale}
        lpLabels={labels}
        labels={cityLabels}
        headerDict={dict.header}
        footerDict={dict.footer}
        cityName={cityName}
        citySlug={city.slug}
        dates={dates}
        nextTables={nextBookablePerBracket(dates)}
      />
    </>
  );
}

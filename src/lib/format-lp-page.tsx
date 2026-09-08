import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormatLandingView } from "@/components/format-lp/FormatLandingView";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  FORMAT_LP_CITY_SLUGS,
  formatLpCityFromSlug,
  formatLpCityRegion,
  listFormatLpCities,
} from "@/data/format-lp-cities";
import { isValidLocale, localePath, type Locale } from "@/i18n/config";
import { fillCity } from "@/i18n/get-sunday-table-lp";
import { getDictionary } from "@/i18n/get-dictionary";
import type { FormatLpLabels } from "@/i18n/format-lp.types";
import type { WaitlistInterestId } from "@/i18n/waitlist-page.types";
import {
  breadcrumbJsonLd,
  experienceCityJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata, type SeoPathKind } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";

/** Everything that differs between wine-tasting / wine-walk / chefs-special —
 * the base + city route pages for each are otherwise identical, so this one
 * config drives both `generateMetadata` and the rendered page for both. */
export type FormatLpPageConfig = {
  getLabels: (locale: Locale) => FormatLpLabels;
  path: (locale: Locale) => string;
  cityPath: (locale: Locale, citySlug: string) => string;
  metadataKind: SeoPathKind;
  metadataCityKind: SeoPathKind;
  image: string;
  waitlistInterest: WaitlistInterestId;
  serviceType: (locale: Locale) => string;
};

export function formatLpStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export function formatLpCityStaticParams() {
  return ["nl", "en"].flatMap((locale) =>
    FORMAT_LP_CITY_SLUGS.map((city) => ({ locale, city })),
  );
}

export async function buildFormatLpMetadata(
  config: FormatLpPageConfig,
  params: Promise<{ locale: string }>,
): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const labels = config.getLabels(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: config.metadataKind,
    title: labels.meta.title,
    description: labels.meta.description,
    image: config.image,
  });
}

export async function renderFormatLpPage(
  config: FormatLpPageConfig,
  params: Promise<{ locale: string }>,
) {
  const { locale: localeParam } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;

  const dict = getDictionary(locale);
  const labels = config.getLabels(locale);
  const pageUrl = absoluteUrl(config.path(locale));
  const cities = listFormatLpCities().map((city) => ({
    slug: city.slug,
    name: city.cityName,
    href: config.cityPath(locale, city.slug),
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
            { name: labels.meta.title, path: config.path(locale) },
          ]),
        ]}
      />
      <FormatLandingView
        locale={locale}
        labels={labels}
        headerDict={dict.header}
        footerDict={dict.footer}
        waitlistInterest={config.waitlistInterest}
        cities={cities}
      />
    </>
  );
}

export async function buildFormatLpCityMetadata(
  config: FormatLpPageConfig,
  params: Promise<{ locale: string; city: string }>,
): Promise<Metadata> {
  const { locale, city: citySlug } = await params;
  if (!isValidLocale(locale)) return {};
  const city = formatLpCityFromSlug(citySlug);
  if (!city) return {};
  const labels = config.getLabels(locale as Locale);
  return buildPageMetadata({
    locale: locale as Locale,
    kind: config.metadataCityKind,
    slug: city.slug,
    title: fillCity(labels.meta.titleCity ?? labels.meta.title, city.cityName),
    description: fillCity(
      labels.meta.descriptionCity ?? labels.meta.description,
      city.cityName,
    ),
    image: city.heroImage,
  });
}

export async function renderFormatLpCityPage(
  config: FormatLpPageConfig,
  params: Promise<{ locale: string; city: string }>,
) {
  const { locale: localeParam, city: citySlug } = await params;
  if (!isValidLocale(localeParam)) notFound();
  const locale = localeParam as Locale;
  const city = formatLpCityFromSlug(citySlug);
  if (!city) notFound();

  const dict = getDictionary(locale);
  const labels = config.getLabels(locale);
  const pageUrl = absoluteUrl(config.cityPath(locale, city.slug));
  const title = fillCity(labels.meta.titleCity ?? labels.meta.title, city.cityName);
  const description = fillCity(
    labels.meta.descriptionCity ?? labels.meta.description,
    city.cityName,
  );
  const cities = listFormatLpCities().map((c) => ({
    slug: c.slug,
    name: c.cityName,
    href: config.cityPath(locale, c.slug),
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
            cityName: city.cityName,
            region: formatLpCityRegion(city.slug, locale),
            title,
            description,
            serviceType: config.serviceType(locale),
          }),
          faqPageJsonLd(labels.faq.items, pageUrl),
          breadcrumbJsonLd(pageUrl, [
            { name: "Home", path: localePath(locale) },
            { name: labels.meta.title, path: config.path(locale) },
            { name: city.cityName, path: config.cityPath(locale, city.slug) },
          ]),
        ]}
      />
      <FormatLandingView
        locale={locale}
        labels={labels}
        headerDict={dict.header}
        footerDict={dict.footer}
        waitlistInterest={config.waitlistInterest}
        cityName={city.cityName}
        citySlug={city.slug}
        cities={cities}
        formatBasePath={config.path(locale)}
      />
    </>
  );
}

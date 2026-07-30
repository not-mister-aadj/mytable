import { Footer } from "@/components/Footer";
import { GirlsOnlyCityView } from "@/components/girls-only/GirlsOnlyCityView";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  GIRLS_ONLY_CITY_SLUGS,
  getGirlsOnlyCity,
  girlsOnlyCityDisplayRegion,
  isGirlsOnlyCitySlug,
  type GirlsOnlyCitySlug,
} from "@/data/girls-only-cities";
import {
  agendaPath,
  girlsOnlyCityPath,
  isValidLocale,
  type Locale,
} from "@/i18n/config";
import { getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import {
  cityHasBookableGirlsOnlyEvent,
  getGirlsOnlyCityLabels,
  getUpcomingGirlsOnlyCityEvents,
} from "@/lib/girls-only-city";
import { getSundayTableSeatStats } from "@/lib/sunday-table-capacity";
import {
  amsterdamDateIso,
  getUpcomingSundayWineTables,
} from "@/lib/sunday-wine-table";
import {
  breadcrumbJsonLd,
  faqPageJsonLd,
  girlsOnlyCityJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

export async function generateStaticParams() {
  const locales: Locale[] = ["nl", "en"];
  return locales.flatMap((locale) =>
    GIRLS_ONLY_CITY_SLUGS.map((city) => ({ locale, city })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug } = await params;
  if (!isValidLocale(locale) || !isGirlsOnlyCitySlug(citySlug)) return {};
  const city = getGirlsOnlyCity(citySlug)!;
  const labels = getGirlsOnlyCityLabels(citySlug, locale);
  return buildPageMetadata({
    locale,
    kind: "girlsOnlyCity",
    slug: city.slug,
    title: `${labels.meta.title} | MyTable`,
    description: labels.meta.description,
    image: city.heroImage,
  });
}

export default async function GirlsOnlyCityPage({ params }: Props) {
  const { locale, city: citySlug } = await params;
  if (!isValidLocale(locale) || !isGirlsOnlyCitySlug(citySlug)) notFound();

  const city = getGirlsOnlyCity(citySlug as GirlsOnlyCitySlug)!;
  const labels = getGirlsOnlyCityLabels(city.slug, locale);
  const dict = await getDictionaryWithAgenda(locale);
  const events = getUpcomingGirlsOnlyCityEvents(
    dict.agenda.items,
    locale,
    city.cityName,
    6,
  );
  const hasBookable = cityHasBookableGirlsOnlyEvent(events);
  const pageUrl = absoluteUrl(girlsOnlyCityPath(locale, city.slug));
  const agendaHref = agendaPath(locale);
  const region = girlsOnlyCityDisplayRegion(city, locale);

  const upcomingSunday = getUpcomingSundayWineTables(1)[0] ?? null;
  const tableDate = upcomingSunday ? amsterdamDateIso(upcomingSunday) : null;
  let sundayScarcity: { seatsLeft: number; dateLabel: string } | null = null;
  if (tableDate && upcomingSunday) {
    const [mixed, girls] = await Promise.all([
      getSundayTableSeatStats({
        city: city.cityName,
        tableDate,
        tableType: "mixed",
      }),
      getSundayTableSeatStats({
        city: city.cityName,
        tableDate,
        tableType: "girls_only",
      }),
    ]);
    const seatsLeft = Math.max(mixed.seatsLeft, girls.seatsLeft);
    const dateLabel = upcomingSunday.toLocaleDateString(
      locale === "en" ? "en-GB" : "nl-NL",
      {
        day: "numeric",
        month: "short",
        timeZone: "Europe/Amsterdam",
      },
    );
    sundayScarcity = { seatsLeft, dateLabel };
  }

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(locale),
          ...girlsOnlyCityJsonLd({
            pageUrl,
            locale,
            cityName: city.cityName,
            region,
            title: labels.meta.title,
            description: labels.meta.description,
          }),
          faqPageJsonLd(labels.faq.items, pageUrl),
          breadcrumbJsonLd(pageUrl, [
            {
              name: labels.breadcrumbHome,
              path: locale === "en" ? "/en" : "/",
            },
            {
              name: city.cityName,
              path: girlsOnlyCityPath(locale, city.slug),
            },
          ]),
        ]}
      />

      <Header dict={dict.header} locale={locale} />

      <main>
        <GirlsOnlyCityView
          city={city}
          labels={labels}
          locale={locale}
          events={events}
          hasBookable={hasBookable}
          agendaHref={agendaHref}
          sundayScarcity={sundayScarcity}
        />
      </main>
      <Footer dict={dict.footer} locale={locale} showSeoLinks />
    </>
  );
}

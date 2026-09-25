import { Footer } from "@/components/Footer";
import { GirlsOnlyCityView } from "@/components/girls-only/GirlsOnlyCityView";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  girlsOnlyCityDisplayRegion,
  type GirlsOnlyCityDefinition,
} from "@/data/girls-only-cities";
import { agendaPath, girlsOnlyCityPath, type Locale } from "@/i18n/config";
import { getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import {
  cityHasBookableGirlsOnlyEvent,
  getGirlsOnlyCityLabels,
  getUpcomingGirlsOnlyCityEvents,
} from "@/lib/girls-only-city";
import { getNextSundayTableLocation } from "@/lib/sunday-table-locations";
import { buildSundayTableAgendaItem } from "@/lib/sunday-table-agenda-item";
import { hasEnoughSoldToShowSpots } from "@/lib/experience-booking";
import { enrichExperience } from "@/lib/experience-detail";
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

/** SEO city page ("Sunday Table in Utrecht") for cities without their own
 * Sunday Table landing page. Served at /sunday-table/[city]. */
export function girlsOnlyCityMetadata(
  city: GirlsOnlyCityDefinition,
  locale: Locale,
): Metadata {
  const labels = getGirlsOnlyCityLabels(city.slug, locale);
  return buildPageMetadata({
    locale,
    kind: "girlsOnlyCity",
    slug: city.slug,
    title: labels.meta.title,
    description: labels.meta.description,
    image: city.heroImage,
  });
}

export async function GirlsOnlyCityPage({
  city,
  locale,
}: {
  city: GirlsOnlyCityDefinition;
  locale: Locale;
}) {
  const labels = getGirlsOnlyCityLabels(city.slug, locale);
  const dict = await getDictionaryWithAgenda(locale);
  const wineTastingEvents = getUpcomingGirlsOnlyCityEvents(
    dict.agenda.items,
    locale,
    city.cityName,
    6,
  );

  // The real, ticketed Sunday Table for this city (if one is scheduled),
  // same data the agenda page and reveal page use.
  const nextLocation = await getNextSundayTableLocation(city.cityName);
  const sundayTableItem = nextLocation
    ? await buildSundayTableAgendaItem(nextLocation, locale)
    : null;
  const events = sundayTableItem
    ? [enrichExperience(sundayTableItem), ...wineTastingEvents]
    : wineTastingEvents;

  const hasBookable = cityHasBookableGirlsOnlyEvent(events);
  const pageUrl = absoluteUrl(girlsOnlyCityPath(locale, city.slug));
  const agendaHref = agendaPath(locale);
  const region = girlsOnlyCityDisplayRegion(city, locale);

  let sundayScarcity: { seatsLeft: number; dateLabel: string } | null = null;
  if (
    sundayTableItem &&
    sundayTableItem.status === "available" &&
    sundayTableItem.capacity !== undefined &&
    sundayTableItem.spotsSold !== undefined &&
    hasEnoughSoldToShowSpots(sundayTableItem.spotsSold) &&
    sundayTableItem.startsAt
  ) {
    const seatsLeft = Math.max(
      0,
      sundayTableItem.capacity - sundayTableItem.spotsSold,
    );
    const dateLabel = new Date(sundayTableItem.startsAt).toLocaleDateString(
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

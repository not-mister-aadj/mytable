import { AgendaHero } from "@/components/agenda/AgendaHero";
import { AgendaEventsSection } from "@/components/agenda/AgendaEventsSection";
import { AgendaGridSkeleton } from "@/components/agenda/AgendaGridSkeleton";
import { NewsletterCTA } from "@/components/agenda/NewsletterCTA";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/seo/JsonLd";
import { agendaPath, experiencePath, isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getAgendaExperiences } from "@/lib/experiences";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  organizationJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

/** Revalidate published events every minute; admin publish calls revalidateEventPaths. */
export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = getDictionary(locale);
  const title =
    locale === "en"
      ? `Wine tasting agenda Netherlands | MyTable`
      : `Agenda wijnproeverijen Nederland | MyTable`;
  return buildPageMetadata({
    locale,
    kind: "agenda",
    title,
    description: dict.agenda.hero.subtitle,
  });
}

export function generateStaticParams() {
  return [{ locale: "nl" }, { locale: "en" }];
}

export default async function AgendaPage({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const experiences = await getAgendaExperiences(locale as Locale);
  const pageUrl = absoluteUrl(agendaPath(locale));

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          breadcrumbJsonLd(pageUrl, [
            { name: "MyTable", path: locale === "en" ? "/en" : "/" },
            {
              name: locale === "en" ? "Agenda" : "Agenda",
              path: agendaPath(locale),
            },
          ]),
          itemListJsonLd({
            name:
              locale === "en"
                ? "Upcoming MyTable experiences"
                : "Aankomende MyTable tafels",
            description: dict.agenda.hero.subtitle,
            pageUrl,
            items: experiences
              .filter((item) => item.slug)
              .slice(0, 30)
              .map((item, index) => ({
                name: `${item.experienceName} · ${item.city}`,
                url: absoluteUrl(experiencePath(locale, item.slug)),
                position: index + 1,
              })),
          }),
        ]}
      />
      <Header dict={dict.header} locale={locale} />
      <main className="bg-cream">
        <AgendaHero hero={dict.agenda.hero} />
        <div className="pb-8 pt-10 sm:pb-12 sm:pt-12">
          <Suspense fallback={<AgendaGridSkeleton />}>
            <AgendaEventsSection locale={locale} />
          </Suspense>
        </div>
        <NewsletterCTA dict={dict.newsletter} locale={locale} />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}

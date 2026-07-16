import type { Metadata } from "next";
import { ExperiencesSection } from "@/components/ExperiencesSection";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HomeStickyCta } from "@/components/HomeStickyCta";
import { HowItWorks } from "@/components/HowItWorks";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { PrefetchCriticalRoutes } from "@/components/PrefetchCriticalRoutes";
import { JsonLd } from "@/components/seo/JsonLd";
import { Testimonials } from "@/components/Testimonials";
import { ValueStrip } from "@/components/ValueStrip";
import { VenueCTA } from "@/components/VenueCTA";
import { VenueDiscovery } from "@/components/VenueDiscovery";
import { agendaPath, experiencePath, isValidLocale, type Locale } from "@/i18n/config";
import { getDictionaryWithLanding } from "@/i18n/get-dictionary";
import {
  enrichExperience,
  getMoodContent,
  splitDateTime,
} from "@/lib/experience-detail";
import { getNextUpcomingExperience } from "@/lib/upcoming-event";
import { warmNavigationCaches } from "@/lib/warm-navigation-cache";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  faqPageJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import { notFound } from "next/navigation";

/** Revalidate published events every minute; admin publish calls revalidateEventPaths. */
export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const dict = await getDictionaryWithLanding(locale);
  return buildPageMetadata({
    locale,
    kind: "home",
    title: dict.meta.title,
    description: dict.meta.description,
  });
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const [dict] = await Promise.all([
    getDictionaryWithLanding(locale),
    warmNavigationCaches(locale),
  ]);
  const agendaHref = agendaPath(locale);
  const prefetchHrefs = [
    agendaHref,
    ...dict.experiences.items
      .slice(0, 6)
      .flatMap((item) => (item.slug ? [experiencePath(locale, item.slug)] : [])),
  ];
  const nextRaw = getNextUpcomingExperience(dict.agenda.items, locale);
  const nextEvent = nextRaw
    ? (() => {
        const experience = enrichExperience(nextRaw);
        const mood = getMoodContent(dict, experience.mood);
        const { time } = splitDateTime(experience.dateTime);
        return {
          experience,
          time,
          included: mood.included,
          statusLabel: dict.agenda.status[experience.status],
          href: experiencePath(locale, experience.slug),
        };
      })()
    : null;

  const homeUrl = absoluteUrl(locale === "en" ? "/en" : "/");

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(locale as Locale),
          faqPageJsonLd(dict.faq.items, homeUrl),
        ]}
      />
      <PrefetchCriticalRoutes locale={locale} hrefs={prefetchHrefs} />
      <Header dict={dict.header} locale={locale} />
      <main className="pb-20 lg:pb-0">
        <Hero dict={dict.hero} agendaHref={agendaHref} nextEvent={nextEvent} />
        <ValueStrip items={dict.valueStrip} />
        <ExperiencesSection
          dict={dict.experiences}
          pageLabels={dict.experiencePage}
          locale={locale}
          agendaHref={agendaHref}
        />
        <Testimonials dict={dict.testimonials} locale={locale} />
        <HowItWorks dict={dict.howItWorks} />
        <VenueDiscovery dict={dict.venueDiscovery} />
        <VenueCTA dict={dict.venueCta} />
        <NewsletterSignup dict={dict.newsletter} locale={locale} />
        <FAQ dict={dict.faq} />
      </main>
      <HomeStickyCta label={dict.hero.ctaPrimary} href={agendaHref} />
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}

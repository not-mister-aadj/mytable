import { ConceptSection } from "@/components/ConceptSection";
import { ExperiencesSection } from "@/components/ExperiencesSection";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Testimonials } from "@/components/Testimonials";
import { ValueStrip } from "@/components/ValueStrip";
import { VenueCTA } from "@/components/VenueCTA";
import { VenueDiscovery } from "@/components/VenueDiscovery";
import { agendaPath, experiencePath, isValidLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  enrichExperience,
  getMoodContent,
  splitDateTime,
} from "@/lib/experience-detail";
import { getNextUpcomingExperience } from "@/lib/upcoming-event";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const agendaHref = agendaPath(locale);
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

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main>
        <Hero dict={dict.hero} agendaHref={agendaHref} nextEvent={nextEvent} />
        <ValueStrip items={dict.valueStrip} />
        <ExperiencesSection
          dict={dict.experiences}
          pageLabels={dict.experiencePage}
          locale={locale}
          agendaHref={agendaHref}
        />
        <ConceptSection dict={dict.concept} />
        <HowItWorks dict={dict.howItWorks} />
        <VenueDiscovery dict={dict.venueDiscovery} />
        <Testimonials dict={dict.testimonials} locale={locale} />
        <VenueCTA dict={dict.venueCta} />
        <NewsletterSignup dict={dict.newsletter} />
        <FAQ dict={dict.faq} />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}

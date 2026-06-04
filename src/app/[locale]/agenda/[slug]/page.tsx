import { ExperiencePageContent } from "@/components/experience/ExperiencePageContent";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsletterCTA } from "@/components/agenda/NewsletterCTA";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getAllExperienceSlugs,
  getExperienceBySlug,
  getRelatedExperiences,
} from "@/lib/experiences";
import { getPublishedSlugs } from "@/lib/experience-data";
import { getExperienceByDbId } from "@/lib/experiences";
import {
  getTypeContent,
  routePointsFromTypeContent,
} from "@/lib/experience-type-content";
import { getEventVenues, getVenueRouteCoords } from "@/lib/venues";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import { isDbEventsEnabled } from "@/lib/env";
import { isDbConfigured } from "@/db/index";
import type { ExperienceVenue } from "@/i18n/types";
import type { RouteMapPoint } from "@/data/experience-route-map";
import { getRouteMapPoints } from "@/data/experience-route-map";
import { getExperienceVenues as getCatalogVenues } from "@/data/experience-venues";
import {
  getExperienceTagline,
  getMoodContent,
} from "@/lib/experience-detail";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const experience = await getExperienceBySlug(locale, slug);
  if (!experience) return {};
  const dict = getDictionary(locale);
  const mood = getMoodContent(dict, experience.mood);
  return {
    title: `${experience.experienceName}, ${experience.city} | MyTable`,
    description: getExperienceTagline(experience, mood),
  };
}

export async function generateStaticParams() {
  const locales: Locale[] = ["nl", "en"];

  if (isDbEventsEnabled() && isDbConfigured()) {
    try {
      const slugs = await getPublishedSlugs();
      return locales.flatMap((locale) =>
        slugs.map((slug) => ({ locale, slug })),
      );
    } catch (err) {
      console.error("[agenda/slug] static params failed", err);
    }
  }

  const params: { locale: string; slug: string }[] = [];
  for (const locale of locales) {
    const slugs = await getAllExperienceSlugs(locale);
    for (const slug of slugs) {
      params.push({ locale, slug });
    }
  }
  return params;
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const experience = await getExperienceBySlug(locale, slug);
  if (!experience) notFound();

  const related = await getRelatedExperiences(locale, experience);

  let eventVenues: ExperienceVenue[] | undefined;
  let routePoints: RouteMapPoint[] | undefined;

  const row = experience.eventDbId
    ? await getExperienceByDbId(experience.eventDbId)
    : undefined;

  if (row?.workflowStatus === "published") {
      const [venues, venueCoords, typeContent] = await Promise.all([
        getEventVenues(row, locale, experience.id),
        getVenueRouteCoords(row),
        getTypeContent(row.experienceType ?? DEFAULT_EXPERIENCE_TYPE),
      ]);
      eventVenues = venues;
      routePoints = routePointsFromTypeContent(
        typeContent,
        row.city,
        venues,
        experience.id,
        venueCoords.length > 0 ? venueCoords : undefined,
      );
  } else if (!experience.eventDbId) {
    const venues = getCatalogVenues(experience.id, experience.mood);
    routePoints = getRouteMapPoints(
      experience.id,
      experience.city,
      venues.map((v) => v.name),
    );
  }

  return (
    <>
      <Header dict={dict.header} locale={locale} />
      <main className="bg-cream">
        <ExperiencePageContent
          experience={experience}
          related={related}
          dict={dict}
          locale={locale}
          eventVenues={eventVenues}
          routePoints={routePoints}
        />
        <NewsletterCTA dict={dict.newsletter} />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}

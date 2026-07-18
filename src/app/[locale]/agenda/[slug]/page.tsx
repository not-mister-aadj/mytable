import { ExperiencePageContent } from "@/components/experience/ExperiencePageContent";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NewsletterCTA } from "@/components/agenda/NewsletterCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  agendaPath,
  experiencePath,
  isValidLocale,
  type Locale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  getAllExperienceSlugs,
  getExperienceBySlug,
  getRelatedExperiences,
} from "@/lib/experiences";
import { getExperienceByDbId } from "@/lib/experiences";
import {
  getTypeContent,
  routePointsFromTypeContent,
} from "@/lib/experience-type-content";
import { getEventVenues, getVenueRouteCoords } from "@/lib/venues";
import { DEFAULT_EXPERIENCE_TYPE } from "@/lib/experience-type-definitions";
import type { ExperienceVenue } from "@/i18n/types";
import type { RouteMapPoint } from "@/data/experience-route-map";
import { getRouteMapPoints } from "@/data/experience-route-map";
import { getExperienceVenues as getCatalogVenues } from "@/data/experience-venues";
import { getExperienceTagline } from "@/lib/experience-detail";
import { getMoodContentForEvent } from "@/lib/girls-only-experience-content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  eventJsonLd,
  faqPageJsonLd,
  organizationJsonLd,
} from "@/lib/seo/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { resolveEventSlugRedirect } from "@/lib/event-slug.server";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 60;
export const dynamicParams = true;

function experienceSeoTitle(
  locale: Locale,
  name: string,
  city: string,
  femaleOnly?: boolean,
): string {
  if (locale === "en") {
    return femaleOnly
      ? `${name} in ${city} · Girls-only wine tasting | MyTable`
      : `${name} in ${city} · Wine tasting | MyTable`;
  }
  return femaleOnly
    ? `${name} in ${city} · Girls-only wijnproeverij | MyTable`
    : `${name} in ${city} · Wijnproeverij | MyTable`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const experience = await getExperienceBySlug(locale, slug);
  if (!experience) {
    const targetSlug = await resolveEventSlugRedirect(slug);
    if (targetSlug) permanentRedirect(experiencePath(locale, targetSlug));
    return {};
  }
  const dict = getDictionary(locale);
  const mood = getMoodContentForEvent(dict, experience, locale);
  const description = getExperienceTagline(experience, mood);

  return buildPageMetadata({
    locale,
    kind: "experience",
    slug: experience.slug,
    title: experienceSeoTitle(
      locale,
      experience.experienceName,
      experience.city,
      experience.femaleOnly,
    ),
    description,
    image: experience.image,
  });
}

export async function generateStaticParams() {
  const locales: Locale[] = ["nl", "en"];
  const params: { locale: string; slug: string }[] = [];

  try {
    for (const locale of locales) {
      const slugs = await getAllExperienceSlugs(locale);
      for (const slug of slugs) {
        params.push({ locale, slug });
      }
    }
  } catch (err) {
    console.error("[agenda/slug] static params failed", err);
  }

  return params;
}

export default async function ExperienceDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const experience = await getExperienceBySlug(locale, slug);
  if (!experience) {
    const targetSlug = await resolveEventSlugRedirect(slug);
    if (targetSlug) permanentRedirect(experiencePath(locale, targetSlug));
    notFound();
  }

  const related = await getRelatedExperiences(locale, experience);
  const mood = getMoodContentForEvent(dict, experience, locale);
  const description = getExperienceTagline(experience, mood);
  const faqItems =
    experience.customFaq?.length ? experience.customFaq : mood.faq;

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

  const primaryVenue = eventVenues?.find((v) => v.kind !== "locationTbd");
  const pageUrl = absoluteUrl(experiencePath(locale, experience.slug));

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
            {
              name: experience.experienceName,
              path: experiencePath(locale, experience.slug),
            },
          ]),
          eventJsonLd({
            experience,
            locale,
            description,
            venueName: primaryVenue?.name,
            venueAddress: primaryVenue?.address,
            endsAtIso: row?.endsAt?.toISOString() ?? null,
          }),
          faqPageJsonLd(faqItems, pageUrl),
        ]}
      />
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
        <NewsletterCTA
          dict={dict.newsletter}
          locale={locale}
          sourceSection="event_detail"
        />
      </main>
      <Footer dict={dict.footer} locale={locale} />
    </>
  );
}

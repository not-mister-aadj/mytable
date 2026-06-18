"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { getMoodContent } from "@/lib/experience-detail";
import type { RouteMapPoint } from "@/data/experience-route-map";
import { getExperienceVenues } from "@/data/experience-venues";
import { getRouteMapPoints } from "@/data/experience-route-map";
import { BookingCard } from "./BookingCard";
import { CityRoute } from "./CityRoute";
import { ExperienceDescription } from "./ExperienceDescription";
import { ExperienceFaq } from "./ExperienceFaq";
import { ExperienceFinalCta } from "./ExperienceFinalCta";
import { ExperienceFlow } from "./ExperienceFlow";
import { ExperienceGallery } from "./ExperienceGallery";
import { ExperienceHero } from "./ExperienceHero";
import { ExperienceStickyBookingBar } from "./ExperienceStickyBookingBar";
import { GuestQuotes } from "./GuestQuotes";
import { PracticalInfo } from "./PracticalInfo";
import { RelatedExperiences } from "./RelatedExperiences";
import { ScrollProgress } from "./ScrollProgress";
import { SocialAtmosphere } from "./SocialAtmosphere";
import { VenueLineup } from "./VenueLineup";
import { WhatToExpect } from "./WhatToExpect";
import { EventShareModals } from "@/components/experience/EventShareModals";
import { trackEventDetailViewed } from "@/lib/posthog/analytics";
import { trackMetaViewContent } from "@/lib/analytics/metaTracking";

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" as const },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

interface ExperiencePageContentProps {
  experience: EnrichedExperience;
  related: EnrichedExperience[];
  dict: Dictionary;
  locale: Locale;
  /** From DB-linked venues; when omitted, uses catalog fallback */
  eventVenues?: ExperienceVenue[];
  /** Route from experience type; when omitted, computed client-side */
  routePoints?: RouteMapPoint[];
  /** Admin live preview: same layout, no sticky bar / related / scroll chrome */
  previewMode?: boolean;
}

export function ExperiencePageContent({
  experience,
  related,
  dict,
  locale,
  eventVenues,
  routePoints: routePointsProp,
  previewMode = false,
}: ExperiencePageContentProps) {
  const page = dict.experiencePage;
  const mood = getMoodContent(dict, experience.mood);
  const venuesTitle =
    experience.pageSections?.venuesTitle ?? page.venuesTitle;
  const venuesSubtitle =
    experience.pageSections?.venuesSubtitle ?? page.venuesSubtitle;
  const venues =
    eventVenues && eventVenues.length > 0
      ? eventVenues
      : getExperienceVenues(experience.id, experience.mood);
  const routePoints =
    routePointsProp ??
    getRouteMapPoints(
      experience.id,
      experience.city,
      venues.map((v) => v.name),
    );
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const mobileBookingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewMode) return;
    trackEventDetailViewed(experience, locale);
    trackMetaViewContent(experience, locale);
  }, [
    experience.slug,
    experience.eventDbId,
    experience.id,
    experience.city,
    locale,
    previewMode,
  ]);

  return (
    <>
      {previewMode ? null : (
        <EventShareModals experience={experience} locale={locale} />
      )}
      {previewMode ? null : <ScrollProgress />}

      <ExperienceHero
        experience={experience}
        mood={mood}
        labels={page}
        locale={locale}
        reserveCta={dict.agenda.reserveCta}
        femaleOnlyBadge={dict.experiences.femaleOnlyBadge}
        previewMode={previewMode}
      />
      <div ref={stickySentinelRef} className="h-px w-full" aria-hidden />

      {previewMode ? null : (
        <ExperienceStickyBookingBar
          experience={experience}
          labels={page}
          reserveCta={dict.agenda.reserveCta}
          femaleOnlyBadge={dict.experiences.femaleOnlyBadge}
          locale={locale}
          sentinelRef={stickySentinelRef}
          bookingRef={mobileBookingRef}
        />
      )}

      {venues.length > 0 ? (
        <VenueLineup
          title={venuesTitle}
          subtitle={venuesSubtitle}
          venues={venues}
        />
      ) : null}

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-14 xl:gap-20">
          <div className="min-w-0 space-y-4">
            <motion.div
              {...fade}
              ref={mobileBookingRef}
              id="booking"
              className="scroll-mt-[9rem] lg:hidden"
            >
              <BookingCard
                experience={experience}
                labels={page}
                statusLabels={dict.agenda.status}
                reserveCta={dict.agenda.reserveCta}
                locale={locale}
                className="mt-10"
                compact
                fitViewport
              />
            </motion.div>

            <motion.div {...fade}>
              <ExperienceDescription
                title={page.aboutTitle}
                description={
                  experience.customDescription ?? mood.description
                }
              />
            </motion.div>

            <motion.div {...fade}>
              <ExperienceFlow title={page.flowTitle} steps={mood.experienceFlow} />
            </motion.div>

            <motion.div {...fade}>
              <WhatToExpect title={page.expectTitle} items={mood.whatToExpect} />
            </motion.div>

            <motion.div {...fade}>
              <SocialAtmosphere
                title={page.socialTitle}
                subtitle={page.socialSubtitle}
                paragraphs={mood.socialParagraphs}
                image={mood.gallery[0] ?? experience.image}
                imageAlt={experience.experienceName}
              />
            </motion.div>

            <motion.div {...fade}>
              <ExperienceGallery
                title={page.galleryTitle}
                images={
                  experience.galleryImages?.length
                    ? experience.galleryImages
                    : mood.gallery
                }
                imageSettings={experience.galleryImageSettings}
                experienceName={experience.experienceName}
              />
            </motion.div>

            {routePoints.length > 0 ? (
              <motion.div {...fade}>
                <CityRoute
                  mapEyebrow={page.routeMapEyebrow}
                  mapTitle={page.routeMapTitle}
                  subtitle={page.routeSubtitle}
                  city={experience.city}
                  points={routePoints}
                />
              </motion.div>
            ) : null}

            <motion.div {...fade}>
              <GuestQuotes title={page.guestQuotesTitle} quotes={mood.guestQuotes} />
            </motion.div>

            <motion.div {...fade}>
              <PracticalInfo
                title={page.practicalTitle}
                experience={experience}
                mood={mood}
                labels={page}
              />
            </motion.div>

            <motion.div {...fade}>
              <ExperienceFaq
                title={page.faqTitle}
                items={
                  experience.customFaq?.length
                    ? experience.customFaq
                    : mood.faq
                }
              />
            </motion.div>

            <motion.div {...fade}>
              <ExperienceFinalCta
                experience={experience}
                headline={page.finalCtaHeadline}
                subheadline={page.finalCtaSubheadline}
                primaryCta={page.finalCtaPrimary}
                secondaryCta={page.finalCtaSecondary}
                locale={locale}
              />
            </motion.div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-36 pt-4">
              <BookingCard
                experience={experience}
                labels={page}
                statusLabels={dict.agenda.status}
                reserveCta={dict.agenda.reserveCta}
                locale={locale}
                compact
                fitViewport
              />
            </div>
          </div>
        </div>

        {previewMode ? null : (
          <RelatedExperiences
            title={page.relatedTitle}
            items={related}
            locale={locale}
            dict={dict}
          />
        )}
      </div>
    </>
  );
}

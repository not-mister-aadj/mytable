"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { ExperienceVenue } from "@/i18n/types";
import type { EnrichedExperience } from "@/lib/experience-detail";
import {
  getExperiencePageLabelsForEvent,
  getMoodContentForEvent,
} from "@/lib/girls-only-experience-content";
import type { RouteMapPoint } from "@/data/experience-route-map";
import { getExperienceVenues } from "@/data/experience-venues";
import { getRouteMapPoints } from "@/data/experience-route-map";
import { resolveFemaleOnly } from "@/lib/event-extras";
import {
  BOOKING_DESKTOP_ID,
  BOOKING_MOBILE_ID,
} from "@/lib/scroll-to-booking";
import { BookingCard } from "./BookingCard";
import { CityRoute } from "./CityRoute";
import { ExperienceFaq } from "./ExperienceFaq";
import { ExperienceFlow } from "./ExperienceFlow";
import { ExperienceIncluded } from "./ExperienceIncluded";
import { ExperienceMidBookingCta } from "./ExperienceMidBookingCta";
import { ExperienceGallery } from "./ExperienceGallery";
import { ExperienceHero } from "./ExperienceHero";
import { ExperienceMobileStickyCta } from "./ExperienceMobileStickyCta";
import { ExperienceStickyBookingBar } from "./ExperienceStickyBookingBar";
import { GuestQuotes } from "./GuestQuotes";
import { RelatedExperiences } from "./RelatedExperiences";
import { ScrollProgress } from "./ScrollProgress";
import { VenueLineup } from "./VenueLineup";
import { WhatToExpect } from "./WhatToExpect";
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
  const page = getExperiencePageLabelsForEvent(dict, locale, experience);
  const mood = getMoodContentForEvent(dict, experience, locale);
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
  const desktopBookingRef = useRef<HTMLDivElement>(null);
  const isFemaleOnly = resolveFemaleOnly(
    experience.femaleOnly,
    experience.atmosphereTags,
  );

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
          desktopBookingRef={desktopBookingRef}
        />
      )}

      {previewMode ? null : (
        <ExperienceMobileStickyCta
          experience={experience}
          labels={page}
          reserveCta={dict.agenda.reserveCta}
          locale={locale}
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
          {previewMode ? null : (
            <div className="relative z-10 hidden lg:col-start-2 lg:row-start-1 lg:row-end-[-1] lg:block">
              <div className="sticky top-36 pt-4">
                <div
                  ref={desktopBookingRef}
                  id={BOOKING_DESKTOP_ID}
                  className="scroll-mt-36"
                >
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
          )}

          <div className="min-w-0 lg:col-start-1">
            {previewMode ? (
              <motion.div {...fade}>
                <BookingCard
                  experience={experience}
                  labels={page}
                  statusLabels={dict.agenda.status}
                  reserveCta={dict.agenda.reserveCta}
                  locale={locale}
                  compact
                  fitViewport
                  className="mt-4"
                />
              </motion.div>
            ) : null}

            <motion.div {...fade}>
              <ExperienceIncluded
                eyebrow={page.includedEyebrow}
                title={page.includedTitle}
                subtitle={page.includedSubtitle}
                items={page.includedItems}
                isFemaleOnly={isFemaleOnly}
              />
            </motion.div>

            <motion.div {...fade}>
              <ExperienceFlow
                eyebrow={page.flowEyebrow}
                title={page.flowTitle}
                expandLabel={page.flowExpandCta}
                steps={mood.experienceFlow}
              />
            </motion.div>

            {previewMode ? null : (
              <motion.div
                {...fade}
                ref={mobileBookingRef}
                id={BOOKING_MOBILE_ID}
                className="scroll-mt-[5rem] pb-8 pt-6 lg:hidden"
              >
                <BookingCard
                  experience={experience}
                  labels={page}
                  statusLabels={dict.agenda.status}
                  reserveCta={dict.agenda.reserveCta}
                  locale={locale}
                  compact
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <motion.div {...fade}>
        <GuestQuotes
          eyebrow={page.guestQuotesEyebrow}
          title={page.guestQuotesTitle}
          locale={locale}
          isFemaleOnly={isFemaleOnly}
        />
      </motion.div>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-14 xl:gap-20">
          <div className="min-w-0 lg:col-start-1">
            <motion.div {...fade}>
              <WhatToExpect title={page.expectTitle} items={mood.whatToExpect} />
            </motion.div>
          </div>

          {previewMode ? null : (
            <div className="hidden lg:col-start-2 lg:row-start-1 lg:block" aria-hidden />
          )}
        </div>
      </div>

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
          isFemaleOnly={isFemaleOnly}
        />
      </motion.div>

      <div className="mx-auto max-w-7xl px-5 pb-[max(5.5rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-10 lg:pb-0">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-14 xl:gap-20">
          <div className="min-w-0 lg:col-start-1">
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
              <ExperienceFaq
                title={page.faqTitle}
                items={
                  experience.customFaq?.length
                    ? experience.customFaq
                    : mood.faq
                }
              />
            </motion.div>

            {previewMode ? null : (
              <motion.div {...fade}>
                <ExperienceMidBookingCta
                  experience={experience}
                  locale={locale}
                  reserveCta={dict.agenda.reserveCta}
                  eyebrow={page.midCtaEyebrow}
                  title={page.midCtaTitle}
                  trustLine={page.midCtaTrustLine}
                  perPersonFromLabel={page.perPersonFrom}
                  spotsHintLabel={page.heroSpotsHint}
                />
              </motion.div>
            )}
          </div>

          {previewMode ? null : (
            <div className="hidden lg:col-start-2 lg:row-start-1 lg:block" aria-hidden />
          )}
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

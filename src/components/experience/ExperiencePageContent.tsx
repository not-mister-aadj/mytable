"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { Dictionary } from "@/i18n/types";
import type { Locale } from "@/i18n/config";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { getMoodContent } from "@/lib/experience-detail";
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
}

export function ExperiencePageContent({
  experience,
  related,
  dict,
  locale,
}: ExperiencePageContentProps) {
  const page = dict.experiencePage;
  const mood = getMoodContent(dict, experience.mood);
  const venues = getExperienceVenues(experience.id, experience.mood);
  const routePoints = getRouteMapPoints(
    experience.id,
    experience.city,
    venues.map((v) => v.name),
  );
  const stickySentinelRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <ScrollProgress />

      <ExperienceHero
        experience={experience}
        mood={mood}
        labels={page}
        locale={locale}
        reserveCta={dict.agenda.reserveCta}
      />
      <div ref={stickySentinelRef} className="h-px w-full" aria-hidden />

      <ExperienceStickyBookingBar
        experience={experience}
        labels={page}
        reserveCta={dict.agenda.reserveCta}
        sentinelRef={stickySentinelRef}
      />

      <VenueLineup
        title={page.venuesTitle}
        subtitle={page.venuesSubtitle}
        venues={venues}
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-14 xl:gap-20">
          <div className="min-w-0 space-y-4">
            <motion.div {...fade} id="booking" className="lg:hidden">
              <BookingCard
                experience={experience}
                labels={page}
                statusLabels={dict.agenda.status}
                reserveCta={dict.agenda.reserveCta}
                locale={locale}
                className="mt-10"
              />
            </motion.div>

            <motion.div {...fade}>
              <ExperienceDescription
                title={page.aboutTitle}
                description={mood.description}
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
                images={mood.gallery}
                experienceName={experience.experienceName}
              />
            </motion.div>

            {routePoints.length > 0 ? (
              <motion.div {...fade}>
                <CityRoute
                  mapEyebrow={page.routeMapEyebrow}
                  mapTitle={page.routeMapTitle}
                  subtitle={page.routeSubtitle}
                  openMapsLabel={page.routeOpenInApple}
                  mapSetupHint={page.routeMapSetupHint}
                  city={experience.city}
                  points={routePoints}
                  locale={locale}
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
              <ExperienceFaq title={page.faqTitle} items={mood.faq} />
            </motion.div>

            <motion.div {...fade}>
              <ExperienceFinalCta
                headline={page.finalCtaHeadline}
                subheadline={page.finalCtaSubheadline}
                primaryCta={page.finalCtaPrimary}
                secondaryCta={page.finalCtaSecondary}
                locale={locale}
              />
            </motion.div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-28 pt-14">
              <BookingCard
                experience={experience}
                labels={page}
                statusLabels={dict.agenda.status}
                reserveCta={dict.agenda.reserveCta}
                locale={locale}
              />
            </div>
          </div>
        </div>

        <RelatedExperiences
          title={page.relatedTitle}
          items={related}
          locale={locale}
          dict={dict}
        />
      </div>
    </>
  );
}

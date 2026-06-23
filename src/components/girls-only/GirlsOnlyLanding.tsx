import { experiencePath, type Locale } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import {
  getGirlsOnlyWineEvents,
  partitionGirlsOnlyEvents,
} from "@/lib/girls-only-landing";
import { buildGirlsOnlyGalleryImages } from "@/lib/girls-only-gallery";
import type { ExperienceItem } from "@/i18n/types";
import { GirlsOnlyLandingView } from "./GirlsOnlyLandingView";

interface GirlsOnlyLandingProps {
  labels: GirlsOnlyPageLabels;
  locale: Locale;
  agendaItems: ExperienceItem[];
}

export async function GirlsOnlyLanding({
  labels,
  locale,
  agendaItems,
}: GirlsOnlyLandingProps) {
  const allEvents = getGirlsOnlyWineEvents(agendaItems, locale);
  const { bookable, soldOut } = partitionGirlsOnlyEvents(allEvents);
  const primaryCtaHref =
    bookable.length > 0
      ? experiencePath(locale, bookable[0].slug)
      : "#events";
  const galleryItems = await buildGirlsOnlyGalleryImages(locale, allEvents);

  return (
    <GirlsOnlyLandingView
      labels={labels}
      locale={locale}
      allEvents={allEvents}
      soldOut={soldOut}
      primaryCtaHref={primaryCtaHref}
      galleryItems={galleryItems}
    />
  );
}

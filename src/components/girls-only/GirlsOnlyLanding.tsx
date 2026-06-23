import type { Locale } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import { getGirlsOnlyWineEvents } from "@/lib/girls-only-landing";
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

  return (
    <GirlsOnlyLandingView
      labels={labels}
      locale={locale}
      allEvents={allEvents}
    />
  );
}

import { agendaPath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import { getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import {
  getGirlsOnlyWineEvents,
  getUpcomingGirlsOnlyEvents,
  resolveGirlsOnlyPrimaryCta,
} from "@/lib/girls-only-landing";
import { warmExperienceSlugs } from "@/lib/warm-navigation-cache";
import { Header } from "@/components/Header";
import { GirlsOnlyLandingView } from "./GirlsOnlyLandingView";

interface GirlsOnlyAgendaSectionProps {
  locale: Locale;
  labels: GirlsOnlyPageLabels;
  headerDict: Dictionary["header"];
}

export async function GirlsOnlyAgendaSection({
  locale,
  labels,
  headerDict,
}: GirlsOnlyAgendaSectionProps) {
  const agendaDict = await getDictionaryWithAgenda(locale);
  warmExperienceSlugs(
    locale,
    agendaDict.agenda.items.flatMap((item) => (item.slug ? [item.slug] : [])),
  );

  const allEvents = getGirlsOnlyWineEvents(agendaDict.agenda.items, locale);
  const upcomingEvents = getUpcomingGirlsOnlyEvents(allEvents, locale, 3);
  const agendaHref = agendaPath(locale);
  const primaryCta = resolveGirlsOnlyPrimaryCta({
    label: labels.cta.viewAllSundays,
    href: agendaHref,
  });

  return (
    <>
      <Header dict={headerDict} locale={locale} />
      <GirlsOnlyLandingView
        labels={labels}
        locale={locale}
        upcomingEvents={upcomingEvents}
        agendaHref={agendaHref}
        primaryCta={primaryCta}
      />
    </>
  );
}

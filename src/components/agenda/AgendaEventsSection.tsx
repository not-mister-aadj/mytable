import type { Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { AgendaPageContent } from "@/components/AgendaPageContent";
import { getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import { warmExperienceSlugs } from "@/lib/warm-navigation-cache";
import { getUpcomingSundayTableLocations } from "@/lib/sunday-table-locations";
import { buildSundayTableAgendaItem } from "@/lib/sunday-table-agenda-item";

interface AgendaEventsSectionProps {
  locale: Locale;
}

export async function AgendaEventsSection({ locale }: AgendaEventsSectionProps) {
  const [dict, locations] = await Promise.all([
    getDictionaryWithAgenda(locale),
    getUpcomingSundayTableLocations(),
  ]);
  const sundayTableItems = (
    await Promise.all(
      locations.map((location) => buildSundayTableAgendaItem(location, locale)),
    )
  ).filter((item): item is ExperienceItem => item !== null);
  const items = [...dict.agenda.items, ...sundayTableItems];

  warmExperienceSlugs(
    locale,
    items.flatMap((item) => (item.slug ? [item.slug] : [])),
  );

  return (
    <AgendaPageContent
      dict={dict.agenda}
      pageLabels={dict.experiencePage}
      locale={locale}
      items={items}
    />
  );
}

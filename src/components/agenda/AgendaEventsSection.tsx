import type { Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { AgendaPageContent } from "@/components/AgendaPageContent";
import { getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import { warmExperienceSlugs } from "@/lib/warm-navigation-cache";
import { getUpcomingSundayTableLocations } from "@/lib/sunday-table-locations";
import { buildSundayTableAgendaItem } from "@/lib/sunday-table-agenda-item";
import { getBookableSundaySocialItems } from "@/lib/sunday-social-tables";
import { amsterdamDateIso } from "@/lib/sunday-wine-table";

interface AgendaEventsSectionProps {
  locale: Locale;
}

/** City and Amsterdam date: one Sunday Social per city per Sunday. */
function sundayKey(item: ExperienceItem): string {
  return `${item.city.toLowerCase()}|${item.startsAt ? amsterdamDateIso(new Date(item.startsAt)) : item.id}`;
}

/** A Sunday Social shows on the agenda only while it can be booked: it has
 * a published event (a location row alone has no seats or price) and is
 * not coming soon or sold out. */
function isBookableNow(item: ExperienceItem): boolean {
  if (item.capacity === undefined) return false;
  return item.status === "available" || item.status === "almostFull";
}

export async function AgendaEventsSection({ locale }: AgendaEventsSectionProps) {
  const [dict, locations, seriesItems] = await Promise.all([
    getDictionaryWithAgenda(locale),
    getUpcomingSundayTableLocations(),
    getBookableSundaySocialItems(locale),
  ]);
  const handMade = (
    await Promise.all(
      locations.map((location) => buildSundayTableAgendaItem(location, locale)),
    )
  ).filter((item): item is ExperienceItem => item !== null && isBookableNow(item));
  // Hand-made Sunday Socials first; a series table on the same city and
  // Sunday is the same afternoon, so it is not shown twice.
  const taken = new Set(handMade.map(sundayKey));
  const sundaySocials = [...handMade, ...seriesItems.filter((item) => !taken.has(sundayKey(item)))];
  const items = [...dict.agenda.items, ...sundaySocials];

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

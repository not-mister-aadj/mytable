import { and, eq } from "drizzle-orm";
import type { Locale } from "@/i18n/config";
import { sundayTableLocationPath } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { AgendaPageContent } from "@/components/AgendaPageContent";
import { getDictionaryWithAgenda } from "@/i18n/get-dictionary";
import { warmExperienceSlugs } from "@/lib/warm-navigation-cache";
import {
  getUpcomingSundayTableLocations,
  type SundayTableLocation,
} from "@/lib/sunday-table-locations";
import { sundayTableLpSlugFromCity } from "@/data/sunday-table-lp-cities";
import { images } from "@/data/images";
import { getDb, isDbConfigured } from "@/db/index";
import { events } from "@/db/schema";
import {
  formatSundayTableCardDateTime,
  parseAmsterdamDateIso,
} from "@/lib/sunday-wine-table";

/** Manually curated per-venue card photo until Sunday Table locations get
 * their own image field. Falls back to a neutral stock photo for new venues. */
function agendaImageForVenue(venueName: string): string {
  if (venueName === "Bar Juni Rotterdam") {
    return "https://lh3.googleusercontent.com/grass-cs/ACvplmPKHPMZLbYmXXtC7a58PZZXLNLyYVbh6MRSFgUerRrfHIuVrFPWpbL6PJEEE7g98cQ-HZDirRJoY7D7WXBNHAZMPMDr3matKwDmgYtgoXZmnsoswO2hHtZNvhOCgJOql5VWJkywm4G80yYn=w1600-h1200-p-k-no";
  }
  return images.cheers;
}

/** The ticketed event's own name ("Sunday Table · 20-39") if one exists for
 * this location yet, so editions with different age brackets read
 * distinctly on the agenda card instead of all saying plain "Sunday Table". */
async function ticketedEventName(
  location: SundayTableLocation,
  startsAt: Date,
  locale: Locale,
): Promise<string | null> {
  if (!isDbConfigured()) return null;
  const db = getDb();
  const [row] = await db
    .select({ nameNl: events.nameNl, nameEn: events.nameEn })
    .from(events)
    .where(
      and(
        eq(events.experienceType, "sunday-table"),
        eq(events.city, location.city),
        eq(events.startsAt, startsAt),
        eq(events.workflowStatus, "published"),
      ),
    )
    .limit(1);
  if (!row) return null;
  return locale === "en" ? row.nameEn : row.nameNl;
}

async function buildSundayTableAgendaItem(
  location: SundayTableLocation,
  locale: Locale,
): Promise<ExperienceItem | null> {
  const citySlug = sundayTableLpSlugFromCity(location.city);
  if (!citySlug) return null;

  const startsAt = parseAmsterdamDateIso(location.tableDate);
  if (!startsAt) return null;

  const name = (await ticketedEventName(location, startsAt, locale)) ?? "Sunday Table";

  return {
    id: `sunday-table-${location.city}-${location.tableDate}`,
    city: location.city,
    experienceName: name,
    category: "Sunday Table",
    dateTime: formatSundayTableCardDateTime(startsAt, locale),
    startsAt: startsAt.toISOString(),
    price: 0,
    status: "available",
    image: agendaImageForVenue(location.venueName),
    mood: "tastings",
    femaleOnly: false,
    externalHref: sundayTableLocationPath(locale, citySlug, location.tableDate),
  };
}

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

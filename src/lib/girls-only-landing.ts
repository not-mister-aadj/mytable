import type { Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { sortAgendaTimeline } from "@/lib/agenda";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { enrichExperience } from "@/lib/experience-detail";

const ROTTERDAM_PRIORITY = 0;
const DEFAULT_CITY_PRIORITY = 1;

function citySortPriority(city: string): number {
  if (/rotterdam/i.test(city)) return ROTTERDAM_PRIORITY;
  return DEFAULT_CITY_PRIORITY;
}

export function isGirlsOnlyWineTasting(item: ExperienceItem): boolean {
  if (!item.femaleOnly) return false;

  const type = item.experienceType ?? "wine-tasting";
  if (type === "wine-tasting") return true;
  if (item.mood === "tastings") return true;

  return /wijnproeverij|wine tasting/i.test(item.category);
}

export function getGirlsOnlyWineEvents(
  items: ExperienceItem[],
  locale: Locale,
): EnrichedExperience[] {
  const filtered = items
    .filter(isGirlsOnlyWineTasting)
    .map(enrichExperience);

  const sorted = sortAgendaTimeline(filtered, locale);

  return sorted.sort((a, b) => {
    const cityDiff = citySortPriority(a.city) - citySortPriority(b.city);
    if (cityDiff !== 0) return cityDiff;
    return 0;
  });
}

export function partitionGirlsOnlyEvents(items: EnrichedExperience[]): {
  bookable: EnrichedExperience[];
  soldOut: EnrichedExperience[];
} {
  const soldOut = items.filter(
    (item) => item.status === "soldOut" || item.status === "closed",
  );
  const bookable = items.filter(
    (item) => item.status !== "soldOut" && item.status !== "closed",
  );
  return { bookable, soldOut };
}

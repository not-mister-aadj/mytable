import type { Locale } from "@/i18n/config";
import type { ExperienceItem } from "@/i18n/types";
import { sortAgendaTimeline } from "@/lib/agenda";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { enrichExperience } from "@/lib/experience-detail";

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

  return sortAgendaTimeline(filtered, locale);
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

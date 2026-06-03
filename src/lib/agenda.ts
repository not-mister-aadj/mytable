import type { Locale } from "@/i18n/config";
import type { AgendaTabKey } from "@/i18n/types";
import type { EnrichedExperience } from "./experience-detail";
import { sortExperiencesByDate } from "./upcoming-event";

export function filterAgendaItems(
  items: EnrichedExperience[],
  category: AgendaTabKey,
): EnrichedExperience[] {
  if (category === "all") return items;
  if (category === "girlsOnly") {
    return items.filter((item) => item.femaleOnly === true);
  }
  if (category === "mixed") {
    return items.filter((item) => !item.femaleOnly);
  }
  return items;
}

export function sortAgendaTimeline(
  items: EnrichedExperience[],
  locale: Locale,
): EnrichedExperience[] {
  return sortExperiencesByDate(items, locale) as EnrichedExperience[];
}

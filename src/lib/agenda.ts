import type { Locale } from "@/i18n/config";
import type { AgendaTabKey } from "@/i18n/types";
import type { EnrichedExperience } from "./experience-detail";
import { sortExperiencesByDate } from "./upcoming-event";

function experienceTypeOf(item: EnrichedExperience): string {
  return (item.experienceType ?? "").toLowerCase();
}

export function filterAgendaByCity(
  items: EnrichedExperience[],
  city: string,
): EnrichedExperience[] {
  if (!city) return items;
  return items.filter((item) => item.city === city);
}

export function filterAgendaItems(
  items: EnrichedExperience[],
  category: AgendaTabKey,
): EnrichedExperience[] {
  if (category === "all") return items;

  return items.filter((item) => {
    const type = experienceTypeOf(item);
    switch (category) {
      case "tastings":
        return item.mood === "tastings" || type === "wine-tasting";
      case "wineWalk":
        return item.mood === "wineWalk" || type === "wine-walk";
      case "foodWalk":
        return type === "food-walk" || type === "food_walk";
      case "chefsSpecial":
        return item.mood === "chefsSpecial" || type === "chefs-special";
      default:
        return true;
    }
  });
}

export function sortAgendaTimeline(
  items: EnrichedExperience[],
  locale: Locale,
): EnrichedExperience[] {
  return sortExperiencesByDate(items, locale) as EnrichedExperience[];
}

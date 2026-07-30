import type { Locale } from "@/i18n/config";
import type { AgendaTabKey, ExperienceItem } from "@/i18n/types";
import type { EnrichedExperience } from "./experience-detail";
import { sortExperiencesByDate } from "./upcoming-event";

function experienceTypeOf(item: EnrichedExperience): string {
  return (item.experienceType ?? "").toLowerCase();
}

/** Stable key for date filtering (ISO date when available). */
export function getExperienceDateKey(item: ExperienceItem): string {
  if (item.startsAt) return item.startsAt.slice(0, 10);
  return item.dateTime.split(" · ")[0]?.trim().toLowerCase() ?? item.id;
}

/** Human-readable date label for filter dropdowns. */
export function getExperienceDateLabel(item: ExperienceItem): string {
  const datePart = item.dateTime.split(" · ")[0]?.trim() ?? item.dateTime;
  return datePart.charAt(0).toUpperCase() + datePart.slice(1);
}

export interface DateFilterOption {
  key: string;
  label: string;
}

export function buildDateFilterOptions(
  items: EnrichedExperience[],
): DateFilterOption[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    const key = getExperienceDateKey(item);
    if (!seen.has(key)) {
      seen.set(key, getExperienceDateLabel(item));
    }
  }
  return [...seen.entries()].map(([key, label]) => ({ key, label }));
}

export function filterAgendaByCity(
  items: EnrichedExperience[],
  city: string,
): EnrichedExperience[] {
  if (!city) return items;
  return items.filter((item) => item.city === city);
}

export function filterAgendaByDate(
  items: EnrichedExperience[],
  dateKey: string,
): EnrichedExperience[] {
  if (!dateKey) return items;
  return items.filter((item) => getExperienceDateKey(item) === dateKey);
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

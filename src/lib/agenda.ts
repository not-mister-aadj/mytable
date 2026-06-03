import type { AgendaTabKey } from "@/i18n/types";
import type { EnrichedExperience } from "./experience-detail";

export function filterAgendaItems(
  items: EnrichedExperience[],
  category: AgendaTabKey,
): EnrichedExperience[] {
  if (category === "all") return items;
  return items.filter((item) => item.mood === category);
}

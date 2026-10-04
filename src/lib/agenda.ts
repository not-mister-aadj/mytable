import type { Locale } from "@/i18n/config";
import type { AgendaTabKey, ExperienceItem } from "@/i18n/types";
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

/** "Sunday Social · 20-39" -> "20-39". Only Sunday Socials carry an age
 * bracket, as the last part of their event name. */
export function agendaAgeBracket(item: ExperienceItem): string | null {
  if (item.category !== "Sunday Social") return null;
  const parts = item.experienceName.split("·").map((part) => part.trim());
  return parts.length > 1 ? parts[parts.length - 1] || null : null;
}

/** The brackets on offer, youngest first ("20-39" before "35+"). */
export function listAgendaAgeBrackets(items: ExperienceItem[]): string[] {
  const brackets = new Set(
    items.map(agendaAgeBracket).filter((b): b is string => Boolean(b)),
  );
  return [...brackets].sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

/** Matches a link's `?leeftijd=` value to a bracket on offer. Accepts the
 * bracket itself ("20-39", "35+") or just its lower age ("20", "35"); a "+"
 * typed in a link arrives as a space, so that is ignored. */
export function resolveAgendaAgeParam(raw: string, brackets: string[]): string {
  const wanted = raw.replace(/[\s+]/g, "");
  if (!wanted) return "";
  return (
    brackets.find(
      (bracket) =>
        bracket.replace("+", "") === wanted ||
        String(parseInt(bracket, 10)) === wanted,
    ) ?? ""
  );
}

/** Matches a link's `?city=` / `?stad=` value to a city on offer, by name
 * or slug and regardless of case ("utrecht", "den-haag", "Den Haag"). */
export function resolveAgendaCityParam(raw: string, cities: string[]): string {
  const slug = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "-");
  const wanted = slug(raw);
  if (!wanted) return "";
  return cities.find((city) => slug(city) === wanted) ?? raw.trim();
}

export function filterAgendaByAge(
  items: EnrichedExperience[],
  bracket: string,
): EnrichedExperience[] {
  if (!bracket) return items;
  return items.filter((item) => agendaAgeBracket(item) === bracket);
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

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

/** Chronological order; status (bookable vs sold out) does not affect sort. */
export function orderGirlsOnlyEventsForDisplay(
  items: EnrichedExperience[],
  locale: Locale,
): EnrichedExperience[] {
  return sortAgendaTimeline(items, locale);
}

export function getNextBookableGirlsOnlyEvent(
  items: EnrichedExperience[],
): EnrichedExperience | undefined {
  const { bookable } = partitionGirlsOnlyEvents(items);
  return bookable[0];
}

export function getUpcomingGirlsOnlyEvents(
  items: EnrichedExperience[],
  limit = 3,
): EnrichedExperience[] {
  const { bookable, soldOut } = partitionGirlsOnlyEvents(items);
  return [...bookable, ...soldOut].slice(0, limit);
}

export function resolveGirlsOnlyPrimaryCta(
  options: {
    label: string;
    href?: string;
  },
): { href: string; label: string } {
  return {
    href: options.href ?? "#top",
    label: options.label,
  };
}

export function formatGirlsOnlyBookCtaLabel(
  experience: EnrichedExperience,
  locale: Locale,
): string {
  const datePart = experience.dateTime.split(" · ")[0] ?? experience.dateTime;
  const price = `€${experience.price}`;
  return locale === "nl"
    ? `Boek ${datePart} · ${experience.city} · ${price}`
    : `Book ${datePart} · ${experience.city} · ${price}`;
}

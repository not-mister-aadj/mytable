import type { ExperienceItem } from "@/i18n/types";
import { showViewCount } from "@/lib/env";
import {
  getLowestTierPerPersonEuros,
  MIN_BOOKING_SEATS,
} from "@/lib/booking-tiers";

export function getSpotsLeft(experience: ExperienceItem): number | null {
  if (
    experience.capacity !== undefined &&
    experience.spotsSold !== undefined
  ) {
    return Math.max(0, experience.capacity - experience.spotsSold);
  }
  switch (experience.status) {
    case "soldOut":
    case "closed":
      return 0;
    case "almostFull":
      return 4;
    case "available":
      return 12;
    case "new":
      return 16;
    default:
      return null;
  }
}

export function getViewsThisWeek(experienceId: string): number | null {
  if (!showViewCount()) return null;
  let hash = 0;
  for (let i = 0; i < experienceId.length; i++) {
    hash = (hash + experienceId.charCodeAt(i) * 7) % 100;
  }
  return 22 + (hash % 28);
}

export function formatPerPerson(price: number, label: string): string {
  return label.replace("{price}", String(price));
}

export function formatFromPerPerson(basePrice: number, label: string): string {
  const fromPrice =
    Number.isFinite(basePrice) && basePrice > 0
      ? Math.round(basePrice)
      : getLowestTierPerPersonEuros();
  return label.replace("{price}", String(fromPrice));
}

export const SPOTS_URGENCY_THRESHOLD = 15;

/** A freshly published event starts at (near-)full capacity, so showing its
 * real spots-left count from the first visitor makes even a well-selling
 * event look unimpressive (and for a small-capacity format like Sunday
 * Table, that count is basically always "urgent"). Hide the number until
 * real demand has proven itself. Catalog items with no tracked spotsSold
 * fall through unchanged, since there's nothing to gate on. */
export const SPOTS_VISIBLE_FROM_SOLD = 10;

export function hasEnoughSoldToShowSpots(spotsSold?: number): boolean {
  return spotsSold === undefined || spotsSold >= SPOTS_VISIBLE_FROM_SOLD;
}

export function shouldShowSpotsLeftBadge(
  spotsLeft: number | null,
  spotsSold?: number,
): spotsLeft is number {
  return (
    spotsLeft !== null &&
    spotsLeft > 0 &&
    spotsLeft <= SPOTS_URGENCY_THRESHOLD &&
    hasEnoughSoldToShowSpots(spotsSold)
  );
}

export function formatSpotsBadge(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function formatViewsLabel(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function canReserve(experience: ExperienceItem): boolean {
  if (experience.status === "closed" || experience.status === "comingSoon")
    return false;
  const left = getSpotsLeft(experience);
  if (left !== null) return left >= MIN_BOOKING_SEATS;
  return experience.status !== "soldOut";
}

export function getEventIdForCheckout(experience: ExperienceItem): string | null {
  return experience.eventDbId ?? null;
}

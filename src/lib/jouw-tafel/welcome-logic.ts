// The "Jouw tafel" account welcome: who gets it and which variant. Pure and
// unit tested (npx tsx --test src/lib/jouw-tafel/*.test.ts).

import { isEventClosedForBooking } from "@/lib/event-visibility";
import { cityTables, displayCity, supportedCity, type QuizEvent } from "@/lib/jouw-tafel/logic";

/** Sent this long after the quiz is completed. */
export const ACCOUNT_WELCOME_DELAY_MS = 30 * 60 * 1000;

/** Never further back than this, even after a cron outage. */
export const ACCOUNT_WELCOME_MAX_LOOKBACK_MS = 2 * 24 * 60 * 60 * 1000;

/** Only quizzes completed from this moment on (the deploy), so older
 * accounts are never mailed. ACCOUNT_WELCOME_SINCE (ISO) overrides it. */
export const ACCOUNT_WELCOME_DEFAULT_SINCE = "2026-10-05T00:00:00.000Z";

/** True when an account whose quiz was completed at `completedAt` (epoch
 * ms) is due for the welcome now. */
export function isAccountWelcomeDue(completedAt: number | undefined, now: number, since: number): boolean {
  if (!completedAt || !Number.isFinite(completedAt)) return false;
  if (completedAt < since) return false;
  if (completedAt > now - ACCOUNT_WELCOME_DELAY_MS) return false;
  return now - completedAt <= ACCOUNT_WELCOME_MAX_LOOKBACK_MS;
}

export type AccountWelcomeVariant = { variant: "open" | "none"; cities: string[] };

/**
 * "open" with the cities (of hers) that have a bookable table; otherwise
 * "none" with every city she chose (also places outside our cities).
 */
export function accountWelcomeVariant(
  chosenCities: readonly string[],
  events: readonly QuizEvent[],
  now: number,
  locale: "nl" | "en",
): AccountWelcomeVariant {
  const open = chosenCities.filter((raw) => {
    const city = supportedCity(raw);
    if (!city) return false;
    return cityTables([...events], city, now).some(
      (e) => !e.comingSoon && e.capacity > e.spotsSold && !isEventClosedForBooking(new Date(e.startsAt), new Date(now)),
    );
  });
  const show = (list: readonly string[]) => [...new Set(list.map((c) => displayCity(supportedCity(c) ?? c, locale)))];
  if (open.length > 0) return { variant: "open", cities: show(open) };
  return { variant: "none", cities: show(chosenCities) };
}

import type { Locale } from "@/i18n/config";

export type SeatingPreference = "own_table" | "join_others";

export function isSeatingPreference(value: unknown): value is SeatingPreference {
  return value === "own_table" || value === "join_others";
}

export function defaultSeatingForSeats(seats: number): SeatingPreference {
  return seats >= 2 ? "own_table" : "join_others";
}

export function formatSeatingPreference(
  preference: SeatingPreference,
  locale: Locale,
): string {
  if (locale === "en") {
    return preference === "own_table"
      ? "Own table for their group"
      : "Join others at the table";
  }
  return preference === "own_table"
    ? "Eigen tafel voor hun groep"
    : "Aanschuiven bij anderen";
}

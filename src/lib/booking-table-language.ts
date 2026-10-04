import type { Locale } from "@/i18n/config";

export type TableLanguagePreference =
  | "both_fine"
  | "prefer_dutch"
  | "prefer_english";

export const DEFAULT_TABLE_LANGUAGE_PREFERENCE: TableLanguagePreference =
  "both_fine";

/** Sunday Socials where English speakers can buy a ticket, by event id. On
 * every other Sunday Social, picking "English" on the date page offers a
 * "notify me" sign-up instead of a ticket, and checkout refuses English-only
 * bookings, so nobody who only speaks English ends up at a Dutch table.
 * Add an event here once it can seat an English-speaking table. */
const ENGLISH_SUNDAY_TABLE_EVENT_IDS: ReadonlySet<string> = new Set([
  // Rotterdam, Bar Juni, 25 October 2026 (35+)
  "76e4b79f-af75-42ff-bee3-80ecf9cf45d7",
  // Rotterdam, Bar Juni, 1 November 2026 (20-39)
  "1bcdeabb-10e8-4655-8ed6-f55dea38b76c",
]);

export function isEnglishOpenForSundayTable(eventId: string): boolean {
  return ENGLISH_SUNDAY_TABLE_EVENT_IDS.has(eventId);
}

export function isTableLanguagePreference(
  value: unknown,
): value is TableLanguagePreference {
  return (
    value === "both_fine" ||
    value === "prefer_dutch" ||
    value === "prefer_english"
  );
}

export function formatTableLanguagePreference(
  preference: TableLanguagePreference,
  locale: Locale,
): string {
  if (locale === "en") {
    if (preference === "prefer_dutch") return "Prefer Dutch if possible";
    if (preference === "prefer_english") return "Prefer English if possible";
    return "Dutch or English, both fine";
  }
  if (preference === "prefer_dutch") return "Liever Nederlands";
  if (preference === "prefer_english") return "Liever Engels";
  return "Nederlands of Engels, prima";
}

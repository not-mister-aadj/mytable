import type { Locale } from "@/i18n/config";

export type TableLanguagePreference = "both_fine" | "prefer_dutch";

export const DEFAULT_TABLE_LANGUAGE_PREFERENCE: TableLanguagePreference =
  "both_fine";

export function isTableLanguagePreference(
  value: unknown,
): value is TableLanguagePreference {
  return value === "both_fine" || value === "prefer_dutch";
}

export function formatTableLanguagePreference(
  preference: TableLanguagePreference,
  locale: Locale,
): string {
  if (locale === "en") {
    return preference === "prefer_dutch"
      ? "Prefer Dutch if possible"
      : "Dutch or English, both fine";
  }
  return preference === "prefer_dutch"
    ? "Liever Nederlands"
    : "Nederlands of Engels, prima";
}

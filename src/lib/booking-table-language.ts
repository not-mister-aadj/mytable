import type { Locale } from "@/i18n/config";

export type TableLanguagePreference =
  | "both_fine"
  | "prefer_dutch"
  | "prefer_english";

export const DEFAULT_TABLE_LANGUAGE_PREFERENCE: TableLanguagePreference =
  "both_fine";

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

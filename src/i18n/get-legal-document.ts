import type { Locale } from "@/i18n/config";
import type { LegalDocumentContent } from "@/i18n/legal-types";
import { privacyEn, termsEn } from "@/i18n/legal-en";
import { privacyNl, termsNl } from "@/i18n/legal-nl";

export type LegalDocumentKind = "terms" | "privacy";

export function getLegalDocument(
  locale: Locale,
  kind: LegalDocumentKind,
): LegalDocumentContent {
  if (locale === "en") {
    return kind === "terms" ? termsEn : privacyEn;
  }
  return kind === "terms" ? termsNl : privacyNl;
}

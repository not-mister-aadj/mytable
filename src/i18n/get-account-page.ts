import type { Locale } from "@/i18n/config";
import { accountPageEn } from "@/i18n/account-en";
import { accountPageNl } from "@/i18n/account-nl";

export function getAccountPageLabels(locale: Locale) {
  return locale === "en" ? accountPageEn : accountPageNl;
}

import type { Locale } from "@/i18n/config";
import { waitlistPageEn } from "@/i18n/waitlist-page-en";
import { waitlistPageNl } from "@/i18n/waitlist-page-nl";
import type { WaitlistPageLabels } from "@/i18n/waitlist-page.types";

export function getWaitlistPageLabels(locale: Locale): WaitlistPageLabels {
  return locale === "en" ? waitlistPageEn : waitlistPageNl;
}

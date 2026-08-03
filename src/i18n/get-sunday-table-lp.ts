import type { Locale } from "@/i18n/config";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";
import { sundayTableLpEn } from "@/i18n/sunday-table-lp-en";
import { sundayTableLpNl } from "@/i18n/sunday-table-lp-nl";

export function getSundayTableLpLabels(locale: Locale): SundayTableLpLabels {
  return locale === "en" ? sundayTableLpEn : sundayTableLpNl;
}

export function fillCity(template: string, city: string): string {
  return template.replaceAll("{city}", city);
}

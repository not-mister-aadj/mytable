import type { Locale } from "@/i18n/config";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";
import { sundayTableLpEn } from "@/i18n/sunday-table-lp-en";
import { sundayTableLpNl } from "@/i18n/sunday-table-lp-nl";
import type { SundayTableCityLabels } from "@/i18n/sunday-table-city.types";
import { sundayTableCityEn } from "@/i18n/sunday-table-city-en";
import { sundayTableCityNl } from "@/i18n/sunday-table-city-nl";

export function getSundayTableLpLabels(locale: Locale): SundayTableLpLabels {
  return locale === "en" ? sundayTableLpEn : sundayTableLpNl;
}

export function getSundayTableCityLabels(locale: Locale): SundayTableCityLabels {
  return locale === "en" ? sundayTableCityEn : sundayTableCityNl;
}

export function fillCity(template: string, city: string): string {
  return template.replaceAll("{city}", city);
}

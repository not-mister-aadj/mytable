import type { Locale } from "@/i18n/config";
import type { FormatLpLabels } from "@/i18n/format-lp.types";
import { wineTastingLpEn } from "@/i18n/wine-tasting-lp-en";
import { wineTastingLpNl } from "@/i18n/wine-tasting-lp-nl";
import { wineWalkLpEn } from "@/i18n/wine-walk-lp-en";
import { wineWalkLpNl } from "@/i18n/wine-walk-lp-nl";
import { chefsSpecialLpEn } from "@/i18n/chefs-special-lp-en";
import { chefsSpecialLpNl } from "@/i18n/chefs-special-lp-nl";

export function getWineTastingLpLabels(locale: Locale): FormatLpLabels {
  return locale === "en" ? wineTastingLpEn : wineTastingLpNl;
}

export function getWineWalkLpLabels(locale: Locale): FormatLpLabels {
  return locale === "en" ? wineWalkLpEn : wineWalkLpNl;
}

export function getChefsSpecialLpLabels(locale: Locale): FormatLpLabels {
  return locale === "en" ? chefsSpecialLpEn : chefsSpecialLpNl;
}

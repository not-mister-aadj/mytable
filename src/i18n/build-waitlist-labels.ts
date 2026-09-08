import { sundayTableWaitlistNl } from "@/i18n/sunday-table-lp-nl";
import { sundayTableWaitlistEn } from "@/i18n/sunday-table-lp-en";
import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";

/** The Sunday Table waitlist copy is ~97% identical across every format
 * page — only a handful of lines mention "tafel"/"table" specifically.
 * Each format page overrides just those instead of re-copying the whole
 * ~150-line block. */
type WaitlistOverrides = {
  body: string;
  questionsBody: string;
  successBody: string;
  tableTypeTitle: string;
};

function buildWaitlistLabels(
  base: SundayTableLpLabels["waitlist"],
  overrides: WaitlistOverrides,
): SundayTableLpLabels["waitlist"] {
  return {
    ...base,
    body: overrides.body,
    questionsBody: overrides.questionsBody,
    successBody: overrides.successBody,
    tableType: { ...base.tableType, title: overrides.tableTypeTitle },
  };
}

export function buildWaitlistLabelsNl(
  overrides: WaitlistOverrides,
): SundayTableLpLabels["waitlist"] {
  return buildWaitlistLabels(sundayTableWaitlistNl, overrides);
}

export function buildWaitlistLabelsEn(
  overrides: WaitlistOverrides,
): SundayTableLpLabels["waitlist"] {
  return buildWaitlistLabels(sundayTableWaitlistEn, overrides);
}

import type { SundayTableLpLabels } from "@/i18n/sunday-table-lp.types";

/** Shared landing-page copy shape for the single-experience formats
 * (wine tasting, wine walk, chef's special) — a lighter-weight sibling of
 * SundayTableLpLabels, reusing its `waitlist` block verbatim. */
export type FormatLpLabels = {
  meta: {
    title: string;
    description: string;
    /** `{city}` template, filled in on the per-city route. */
    titleCity?: string;
    descriptionCity?: string;
  };
  brand: string;
  socialProof: string;
  headline: string;
  /** `{city}` template for the per-city route. */
  headlineCity?: string;
  line: string;
  lineCity?: string;
  cta: string;
  ctaHint: string;
  secondaryCta: string;
  how: {
    eyebrow: string;
    title: string;
    body: string;
    steps: Array<{ title: string; body: string }>;
  };
  included: {
    eyebrow: string;
    title: string;
    items: Array<{ title: string; body: string }>;
    note: string;
  };
  proof: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  final: {
    title: string;
    titleCity?: string;
    body: string;
    cta: string;
  };
  waitlist: SundayTableLpLabels["waitlist"];
};

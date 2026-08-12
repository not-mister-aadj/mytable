import type {
  WaitlistWhyId,
  WaitlistCompanyId,
  WaitlistTableTypeId,
} from "@/i18n/waitlist-page.types";

export type SundayTableLpLabels = {
  meta: {
    title: string;
    titleCity: string;
    description: string;
    descriptionCity: string;
  };
  brand: string;
  /** Early social proof, above the headline */
  socialProof: string;
  headline: string;
  headlineCity: string;
  line: string;
  lineCity: string;
  /** Compact hero benefits: bold keyphrase + rest of line */
  heroBenefits: Array<{ bold: string; text: string }>;
  cta: string;
  /** Price anchor under primary CTAs, e.g. "Vanaf €10/maand" */
  ctaHint: string;
  /** Risk reversal under the primary CTA */
  ctaRisk: string;
  /** One-line version of ctaRisk for the mobile sticky bar (limited vertical space) */
  ctaRiskShort: string;
  /** Short name for the guarantee, shown bold in the guarantee badge */
  guaranteeName: string;
  secondaryCta: string;
  /** Top announcement bar + WhatsApp sale modal */
  sale: {
    bar: string;
    barMobile: string;
    eyebrow: string;
    title: string;
    body: string;
    girlsOnly: string;
    girlsOnlyHint: string;
    mixed: string;
    mixedHint: string;
    close: string;
    dialogAria: string;
  };
  how: {
    eyebrow: string;
    title: string;
    body: string;
    steps: Array<{ title: string; body: string }>;
  };
  tables: {
    eyebrow: string;
    title: string;
    body: string;
    girlsOnlyTitle: string;
    girlsOnlyBody: string;
    mixedTitle: string;
    mixedBody: string;
  };
  /** How tables get matched — honesty about the real signals we use (energy type, table choice, city) */
  matching: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{ title: string; body: string }>;
  };
  proof: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
  };
  included: {
    eyebrow: string;
    title: string;
    items: Array<{ title: string; body: string }>;
    note: string;
  };
  pricing: {
    eyebrow: string;
    title: string;
    body: string;
    trialLabel: string;
    trialPrice: string;
    trialHint: string;
    popularLabel: string;
    popularPrice: string;
    popularHint: string;
    yearLabel: string;
    yearPrice: string;
    yearHint: string;
    /** Why curation costs more than a self-service marketplace, shown near the price table */
    justification: string;
  };
  cities: {
    eyebrow: string;
    title: string;
    body: string;
    comingSoon: string;
    comingSoonCities: string;
  };
  final: {
    title: string;
    titleCity: string;
    body: string;
    cta: string;
    /** Honest early-stage framing — no fabricated scale numbers */
    earlyNote: string;
  };
  /** Objection-handling FAQ, shown right before the final CTA */
  faq: {
    eyebrow: string;
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  /** Waitlist capture modal — replaces the old direct-to-checkout CTA */
  waitlist: {
    eyebrow: string;
    title: string;
    body: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    cityLabel: string;
    cityOther: string;
    cityOtherPlaceholder: string;
    submit: string;
    submitting: string;
    privacyNote: string;
    error: string;
    questionsTitle: string;
    questionsBody: string;
    skip: string;
    back: string;
    continueCta: string;
    /** e.g. "Vraag {n} van {total}" */
    progress: string;
    why: {
      title: string;
      options: Array<{ id: WaitlistWhyId; label: string }>;
    };
    company: {
      title: string;
      options: Array<{ id: WaitlistCompanyId; label: string }>;
    };
    tableType: {
      title: string;
      options: Array<{ id: WaitlistTableTypeId; label: string }>;
    };
    successTitle: string;
    successBody: string;
    successNext: string;
    whatsappGirlsLabel: string;
    whatsappMixedLabel: string;
    close: string;
    dialogAria: string;
  };
};

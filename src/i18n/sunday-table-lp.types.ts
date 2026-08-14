import type {
  WaitlistWhyId,
  WaitlistCompanyId,
  WaitlistTableTypeId,
  WaitlistGenderId,
  WaitlistAgeRangeId,
  WaitlistVibeId,
  WaitlistBudgetId,
  WaitlistExperienceId,
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
  cta: string;
  /** Reassurance under primary CTAs, e.g. "Gratis. Geen spam." */
  ctaHint: string;
  secondaryCta: string;
  how: {
    eyebrow: string;
    title: string;
    body: string;
    steps: Array<{ title: string; body: string }>;
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
    formatLabel: string;
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
      /** Placeholder for the free-text field shown when "other" is picked */
      otherPlaceholder: string;
    };
    company: {
      title: string;
      options: Array<{ id: WaitlistCompanyId; label: string }>;
    };
    tableType: {
      title: string;
      options: Array<{ id: WaitlistTableTypeId; label: string }>;
    };
    gender: {
      title: string;
      options: Array<{ id: WaitlistGenderId; label: string }>;
    };
    ageRange: {
      title: string;
      options: Array<{ id: WaitlistAgeRangeId; label: string }>;
    };
    vibe: {
      title: string;
      options: Array<{ id: WaitlistVibeId; label: string }>;
    };
    budget: {
      title: string;
      options: Array<{ id: WaitlistBudgetId; label: string }>;
    };
    experience: {
      title: string;
      options: Array<{ id: WaitlistExperienceId; label: string }>;
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

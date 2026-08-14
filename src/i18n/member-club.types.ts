export interface MemberClubLabels {
  meta: {
    title: string;
    description: string;
  };
  pageTitle: string;
  hero: {
    brand: string;
    title: string;
    line: string;
    memberLine: string;
    cta: string;
    secondaryCta: string;
  };
  tableFilter: {
    girlsOnly: string;
    mixed: string;
  };
  languageFilter: {
    label: string;
    nl: string;
    en: string;
    both: string;
  };
  happening: {
    title: string;
    subtitle: string;
    eventTitle: string;
    status: string;
    empty: string;
    filterCities: string;
    filterTables: string;
    seatsGoingFast: string;
    seatsLeftFew: string;
    comingSoon: string;
  };
  explain: {
    closeAria: string;
    cta: string;
    locationNote: string;
    mixed: {
      title: string;
      body: string;
    };
    girlsOnly: {
      title: string;
      body: string;
    };
  };
  paywall: {
    closeAria: string;
    eyebrow: string;
    headline: string;
    eventLine: string;
    perksTitle: string;
    perks: Array<{ title: string; body: string }>;
    consumptionsNote: string;
    plansTitle: string;
    popular: string;
    save: string;
    perMonth: string;
    legal: string;
    guarantee: string;
    continue: string;
    summary: string;
    promoCodeLabel: string;
    promoCodePlaceholder: string;
    promoCodeHint: string;
    promoCodeApply: string;
    promoCodeApplying: string;
    promoCodeApplied: string;
    promoCodeRemove: string;
    promoCodeInvalid: string;
    promoCodeTrialOnly: string;
    /** Placeholders: {code}, {percent}, {final} */
    promoCodeAppliedLine: string;
    successTitle: string;
    successBody: string;
    successCta: string;
    errorGeneric: string;
    plans: Array<{
      id: "1m" | "5m" | "12m";
      label: string;
      price: string;
      compareAt?: string;
      /** Shown under the price instead of the generic perMonth template when set. */
      hint?: string;
      perMonth: string;
      savePercent?: string;
    }>;
  };
  membership: {
    eyebrow: string;
    titleActive: string;
    titleInactive: string;
    planLabel: string;
    renews: string;
    cancelScheduled: string;
    manageBilling: string;
    changePlan: string;
    upgradeTo12m: string;
    upgradeScheduled: string;
    upgradePending: string;
    changePlanBusy: string;
    changePlanSuccess: string;
    checkoutSuccess: string;
    checkoutCancel: string;
  };
  checkoutOutcome: {
    confirmedTitle: string;
    confirmedBody: string;
    confirmedCta: string;
    calendarCta: string;
    cancelledTitle: string;
    cancelledBody: string;
    cancelledCta: string;
    pendingTitle: string;
    pendingBody: string;
  };
  rsvp: {
    title: string;
    subtitle: string;
    empty: string;
    confirmed: string;
    cancelled: string;
    pending: string;
    plusOne: string;
    plusOneHint: string;
    cancelGoing: string;
    reactivate: string;
    bookSeat: string;
    viewTable: string;
    girlsOnly: string;
    mixed: string;
    signupOpen: string;
    signupUrgent: string;
    signupClosed: string;
    signupClosedError: string;
    onboardingRequired: string;
    girlsOnlyRestricted: string;
    soldOut: string;
    confirmDismiss: string;
    confirmPlusOneAddTitle: string;
    confirmPlusOneAddBody: string;
    confirmPlusOneAddCta: string;
    confirmPlusOneRemoveTitle: string;
    confirmPlusOneRemoveBody: string;
    confirmPlusOneRemoveCta: string;
    confirmReplaceSeatTitle: string;
    /** Placeholders: {fromCity}, {fromTable}, {toCity}, {toTable} */
    confirmReplaceSeatBody: string;
    confirmReplaceSeatCta: string;
    confirmReserveTitle: string;
    confirmReserveBody: string;
    confirmReserveCta: string;
    confirmCancelGoingTitle: string;
    confirmCancelGoingBody: string;
    confirmCancelGoingCta: string;
  };
  invite: {
    eyebrow: string;
    title: string;
    body: string;
    copyLink: string;
    copied: string;
  };
  benefits: {
    title: string;
    subtitle: string;
    eyebrow: string;
    items: Array<{ title: string; body: string }>;
    note: string;
  };
  roadmap: {
    title: string;
    subtitle: string;
    eyebrow: string;
    items: string[];
  };
  faq: {
    title: string;
    eyebrow: string;
    items: Array<{ question: string; answer: string }>;
  };
}

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
  };
  tableFilter: {
    girlsOnly: string;
    mixed: string;
  };
  happening: {
    title: string;
    subtitle: string;
    eventTitle: string;
    status: string;
    empty: string;
    filterCities: string;
    filterTables: string;
    seatsLeft: string;
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
    continue: string;
    summary: string;
    successTitle: string;
    successBody: string;
    successCta: string;
    errorGeneric: string;
    plans: Array<{
      id: "1m" | "6m";
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
    upgradeTo6m: string;
    switchToTrial: string;
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
  };
  invite: {
    eyebrow: string;
    title: string;
    body: string;
    whatsapp: string;
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

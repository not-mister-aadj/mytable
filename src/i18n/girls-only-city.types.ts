export type GirlsOnlyCityPageLabels = {
  meta: {
    /** Without brand suffix; page appends "| MyTable" */
    title: string;
    description: string;
  };
  breadcrumbHome: string;
  breadcrumbGirlsOnly: string;
  hero: {
    regionLabel: string;
    /** Primary SEO H1, e.g. "Girls-only wijnproeverij in Amsterdam" */
    headline: string;
    subheadline: string;
    trustBullets: string[];
    ctaBook: string;
    ctaPriority: string;
    imageAlt: string;
  };
  events: {
    eyebrow: string;
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
    viewAll: string;
  };
  priority: {
    eyebrow: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    cta: string;
    success: string;
    error: string;
    privacyNote: string;
  };
  included: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: { title: string; description: string }[];
  };
  local: {
    eyebrow: string;
    title: string;
    body: string;
    points: string[];
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    steps: { title: string; description: string }[];
  };
  faq: {
    title: string;
    items: { question: string; answer: string }[];
  };
  otherCities: {
    title: string;
    subtitle: string;
    nationalCta: string;
  };
  finalCta: {
    title: string;
    subtitle: string;
    ctaBook: string;
    ctaPriority: string;
  };
  status: {
    available: string;
    almostFull: string;
    soldOut: string;
    closed: string;
    new: string;
  };
  femaleOnlyBadge: string;
  reserveCta: string;
  viewTableCta: string;
  perPersonFrom: string;
  socialPromise: string;
};

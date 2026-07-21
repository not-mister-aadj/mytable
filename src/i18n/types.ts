export type ExperienceStatusKey =
  | "available"
  | "almostFull"
  | "soldOut"
  | "closed"
  | "new";

export type AgendaTabKey = "all" | "girlsOnly" | "mixed";

import type { ImageSettings } from "@/lib/image-settings";

export type ExperienceMoodKey = "tastings" | "wineWalk" | "chefsSpecial";

export interface ExperienceExpectItem {
  title: string;
  description: string;
}

export interface ExperienceFaqItem {
  question: string;
  answer: string;
}

export interface ExperienceVenue {
  kind?: "venue" | "locationTbd";
  name: string;
  /** Straat + huisnummer, uit venue admin */
  address?: string;
  area: string;
  atmosphere: string;
  description: string;
  image: string;
  imageSettings?: ImageSettings;
  /** Headline for locationTbd placeholder card */
  title?: string;
}

export interface ExperienceIncludedItem {
  value: string;
  label: string;
}

export interface ExperienceFlowStep {
  title: string;
  description: string;
}

export interface ExperienceGuestQuote {
  quote: string;
  name: string;
  age?: number;
  detail?: string;
}

export interface ExperienceMoodContent {
  tagline: string;
  description: string;
  whatToExpect: ExperienceExpectItem[];
  experienceFlow: ExperienceFlowStep[];
  guestQuotes: ExperienceGuestQuote[];
  socialParagraphs: string[];
  gallery: string[];
  duration: string;
  included: string;
  walkingDistance?: string;
  faq: ExperienceFaqItem[];
}

export interface ExperiencePageLabels {
  viewTableCta: string;
  secondaryCta: string;
  heroTrustBar: string;
  heroTrustFooter: string;
  heroSpotsHint: string;
  heroBenefitBullets: string[];
  pillSoloTogether: string;
  perPerson: string;
  perPersonFrom: string;
  includedEyebrow: string;
  includedTitle: string;
  includedSubtitle: string;
  includedItems: ExperienceIncludedItem[];
  aboutTitle: string;
  expectTitle: string;
  flowEyebrow: string;
  flowTitle: string;
  flowExpandCta: string;
  venuesTitle: string;
  venuesSubtitle: string;
  guestQuotesTitle: string;
  guestQuotesEyebrow: string;
  midCtaEyebrow: string;
  midCtaTitle: string;
  midCtaTrustLine: string;
  routeTitle: string;
  routeMapEyebrow: string;
  routeMapTitle: string;
  routeSubtitle: string;
  socialTitle: string;
  socialSubtitle: string;
  galleryTitle: string;
  practicalTitle: string;
  faqTitle: string;
  relatedTitle: string;
  finalCtaHeadline: string;
  finalCtaSubheadline: string;
  finalCtaPrimary: string;
  finalCtaSecondary: string;
  bookingDate: string;
  bookingTime: string;
  bookingCity: string;
  bookingPrice: string;
  bookingSpots: string;
  bookingEmail: string;
  bookingName: string;
  bookingDietary: string;
  bookingDietaryPlaceholder: string;
  bookingTiers: {
    legend: string;
    perPerson: string;
    perPersonFrom: string;
    bestValue: string;
    mostChosen: string;
    seatOne: string;
    seatOther: string;
    seatsFrom: string;
    groupSeatsLabel: string;
    seatsJoinOthers: string;
    seatsOwnTable: string;
    soloTitle: string;
    duoTitle: string;
    groupTitle: string;
    soloCta: string;
    duoCta: string;
    groupCta: string;
  };
  bookingSeatingLabel: string;
  bookingSeatingOwn: string;
  bookingSeatingOwnHint: string;
  bookingSeatingJoin: string;
  bookingSeatingJoinHint: string;
  bookingTableLanguageLabel: string;
  bookingTableLanguageHint: string;
  bookingTableLanguageBoth: string;
  bookingTableLanguagePreferDutch: string;
  bookingStepNext: string;
  bookingStepBack: string;
  bookingFemaleOnlyNote: string;
  bookingPriorityList: string;
  bookingMediaConsent: string;
  bookingMediaConsentReadMore: string;
  bookingMediaConsentTerms: string;
  bookingMediaConsentPrivacy: string;
  bookingMediaConsentAnd: string;
  spotsLeftBadge: string;
  bookingViewsLabel: string;
  bookingTrustBullets: string[];
  trustLines: string[];
  practicalLabels: {
    startTime: string;
    duration: string;
    city: string;
    included: string;
    dietary: string;
    solo: string;
    payment: string;
    exchange: string;
    walking: string;
    weather: string;
    arrival: string;
    routeReveal: string;
    groupSize: string;
  };
  practicalValues: {
    dietary: string;
    solo: string;
    payment: string;
    exchange: string;
    weather: string;
    arrival: string;
    routeReveal: string;
    groupSize: string;
  };
  spotsByStatus: Record<ExperienceStatusKey, string>;
  closedCta: string;
  moods: Record<ExperienceMoodKey, ExperienceMoodContent>;
}

export interface BookingOutcomeLabels {
  success: {
    eyebrow: string;
    headline: string;
    subtext: string;
    primaryCta: string;
    secondaryCta: string;
  };
  failed: {
    eyebrow: string;
    headline: string;
    subtext: string;
    primaryCta: string;
    secondaryCta: string;
  };
  pending: {
    eyebrow: string;
    headline: string;
    subtext: string;
    timeoutSubtext: string;
  };
  summary: {
    title: string;
    date: string;
    city: string;
    guests: string;
    amount: string;
    code: string;
    guestLabel: string;
  };
  nextSteps: {
    title: string;
    items: { title: string; description: string }[];
  };
  community: {
    title: string;
    body: string;
    galleryAlt: string;
  };
}

export interface ExperiencePageSectionLabels {
  venuesTitle: string;
  venuesSubtitle: string;
}

export interface ExperienceItem {
  id: string;
  slug?: string;
  tagline?: string;
  city: string;
  experienceName: string;
  /** Card/listing title when different from detail hero */
  cardTitle?: string;
  cardText?: string;
  cardImage?: string;
  cardImageSettings?: ImageSettings;
  heroImageSettings?: ImageSettings;
  category: string;
  experienceType?: string;
  pageSections?: ExperiencePageSectionLabels;
  dateTime: string;
  /** ISO timestamp for reliable sorting (from DB events). */
  startsAt?: string;
  price: number;
  status: ExperienceStatusKey;
  image: string;
  mood: ExperienceMoodKey;
  /** Pink-styled card with women-only badge */
  femaleOnly?: boolean;
  /** From database when USE_DB_EVENTS=true */
  capacity?: number;
  spotsSold?: number;
  /** UUID for checkout / admin */
  eventDbId?: string;
  atmosphereTags?: string[];
  customDescription?: string;
  customFaq?: ExperienceFaqItem[];
  galleryImages?: string[];
  galleryImageSettings?: ImageSettings[];
}

export interface AgendaTab {
  id: AgendaTabKey;
  label: string;
}

export interface Dictionary {
  meta: {
    title: string;
    description: string;
  };
  header: {
    nav: {
      experiences: string;
      girlsOnly: string;
      howItWorks: string;
      forVenues: string;
      faq: string;
      blog: string;
    };
    cta: string;
    languageSwitch: string;
    openMenu: string;
    closeMenu: string;
    homeAria: string;
  };
  hero: {
    headlineLine1: string;
    headlineLine2: string;
    subheadline: string;
    ctaPrimary: string;
    microcopy: string;
    nextTableLabel: string;
    imageAlt: string;
  };
  valueStrip: string[];
  experiences: {
    title: string;
    subtitle: string;
    status: Record<ExperienceStatusKey, string>;
    femaleOnlyBadge: string;
    reserveCta: string;
    viewAllCta: string;
    items: ExperienceItem[];
  };
  agenda: {
    hero: {
      title: string;
      subtitle: string;
      supportLine: string;
    };
    tabsAriaLabel: string;
    tabs: AgendaTab[];
    /** Shown under the filter when a specific tab is active */
    tabHints: Record<AgendaTabKey, string>;
    grid: {
      title: string;
      subtitle: string;
    };
    empty: {
      title: string;
      text: string;
      showAllCities: string;
    };
    status: Record<ExperienceStatusKey, string>;
    femaleOnlyBadge: string;
    reserveCta: string;
    items: ExperienceItem[];
  };
  concept: {
    title: string;
    subtitle: string;
    cards: { title: string; description: string }[];
  };
  howItWorks: {
    title: string;
    expandCta: string;
    steps: { title: string; description: string }[];
  };
  venueDiscovery: {
    title: string;
    subtitle: string;
    places: { name: string; city: string; image: string }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
  };
  venueCta: {
    title: string;
    subtitle: string;
    cta: string;
    benefits: { title: string; description: string }[];
  };
  newsletter: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    cityLabel: string;
    cta: string;
    success: string;
    error: string;
    cities: string[];
  };
  faq: {
    title: string;
    items: { question: string; answer: string }[];
  };
  experiencePage: ExperiencePageLabels;
  bookingOutcome: BookingOutcomeLabels;
  footer: {
    tagline: string;
    description: string;
    nationwide: string;
    columns: {
      explore: string;
      info: string;
      popularCities: string;
    };
    allCitiesCta: string;
    links: {
      experiences: string;
      howItWorks: string;
      forVenues: string;
      faq: string;
      blog: string;
      instagram: string;
      contact: string;
      terms: string;
      privacy: string;
      girlsOnly: string;
    };
    legal: {
      eyebrow: string;
      relatedLabel: string;
    };
    copyright: string;
  };
}

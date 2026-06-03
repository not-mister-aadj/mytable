export type ExperienceStatusKey =
  | "available"
  | "almostFull"
  | "soldOut"
  | "new";

export type AgendaTabKey =
  | "all"
  | "wineWalks"
  | "sharedDinners"
  | "tastings"
  | "sundayTables"
  | "mysteryTables";

export type ExperienceMoodKey = Exclude<AgendaTabKey, "all">;

export interface ExperienceExpectItem {
  title: string;
  description: string;
}

export interface ExperienceFaqItem {
  question: string;
  answer: string;
}

export interface ExperienceVenue {
  name: string;
  area: string;
  atmosphere: string;
  description: string;
  image: string;
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
  agendaCta: string;
  heroTrustBar: string;
  heroTrustFooter: string;
  heroSpotsHint: string;
  pillSoloTogether: string;
  perPerson: string;
  aboutTitle: string;
  expectTitle: string;
  flowTitle: string;
  venuesTitle: string;
  venuesSubtitle: string;
  guestQuotesTitle: string;
  routeTitle: string;
  routeMapEyebrow: string;
  routeMapTitle: string;
  routeSubtitle: string;
  routeOpenInApple: string;
  routeMapSetupHint: string;
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
    cancellation: string;
    walking: string;
    weather: string;
    arrival: string;
    routeReveal: string;
    groupSize: string;
  };
  practicalValues: {
    dietary: string;
    solo: string;
    cancellation: string;
    weather: string;
    arrival: string;
    routeReveal: string;
    groupSize: string;
  };
  spotsByStatus: Record<ExperienceStatusKey, string>;
  moods: Record<ExperienceMoodKey, ExperienceMoodContent>;
}

export interface ExperienceItem {
  id: string;
  slug?: string;
  tagline?: string;
  city: string;
  experienceName: string;
  category: string;
  dateTime: string;
  price: number;
  status: ExperienceStatusKey;
  image: string;
  mood: AgendaTabKey;
  /** Pink-styled card with women-only badge */
  femaleOnly?: boolean;
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
      howItWorks: string;
      forVenues: string;
      faq: string;
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
    nextTableTitle: string;
    nextTableCity: string;
    nextTableTime: string;
    nextTableIncluded: string;
    nextTableStatus: string;
    imageAlt: string;
  };
  valueStrip: string[];
  featuredCarousel: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cta: string;
    cards: {
      id: string;
      title: string;
      city: string;
      date: string;
      caption?: string;
      category: string;
      image: string;
      icon: "wine" | "dinner" | "table" | "walk" | "mystery";
    }[];
  };
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
    steps: { title: string; description: string }[];
  };
  venueDiscovery: {
    title: string;
    subtitle: string;
    categories: { title: string; image: string }[];
  };
  testimonials: {
    title: string;
    items: { quote: string; name: string; age: number }[];
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
    cities: string[];
  };
  faq: {
    title: string;
    items: { question: string; answer: string }[];
  };
  experiencePage: ExperiencePageLabels;
  footer: {
    tagline: string;
    links: {
      experiences: string;
      howItWorks: string;
      forVenues: string;
      faq: string;
      instagram: string;
      contact: string;
    };
    copyright: string;
  };
}

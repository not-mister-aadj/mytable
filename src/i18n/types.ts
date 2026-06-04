export type ExperienceStatusKey =
  | "available"
  | "almostFull"
  | "soldOut"
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
  name: string;
  area: string;
  atmosphere: string;
  description: string;
  image: string;
  imageSettings?: ImageSettings;
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
  routeMapCaption: string;
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
  moods: Record<ExperienceMoodKey, ExperienceMoodContent>;
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

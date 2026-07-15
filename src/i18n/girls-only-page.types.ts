import type { ExperienceStatusKey } from "./types";

export interface GirlsOnlyPageLabels {
  socialPromise: string;
  meta: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    subtitle: string;
    microcopy: string;
    trustLine: string;
    imageAlt: string;
    painHeadline: string;
    scarcityTemplate: string;
    featuredInHeroLabel: string;
  };
  cta: {
    viewAllSundays: string;
  };
  faq: {
    title: string;
    items: { question: string; answer: string }[];
  };
  headerNav: {
    tables: string;
    howItWorks: string;
    testimonials: string;
    faq: string;
    founder: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    subtitle: string;
    highlights: string[];
    cta: string;
  };
  benefits: {
    title: string;
    subtitle: string;
    items: { title: string; description: string }[];
  };
  events: {
    title: string;
    subtitle: string;
    empty: string;
    viewAll: string;
  };
  presaleSignup: {
    title: string;
    subtitle: string;
    nameLabel: string;
    namePlaceholder: string;
    citiesLabel: string;
    citiesHint: string;
    citiesRequired: string;
    cities: string[];
    emailLabel: string;
    emailPlaceholder: string;
    cta: string;
    success: string;
    error: string;
  };
  testimonials: {
    eyebrow: string;
    title: string;
  };
  founderStory: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    signOff: string;
    imageAlt: string;
  };
  finalCta: {
    title: string;
    button: string;
  };
  status: Record<ExperienceStatusKey, string>;
  femaleOnlyBadge: string;
  reserveCta: string;
  viewTableCta: string;
  perPersonFrom: string;
}

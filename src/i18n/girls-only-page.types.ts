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
    calloutLabel: string;
    calloutPain: string;
    calloutReassurance: string;
    calloutBody: string;
    imageAlt: string;
    factsIntro: string;
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
    whyJoin: string;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    sharedStep: { title: string; description: string };
    paths: {
      label: string;
      steps: { title: string; description: string }[];
    }[];
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
  };
  testimonials: {
    eyebrow: string;
    title: string;
  };
  finalCta: {
    title: string;
    button: string;
  };
  status: Record<ExperienceStatusKey, string>;
  femaleOnlyBadge: string;
  reserveCta: string;
  viewTableCta: string;
}

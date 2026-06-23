import type { ExperienceStatusKey } from "./types";

export interface GirlsOnlyPageLabels {
  socialPromise: string;
  toasts: {
    justNow: string;
  };
  meta: {
    title: string;
    description: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    trustLine: string;
    calloutLabel: string;
    calloutPain: string;
    calloutReassurance: string;
    calloutBody: string;
    imageAlt: string;
  };
  headerNav: {
    tables: string;
    howItWorks: string;
    whyJoin: string;
  };
  trust: {
    title: string;
    subtitle: string;
    badges: {
      girlsOnly: string;
      soldOut: string;
      limitedSeats: string;
      soloOrFriends: string;
    };
    viewAllTables: string;
    showMoreSoldOut: string;
  };
  howItWorks: {
    title: string;
    subtitle: string;
    steps: { title: string; description: string }[];
  };
  benefits: {
    title: string;
    subtitle: string;
    items: { title: string; description: string }[];
  };
  gallery: {
    eyebrow: string;
    title: string;
    subtitle: string;
    previousPhoto: string;
    nextPhoto: string;
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

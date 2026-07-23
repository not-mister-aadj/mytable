export type WaitlistInterestId =
  | "wine_tasting"
  | "chefs_special"
  | "wine_walk"
  | "aperitivo";

/** Why someone would buy / book */
export type WaitlistWhyId =
  | "discover_wines"
  | "discover_flavours"
  | "discover_places"
  | "no_organise"
  | "treat"
  | "new_city";

/** Bring people vs meet new people */
export type WaitlistCompanyId =
  | "meet_new"
  | "bring_friends"
  | "bring_partner"
  | "solo";

export type WaitlistTableTypeId = "girls_only" | "mixed";

export type WaitlistOptionCard<T extends string> = {
  id: T;
  title: string;
  description?: string;
};

export type WaitlistOutcome = {
  id: WaitlistInterestId;
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  imageAlt: string;
};

export type WaitlistPreferences = {
  interests: WaitlistInterestId[];
  why: WaitlistWhyId[];
  company: WaitlistCompanyId[];
  tableType: WaitlistTableTypeId[];
  cities: string[];
  regionFlexible: boolean;
};

export interface WaitlistPageLabels {
  meta: {
    title: string;
    description: string;
  };
  brand: string;
  progressLabel: string;
  back: string;
  next: string;
  start: string;
  trustLine: string;
  multiHint: string;
  intro: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  steps: {
    interests: {
      title: string;
      subtitle: string;
      required: string;
      options: WaitlistOptionCard<WaitlistInterestId>[];
    };
    why: {
      title: string;
      subtitle: string;
      required: string;
      options: WaitlistOptionCard<WaitlistWhyId>[];
    };
    company: {
      title: string;
      subtitle: string;
      required: string;
      options: WaitlistOptionCard<WaitlistCompanyId>[];
    };
    tableType: {
      title: string;
      subtitle: string;
      required: string;
      options: WaitlistOptionCard<WaitlistTableTypeId>[];
    };
    where: {
      title: string;
      subtitle: string;
      citiesHint: string;
      citiesRequired: string;
      cities: string[];
      flexibleLabel: string;
      flexibleHint: string;
    };
    contact: {
      title: string;
      subtitle: string;
      tease: string;
      choiceHint: string;
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      cta: string;
      submitting: string;
    };
  };
  outcomes: Record<WaitlistInterestId, WaitlistOutcome>;
  success: {
    eyebrow: string;
    waitlistNote: string;
    whatsappTitle: string;
    whatsappBody: string;
    whatsappCta: string;
    agendaLabel: string;
  };
  error: string;
  databaseUnavailable: string;
  breadcrumbHome: string;
  breadcrumbWaitlist: string;
}

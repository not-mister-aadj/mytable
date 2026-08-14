export type WaitlistInterestId =
  | "sunday_table"
  | "wine_tasting"
  | "chefs_special"
  | "wine_walk"
  | "food_walk"
  | "aperitivo";

/** Why someone would buy / book */
export type WaitlistWhyId =
  | "discover_wines"
  | "discover_flavours"
  | "discover_places"
  | "no_organise"
  | "treat"
  | "new_city"
  | "just_fun"
  | "other";

/** Bring people vs meet new people */
export type WaitlistCompanyId =
  | "meet_new"
  | "bring_friends"
  | "bring_partner"
  | "solo";

export type WaitlistTableTypeId = "girls_only" | "mixed" | "no_preference";

export type WaitlistGenderId = "female" | "male" | "other" | "unspecified";

export type WaitlistAgeRangeId = "18_24" | "25_34" | "35_44" | "45_plus";

/** People-first vs experience-first — what makes the evening for them */
export type WaitlistVibeId = "people" | "experience" | "both";

export type WaitlistBudgetId = "budget" | "premium" | "flexible";

/** Framed indirectly in copy as "discovering" vs "going deeper" */
export type WaitlistExperienceId = "curious" | "experienced";

/** How someone wants to join MyTable overall */
export type WaitlistJoinIntentId =
  | "meet_new"
  | "bring_someone"
  | "with_group"
  | "depends";

/** Willing-to-pay bands, chosen per experience */
export type WaitlistPriceRangeId =
  | "upto_50"
  | "50_75"
  | "75_100"
  | "100_plus";

/** Stored prefs on priority-list / signup rows (legacy waitlist shape). */
export type WaitlistPreferences = {
  interests: WaitlistInterestId[];
  /** Price bands the person is okay with, keyed by selected interest */
  priceRanges: Partial<Record<WaitlistInterestId, WaitlistPriceRangeId[]>>;
  why: WaitlistWhyId[];
  company: WaitlistCompanyId[];
  joinIntent: WaitlistJoinIntentId[];
  tableType: WaitlistTableTypeId[];
  cities: string[];
  regionFlexible: boolean;
  gender: WaitlistGenderId[];
  ageRange: WaitlistAgeRangeId[];
  vibe: WaitlistVibeId[];
  budget: WaitlistBudgetId[];
  experience: WaitlistExperienceId[];
  /** Free-text elaboration when why includes "other" */
  whyOther: string;
};

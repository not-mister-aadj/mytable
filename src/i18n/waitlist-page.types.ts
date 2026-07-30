export type WaitlistInterestId =
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
  | "new_city";

/** Bring people vs meet new people */
export type WaitlistCompanyId =
  | "meet_new"
  | "bring_friends"
  | "bring_partner"
  | "solo";

export type WaitlistTableTypeId = "girls_only" | "mixed" | "no_preference";

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
};

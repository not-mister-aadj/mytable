import type {
  WaitlistCompanyId,
  WaitlistInterestId,
  WaitlistPreferences,
  WaitlistPriceRangeId,
  WaitlistTableTypeId,
  WaitlistWhyId,
} from "@/i18n/waitlist-page.types";

export const INTEREST_LABELS: Record<WaitlistInterestId, string> = {
  wine_tasting: "Wijnproeverij",
  chefs_special: "Chef's Table",
  wine_walk: "Wine Walk",
  aperitivo: "Golden Hour Aperitivo",
};

export const PRICE_RANGE_LABELS: Record<WaitlistPriceRangeId, string> = {
  upto_50: "Tot €50",
  "50_75": "€50–€75",
  "75_100": "€75–€100",
  "100_plus": "€100–€130",
};

export const WHY_LABELS: Record<WaitlistWhyId, string> = {
  discover_wines: "Nieuwe wijnen ontdekken",
  discover_flavours: "Nieuwe smaken ontdekken",
  discover_places: "Nieuwe locaties ontdekken",
  no_organise: "Geen gedoe met plannen",
  treat: "Verjaardag of cadeau",
  new_city: "Nieuw in de stad",
};

export const COMPANY_LABELS: Record<WaitlistCompanyId, string> = {
  meet_new: "Nieuwe mensen ontmoeten",
  bring_friends: "Met vriendinnen of vrienden",
  bring_partner: "Met partner",
  solo: "Solo",
};

export const TABLE_TYPE_LABELS: Record<WaitlistTableTypeId, string> = {
  girls_only: "Girls only",
  mixed: "Gemengde tafel",
};

function mapIds<T extends string>(
  ids: T[] | undefined,
  labels: Record<T, string>,
): string[] {
  if (!ids?.length) return [];
  return ids.map((id) => labels[id] ?? id);
}

export function formatPriceRangesByInterest(
  preferences: WaitlistPreferences | null | undefined,
): string[] {
  const priceRanges = preferences?.priceRanges;
  if (!priceRanges) return [];

  const interestOrder = preferences?.interests?.length
    ? preferences.interests
    : (Object.keys(priceRanges) as WaitlistInterestId[]);

  const lines: string[] = [];
  const seen = new Set<string>();

  for (const interestId of interestOrder) {
    const ranges = priceRanges[interestId];
    if (!ranges?.length || seen.has(interestId)) continue;
    seen.add(interestId);
    const interestLabel = INTEREST_LABELS[interestId] ?? interestId;
    const rangeLabels = mapIds(ranges, PRICE_RANGE_LABELS).join(", ");
    lines.push(`${interestLabel}: ${rangeLabels}`);
  }

  for (const [interestId, ranges] of Object.entries(priceRanges)) {
    if (seen.has(interestId) || !ranges?.length) continue;
    const interestLabel =
      INTEREST_LABELS[interestId as WaitlistInterestId] ?? interestId;
    const rangeLabels = mapIds(
      ranges as WaitlistPriceRangeId[],
      PRICE_RANGE_LABELS,
    ).join(", ");
    lines.push(`${interestLabel}: ${rangeLabels}`);
  }

  return lines;
}

export function formatWaitlistPreferenceLabels(
  preferences: WaitlistPreferences | null | undefined,
) {
  return {
    interests: mapIds(preferences?.interests, INTEREST_LABELS),
    priceRanges: formatPriceRangesByInterest(preferences),
    why: mapIds(preferences?.why, WHY_LABELS),
    company: mapIds(preferences?.company, COMPANY_LABELS),
    tableType: mapIds(preferences?.tableType, TABLE_TYPE_LABELS),
    cities: preferences?.cities ?? [],
    regionFlexible: Boolean(preferences?.regionFlexible),
  };
}

export function joinPreferenceLabels(values: string[]): string {
  return values.join(", ");
}

import type {
  WaitlistCompanyId,
  WaitlistInterestId,
  WaitlistPreferences,
  WaitlistTableTypeId,
  WaitlistWhyId,
} from "@/i18n/waitlist-page.types";

const INTEREST_LABELS: Record<WaitlistInterestId, string> = {
  wine_tasting: "Wijnproeverij",
  chefs_special: "Chef's Table",
  wine_walk: "Wine Walk",
  aperitivo: "Golden Hour Aperitivo",
};

const WHY_LABELS: Record<WaitlistWhyId, string> = {
  discover_wines: "Nieuwe wijnen ontdekken",
  discover_flavours: "Nieuwe smaken ontdekken",
  discover_places: "Nieuwe locaties ontdekken",
  no_organise: "Geen gedoe met plannen",
  treat: "Verjaardag of cadeau",
  new_city: "Nieuw in de stad",
};

const COMPANY_LABELS: Record<WaitlistCompanyId, string> = {
  meet_new: "Nieuwe mensen ontmoeten",
  bring_friends: "Met vriendinnen of vrienden",
  bring_partner: "Met partner",
  solo: "Solo",
};

const TABLE_TYPE_LABELS: Record<WaitlistTableTypeId, string> = {
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

export function formatWaitlistPreferenceLabels(
  preferences: WaitlistPreferences | null | undefined,
) {
  return {
    interests: mapIds(preferences?.interests, INTEREST_LABELS),
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

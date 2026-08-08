import type { OnboardingCityId } from "@/lib/member-onboarding";
import {
  ACTIVE_ONBOARDING_CITIES,
  isActiveOnboardingCity,
} from "@/lib/member-onboarding";

export type SundayTableLpCitySlug = "rotterdam" | "den-haag";

export const SUNDAY_TABLE_LP_CITIES: ReadonlyArray<{
  slug: SundayTableLpCitySlug;
  name: OnboardingCityId;
}> = [
  { slug: "rotterdam", name: "Rotterdam" },
  { slug: "den-haag", name: "Den Haag" },
];

export function sundayTableLpCityFromSlug(
  slug: string,
): (typeof SUNDAY_TABLE_LP_CITIES)[number] | null {
  return SUNDAY_TABLE_LP_CITIES.find((c) => c.slug === slug) ?? null;
}

export function sundayTableLpSlugFromCity(
  city: string,
): SundayTableLpCitySlug | null {
  return SUNDAY_TABLE_LP_CITIES.find((c) => c.name === city)?.slug ?? null;
}

/** Query/session city → only live launch cities. */
export function parseSundayTableLpCityParam(
  raw: string | null | undefined,
): OnboardingCityId | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (isActiveOnboardingCity(trimmed)) {
    return trimmed;
  }
  const fromSlug = sundayTableLpCityFromSlug(trimmed.toLowerCase());
  return fromSlug?.name ?? null;
}

export function listSundayTableLpActiveCities(): OnboardingCityId[] {
  return [...ACTIVE_ONBOARDING_CITIES];
}

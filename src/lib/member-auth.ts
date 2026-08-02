import { createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { logCustomerActivity } from "@/lib/customers/activities";
import { CustomerActivityTypes } from "@/lib/customers/types";
import { isDbConfigured } from "@/db/index";
import type { Locale } from "@/i18n/config";
import { readOnboardingFromMetadata } from "@/lib/member-onboarding";
import type { User } from "@supabase/supabase-js";

export async function getMemberUser(): Promise<User | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

/** Link / refresh CRM customer row when someone signs in. */
export async function syncMemberCustomer(
  user: User,
  locale?: Locale,
  options?: { recordOnboarding?: boolean; forceLanguage?: boolean },
): Promise<{ customerId: string | null }> {
  if (!user.email || !isDbConfigured()) {
    return { customerId: null };
  }

  const meta = user.user_metadata ?? {};
  const { completed, prefs } = readOnboardingFromMetadata(
    meta as Record<string, unknown>,
  );

  const nameFromMeta =
    prefs.name.trim() ||
    (typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : [meta.given_name, meta.family_name].filter(Boolean).join(" ") ||
          undefined);

  const preferredCity =
    !prefs.cityFlexible && prefs.cities.length > 0 ? prefs.cities[0]! : null;

  const accountLanguage =
    meta.preferred_language === "en" || meta.preferred_language === "nl"
      ? (meta.preferred_language as Locale)
      : null;
  const forcedLanguage =
    options?.forceLanguage && (locale === "en" || locale === "nl")
      ? locale
      : null;
  const languageToWrite = accountLanguage ?? forcedLanguage ?? locale ?? null;

  const { id } = await upsertCustomerFromEmail({
    email: user.email,
    customerName: nameFromMeta || undefined,
    language: languageToWrite,
    setLanguage: Boolean(accountLanguage || forcedLanguage),
    preferredCity,
  });

  if (accountLanguage || forcedLanguage) {
    const { fanOutMemberEmailLocale } = await import(
      "@/lib/email/apply-member-email-locale"
    );
    await fanOutMemberEmailLocale(
      user.email,
      (accountLanguage ?? forcedLanguage)!,
    );
  }

  if (options?.recordOnboarding && completed && prefs.joinIntent) {
    await logCustomerActivity({
      customerId: id,
      type: CustomerActivityTypes.noteAdded,
      title: "Onboarding",
      description:
        prefs.joinIntent === "meet_new"
          ? "Pad: community"
          : prefs.joinIntent === "both"
            ? "Pad: beide"
            : "Pad: culinair",
      metadata: {
        source: "member_onboarding",
        onboarding: {
          name: prefs.name,
          birthDate: prefs.birthDate,
          joinIntent: prefs.joinIntent,
          company: prefs.company,
          cities: prefs.cities,
          cityFlexible: prefs.cityFlexible,
          gender: prefs.gender,
          tableType: prefs.tableType,
          personality: prefs.personality,
          interests: prefs.interests,
          communityInterest: prefs.communityInterest,
        },
      },
    });
  }

  return { customerId: id };
}

"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MemberOnboardingPrefs } from "@/lib/member-onboarding";
import {
  clearOnboardingSession,
  writeOnboardingToSession,
} from "@/lib/member-onboarding";

export async function saveMemberOnboardingPrefs(
  prefs: MemberOnboardingPrefs,
): Promise<void> {
  writeOnboardingToSession(prefs);
  const supabase = createSupabaseBrowserClient();
  const name = prefs.name.trim();
  const { error } = await supabase.auth.updateUser({
    data: {
      ...(name ? { full_name: name, name } : {}),
      onboarding_completed: true,
      onboarding: {
        name,
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
        completedAt: new Date().toISOString(),
      },
    },
  });
  if (error) {
    console.error("[onboarding] updateUser failed:", error.message);
    throw new Error(error.message);
  }
  clearOnboardingSession();
}

export async function clearMemberOnboardingCompleted(): Promise<void> {
  clearOnboardingSession();
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({
    data: {
      onboarding_completed: false,
      onboarding: {
        name: "",
        birthDate: null,
        joinIntent: null,
        company: null,
        cities: [],
        cityFlexible: false,
        gender: null,
        tableType: null,
        personality: null,
        interests: [],
        communityInterest: false,
      },
    },
  });
  if (error) {
    console.error("[onboarding] clear completed failed:", error.message);
  }
}

export async function saveMemberLocalePreference(
  locale: "nl" | "en",
): Promise<void> {
  try {
    localStorage.setItem("mytable_locale_pref", locale);
  } catch {
    /* ignore */
  }
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.updateUser({
    data: { preferred_language: locale },
  });
  if (error) {
    console.error("[locale] updateUser failed:", error.message);
  }
}

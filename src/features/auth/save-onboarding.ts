"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

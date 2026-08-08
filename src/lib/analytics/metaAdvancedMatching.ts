import type { User } from "@supabase/supabase-js";
import { readOnboardingFromMetadata } from "@/lib/member-onboarding";

export type MetaAdvancedMatching = {
  em?: string;
  fn?: string;
  ln?: string;
  external_id?: string;
  ct?: string;
  country?: string;
};

const ANON_EXTERNAL_ID_KEY = "mytable_meta_external_id";

export function getOrCreateMetaExternalId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = localStorage.getItem(ANON_EXTERNAL_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `mt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(ANON_EXTERNAL_ID_KEY, id);
    return id;
  } catch {
    return null;
  }
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0]!, last: "" };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

/**
 * Advanced Matching for fbq('init').
 * Send plaintext — Meta hashes browser pixel params itself.
 * (CAPI still hashes server-side.)
 */
export async function buildMetaAdvancedMatching(
  user: User | null,
): Promise<MetaAdvancedMatching> {
  const matching: MetaAdvancedMatching = {};
  const externalId = user?.id ?? getOrCreateMetaExternalId();
  if (externalId) matching.external_id = externalId;

  if (!user) return matching;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { prefs } = readOnboardingFromMetadata(meta);
  const email = user.email?.trim().toLowerCase();
  if (email) matching.em = email;

  const fullName =
    prefs.name.trim() ||
    (typeof meta.full_name === "string" ? meta.full_name : "") ||
    (typeof meta.name === "string" ? meta.name : "") ||
    [meta.given_name, meta.family_name].filter(Boolean).join(" ");

  const { first, last } = splitName(fullName);
  if (first) matching.fn = first.trim().toLowerCase();
  if (last) matching.ln = last.trim().toLowerCase();

  const city = prefs.cities[0]?.trim().toLowerCase();
  if (city) matching.ct = city;

  if (prefs.cities.length > 0 || prefs.joinIntent) {
    matching.country = "nl";
  }

  return matching;
}

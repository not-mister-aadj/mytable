import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { customers } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { normalizeEmail } from "@/lib/customers/normalize";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function asLocale(value: unknown): Locale | null {
  return value === "en" || value === "nl" ? value : null;
}

/**
 * Account language preference wins over a frozen row locale.
 * Order: auth preferred_language → customers.language → fallback → nl.
 */
export async function resolveEmailLocale(input: {
  email: string;
  userId?: string | null;
  fallbackLocale?: string | null;
}): Promise<Locale> {
  const fallback = asLocale(input.fallbackLocale) ?? "nl";

  if (input.userId) {
    try {
      const admin = createSupabaseAdminClient();
      const { data } = await admin.auth.admin.getUserById(input.userId);
      const fromAuth = asLocale(data.user?.user_metadata?.preferred_language);
      if (fromAuth) return fromAuth;
    } catch {
      // Prefer CRM / fallback when admin lookup is unavailable.
    }
  }

  if (isDbConfigured()) {
    try {
      const db = getDb();
      const [row] = await db
        .select({ language: customers.language })
        .from(customers)
        .where(eq(customers.emailNormalized, normalizeEmail(input.email)))
        .limit(1);
      const fromCustomer = asLocale(row?.language);
      if (fromCustomer) return fromCustomer;
    } catch {
      // fall through
    }
  }

  return fallback;
}

import { and, inArray, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { clubMemberships, sundayTableSignups } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { normalizeEmail } from "@/lib/customers/normalize";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";

/** Keep membership + open signup locales aligned with account language. */
export async function fanOutMemberEmailLocale(
  email: string,
  locale: Locale,
): Promise<void> {
  if (!isDbConfigured()) return;

  const normalized = normalizeEmail(email);
  const db = getDb();

  await db
    .update(clubMemberships)
    .set({ locale })
    .where(sql`lower(${clubMemberships.email}) = ${normalized}`);

  await db
    .update(sundayTableSignups)
    .set({ locale })
    .where(
      and(
        sql`lower(${sundayTableSignups.email}) = ${normalized}`,
        inArray(sundayTableSignups.status, ["confirmed", "pending_payment"]),
      ),
    );
}

/**
 * Persist account language for transactional email and keep open rows in sync.
 */
export async function applyMemberEmailLocale(
  email: string,
  locale: Locale,
): Promise<void> {
  if (!isDbConfigured()) return;

  await upsertCustomerFromEmail({
    email,
    language: locale,
    setLanguage: true,
  });
  await fanOutMemberEmailLocale(email, locale);
}

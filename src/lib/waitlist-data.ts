import { and, eq } from "drizzle-orm";
import { waitlistSignups } from "@/db/schema";
import { getDb } from "@/db/index";
import type { WaitlistPreferences } from "@/i18n/waitlist-page.types";

/** One waitlist, one meaning — "priority_list" was retired, see drizzle/0020. */
export async function createWaitlistSignup(input: {
  email: string;
  city: string;
  locale: string;
  name?: string;
  source?: "waitlist";
  preferences?: WaitlistPreferences | null;
}): Promise<
  { ok: true; id: string; created: boolean } | { ok: false; error: string }
> {
  const email = input.email.trim().toLowerCase();
  const city = input.city.trim();
  const name = input.name?.trim() || null;
  const source = input.source ?? "waitlist";
  const preferences = input.preferences ?? null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }
  if (!city) {
    return { ok: false, error: "City required" };
  }

  const db = getDb();
  const locale = input.locale === "en" ? "en" : "nl";

  try {
    const [inserted] = await db
      .insert(waitlistSignups)
      .values({
        email,
        city,
        locale,
        name,
        source,
        preferences: preferences ?? undefined,
      })
      .onConflictDoNothing({
        target: [waitlistSignups.email, waitlistSignups.city],
      })
      .returning({ id: waitlistSignups.id });

    if (inserted) {
      return { ok: true, id: inserted.id, created: true };
    }

    const [existing] = await db
      .select({ id: waitlistSignups.id })
      .from(waitlistSignups)
      .where(
        and(
          eq(waitlistSignups.email, email),
          eq(waitlistSignups.city, city),
        ),
      )
      .limit(1);

    if (!existing) {
      return { ok: false, error: "Could not save signup" };
    }

    if (preferences || name) {
      await db
        .update(waitlistSignups)
        .set({
          ...(name ? { name } : {}),
          ...(preferences ? { preferences } : {}),
          ...(source ? { source } : {}),
        })
        .where(eq(waitlistSignups.id, existing.id));
    }

    return { ok: true, id: existing.id, created: false };
  } catch (error) {
    console.error("[waitlist] createWaitlistSignup failed:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (
      /ENOTFOUND|ECONNREFUSED|connect_timeout|Tenant or user not found|XX000/i.test(
        message,
      )
    ) {
      return { ok: false, error: "database_unavailable" };
    }
    return { ok: false, error: "Could not save signup" };
  }
}

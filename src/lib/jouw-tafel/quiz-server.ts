import { and, eq, isNull } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { waitlistSignups } from "@/db/schema";
import type { WaitlistPreferences } from "@/i18n/waitlist-page.types";
import { onWaitlistJoined } from "@/lib/customers/hooks";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { createWaitlistSignup } from "@/lib/waitlist-data";
import { normalizeWaitlistCity } from "@/lib/waitlist-city";
import { buildWaitlistPreferences, type QuizState } from "@/lib/jouw-tafel/quiz-logic";

export type QuizWaitlistResult =
  | { ok: true; id: string; created: boolean; city: string }
  | { ok: false; error: string };

/**
 * Puts the quiz answers on this person's waitlist row for their city, in
 * the waitlist modal's `preferences` shape plus the quiz's own keys. An
 * existing row keeps any older answers the quiz does not ask (merged, not
 * replaced). A new row is linked to the customer and logged the same way a
 * waitlist modal sign-up is (onWaitlistJoined); the caller fires Meta's
 * Lead for new rows only.
 */
export async function upsertQuizWaitlist(input: {
  email: string;
  locale: "nl" | "en";
  state: QuizState;
}): Promise<QuizWaitlistResult> {
  if (!isDbConfigured()) return { ok: false, error: "database_unavailable" };
  const city = normalizeWaitlistCity(input.state.answers.city ?? "");
  if (!city) return { ok: false, error: "no_city" };
  const email = input.email.trim().toLowerCase();
  const name = input.state.answers.name?.trim() || undefined;
  const quizPreferences = buildWaitlistPreferences(input.state.answers);
  quizPreferences.cities = [city];

  const db = getDb();
  const [existing] = await db
    .select({ id: waitlistSignups.id, preferences: waitlistSignups.preferences, customerId: waitlistSignups.customerId })
    .from(waitlistSignups)
    .where(and(eq(waitlistSignups.email, email), eq(waitlistSignups.city, city)))
    .limit(1);
  const preferences = { ...(existing?.preferences ?? {}), ...quizPreferences };

  const result = await createWaitlistSignup({
    email,
    city,
    locale: input.locale,
    name,
    source: "waitlist",
    preferences: preferences as unknown as WaitlistPreferences,
  });
  if (!result.ok) return result;

  if (result.created) {
    try {
      await onWaitlistJoined({
        email,
        city,
        locale: input.locale,
        waitlistId: result.id,
        name,
        preferences,
      });
    } catch (error) {
      console.error("[jouw-tafel quiz] onWaitlistJoined failed:", error);
    }
  } else if (!existing?.customerId) {
    // An older row from before customers were linked: link it now.
    try {
      const { id: customerId } = await upsertCustomerFromEmail({
        email,
        language: input.locale,
        preferredCity: city,
        customerName: name,
      });
      await db
        .update(waitlistSignups)
        .set({ customerId })
        .where(and(eq(waitlistSignups.id, result.id), isNull(waitlistSignups.customerId)));
    } catch (error) {
      console.error("[jouw-tafel quiz] linking customer failed:", error);
    }
  }

  return { ok: true, id: result.id, created: result.created, city };
}

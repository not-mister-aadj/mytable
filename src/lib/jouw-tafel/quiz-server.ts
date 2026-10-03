import { and, eq, isNull } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { waitlistSignups } from "@/db/schema";
import type { WaitlistPreferences } from "@/i18n/waitlist-page.types";
import { onWaitlistJoined } from "@/lib/customers/hooks";
import { upsertCustomerFromEmail } from "@/lib/customers/upsert";
import { createWaitlistSignup } from "@/lib/waitlist-data";
import { cityMatchKey, normalizeWaitlistCity } from "@/lib/waitlist-city";
import { answerCities, buildWaitlistPreferences, type QuizState } from "@/lib/jouw-tafel/quiz-logic";
import { placeLabel } from "@/lib/jouw-tafel/places-server";
import { supportedCity } from "@/lib/jouw-tafel/logic";

export type QuizWaitlistRow = { id: string; created: boolean; city: string };

export type QuizWaitlistResult =
  | {
      ok: true;
      /** One row per chosen city, primary first. */
      rows: QuizWaitlistRow[];
      /** The first newly created row (in their city order): the one Meta's
       * Lead is sent for. Null when every row already existed. */
      lead: QuizWaitlistRow | null;
    }
  | { ok: false; error: string };

/**
 * Their chosen cities as waitlist city names, primary first, deduped: our
 * city in its usual spelling, else the place's name from the list (a
 * waitlist for that place: "Delft" stays Delft).
 */
function waitlistCities(state: QuizState): string[] {
  const cities: string[] = [];
  for (const raw of answerCities(state.answers)) {
    const city = supportedCity(raw) ?? placeLabel(raw) ?? normalizeWaitlistCity(raw);
    if (city && !cities.some((c) => cityMatchKey(c) === cityMatchKey(city))) cities.push(city);
  }
  return cities;
}

/**
 * Puts the quiz answers on this person's waitlist rows, one per chosen city
 * (the table holds one row per email and city), in the waitlist modal's
 * `preferences` shape plus the quiz's own keys, with `cities` listing every
 * chosen city. An existing row keeps any older answers the quiz does not ask
 * (merged, not replaced). A new row is linked to the customer and logged the
 * same way a waitlist modal sign-up is (onWaitlistJoined). The caller fires
 * Meta's Lead once, for `lead` only.
 */
export async function upsertQuizWaitlist(input: {
  email: string;
  locale: "nl" | "en";
  state: QuizState;
}): Promise<QuizWaitlistResult> {
  if (!isDbConfigured()) return { ok: false, error: "database_unavailable" };
  const cities = waitlistCities(input.state);
  if (cities.length === 0) return { ok: false, error: "no_city" };
  const email = input.email.trim().toLowerCase();
  const name = input.state.answers.name?.trim() || undefined;
  const quizPreferences = buildWaitlistPreferences(input.state.answers);
  quizPreferences.cities = cities;

  // Primary city last: linking a customer sets their preferred city, so the
  // primary one is the one that stays.
  const rows: QuizWaitlistRow[] = [];
  for (const city of [...cities].reverse()) {
    const row = await upsertCityRow({ email, city, name, locale: input.locale, quizPreferences });
    if (!row.ok) return row;
    rows.unshift(row.row);
  }
  return { ok: true, rows, lead: rows.find((r) => r.created) ?? null };
}

async function upsertCityRow(input: {
  email: string;
  city: string;
  name: string | undefined;
  locale: "nl" | "en";
  quizPreferences: Record<string, unknown>;
}): Promise<{ ok: true; row: QuizWaitlistRow } | { ok: false; error: string }> {
  const { email, city, name, locale } = input;
  const db = getDb();
  const [existing] = await db
    .select({ id: waitlistSignups.id, preferences: waitlistSignups.preferences, customerId: waitlistSignups.customerId })
    .from(waitlistSignups)
    .where(and(eq(waitlistSignups.email, email), eq(waitlistSignups.city, city)))
    .limit(1);
  const preferences = { ...(existing?.preferences ?? {}), ...input.quizPreferences };

  const result = await createWaitlistSignup({
    email,
    city,
    locale,
    name,
    source: "waitlist",
    preferences: preferences as unknown as WaitlistPreferences,
  });
  if (!result.ok) return result;

  if (result.created) {
    try {
      await onWaitlistJoined({ email, city, locale, waitlistId: result.id, name, preferences });
    } catch (error) {
      console.error("[jouw-tafel quiz] onWaitlistJoined failed:", error);
    }
  } else if (!existing?.customerId) {
    // An older row from before customers were linked: link it now.
    try {
      const { id: customerId } = await upsertCustomerFromEmail({
        email,
        language: locale,
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

  return { ok: true, row: { id: result.id, created: result.created, city } };
}

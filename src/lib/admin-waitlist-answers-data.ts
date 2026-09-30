import { asc, gt } from "drizzle-orm";
import { getDb } from "@/db/index";
import { customers, waitlistSignups } from "@/db/schema";
import {
  parseWaitlistAnswers,
  type WaitlistAnswers,
} from "@/lib/waitlist-answers";

/**
 * One row per person on the waitlist for /customers/antwoorden: grouped by
 * customer id, falling back to email for rows without one, with the latest
 * non-empty questionnaire. Filtering and counting happen client-side.
 */

export type WaitlistAnswerPerson = {
  key: string;
  /** Cities they signed up for (waitlist rows). */
  cities: string[];
  /** Has at least one paid booking. */
  isBuyer: boolean;
  answers: WaitlistAnswers | null;
};

export async function getWaitlistAnswerPeople(): Promise<WaitlistAnswerPerson[]> {
  const db = getDb();
  const [rows, buyers] = await Promise.all([
    db
      .select({
        email: waitlistSignups.email,
        city: waitlistSignups.city,
        customerId: waitlistSignups.customerId,
        preferences: waitlistSignups.preferences,
      })
      .from(waitlistSignups)
      .orderBy(asc(waitlistSignups.createdAt)),
    db
      .select({ id: customers.id, email: customers.email })
      .from(customers)
      .where(gt(customers.paidBookingsCount, 0)),
  ]);

  const buyerIds = new Set(buyers.map((b) => b.id));
  const buyerEmails = new Set(buyers.map((b) => b.email.trim().toLowerCase()));

  // Rows without customer id still join their person when another row with
  // the same email has one.
  const customerByEmail = new Map<string, string>();
  for (const row of rows) {
    if (row.customerId) {
      customerByEmail.set(row.email.trim().toLowerCase(), row.customerId);
    }
  }

  const people = new Map<string, WaitlistAnswerPerson>();
  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    const customerId = row.customerId ?? customerByEmail.get(email) ?? null;
    const key = customerId ?? `email:${email}`;
    let person = people.get(key);
    if (!person) {
      person = {
        key,
        cities: [],
        isBuyer:
          (customerId !== null && buyerIds.has(customerId)) ||
          buyerEmails.has(email),
        answers: null,
      };
      people.set(key, person);
    }
    if (!person.cities.includes(row.city)) person.cities.push(row.city);
    // Ordered oldest first, so the last filled-in row wins.
    const parsed = parseWaitlistAnswers(row.preferences);
    if (parsed) person.answers = parsed;
  }

  return [...people.values()];
}

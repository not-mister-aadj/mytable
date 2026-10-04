import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { waitlistSignups } from "@/db/schema";
import {
  conceptStats,
  personConcepts,
  type ConceptStats,
  type PersonConcept,
  type SignupConceptRow,
} from "@/lib/signup-concept";

/** The few columns the concept needs, for every waitlist row (admin only). */
export async function loadConceptRows(): Promise<Array<SignupConceptRow & { email: string; createdAt: Date }>> {
  if (!isDbConfigured()) return [];
  const rows = await getDb()
    .select({
      email: waitlistSignups.email,
      source: waitlistSignups.source,
      hasAccount: sql<boolean>`coalesce((${waitlistSignups.preferences} ->> 'has_account')::boolean, false)`,
      quizVersion: sql<string | null>`${waitlistSignups.preferences} ->> 'quizVersion'`,
      createdAt: waitlistSignups.createdAt,
    })
    .from(waitlistSignups);
  return rows.map((r) => ({
    email: r.email,
    source: r.source,
    createdAt: r.createdAt,
    preferences: { has_account: r.hasAccount, quizVersion: r.quizVersion ?? undefined },
  }));
}

/** Per person (lowercased email): concept by first touch, and the overlap. */
export async function loadPersonConcepts(): Promise<Map<string, PersonConcept>> {
  return personConcepts(await loadConceptRows());
}

/** Sign-ups per concept for the dashboard and analytics. */
export async function getConceptStats(now: Date = new Date(), days = 14): Promise<ConceptStats> {
  return conceptStats((await loadPersonConcepts()).values(), now, days);
}

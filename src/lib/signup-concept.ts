// Two sign-up concepts run side by side (the founder's A/B test):
// - "waitlist": the old waitlist funnel (/api/waitlist, the Sunday Social
//   landing and its questionnaire);
// - "account": the new account funnel (/jouw-tafel, email-code account,
//   quiz, "Kies je zondag").
// Both write waitlist_signups rows. Pure, client-safe and unit tested
// (npx tsx --test src/lib/signup-concept.test.ts).

export type SignupConcept = "waitlist" | "account";

/** waitlist_signups.source for rows CREATED by the quiz or its settings. */
export const JOUW_TAFEL_SIGNUP_SOURCE = "jouw_tafel";

/** preferences key the quiz sets on every row it touches, also on an old
 * funnel row it merges into (that row keeps its first-touch source). */
export const HAS_ACCOUNT_PREFERENCE = "has_account";

export const SIGNUP_CONCEPT_LABEL: Record<SignupConcept, string> = {
  waitlist: "Wachtlijst",
  account: "Account",
};

export type SignupConceptRow = {
  source: string | null;
  preferences: Record<string, unknown> | null | undefined;
};

/**
 * The concept a row was created by (first touch):
 * - source "jouw_tafel": account;
 * - an old-funnel row the quiz merged into (has_account set): waitlist;
 * - a quiz row from before the source existed (source "waitlist" but the
 *   quiz's own `quizVersion` key, no has_account): account;
 * - anything else: waitlist.
 */
export function signupConcept(row: SignupConceptRow): SignupConcept {
  if (row.source === JOUW_TAFEL_SIGNUP_SOURCE) return "account";
  const prefs = row.preferences ?? {};
  if (prefs[HAS_ACCOUNT_PREFERENCE] === true) return "waitlist";
  if (prefs.quizVersion !== undefined && prefs.quizVersion !== null) return "account";
  return "waitlist";
}

/** True when this person has an account (also a waitlist person who later
 * made one through the quiz). */
export function rowHasAccount(row: SignupConceptRow): boolean {
  return signupConcept(row) === "account" || row.preferences?.[HAS_ACCOUNT_PREFERENCE] === true;
}

export type PersonConcept = { concept: SignupConcept; hasAccount: boolean; firstAt: Date };

/**
 * Per person (lowercased email): the concept of their earliest row (first
 * touch wins), and whether any row shows an account.
 */
export function personConcepts(
  rows: ReadonlyArray<SignupConceptRow & { email: string; createdAt: Date }>,
): Map<string, PersonConcept> {
  const out = new Map<string, PersonConcept>();
  const sorted = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const row of sorted) {
    const email = row.email.trim().toLowerCase();
    const existing = out.get(email);
    if (!existing) {
      out.set(email, { concept: signupConcept(row), hasAccount: rowHasAccount(row), firstAt: row.createdAt });
    } else if (rowHasAccount(row)) {
      existing.hasAccount = true;
    }
  }
  return out;
}

export type ConceptStats = {
  total: Record<SignupConcept, number>;
  last7d: Record<SignupConcept, number>;
  /** Waitlist people who later made an account too. */
  overlap: number;
  /** Newest first: YYYY-MM-DD (Amsterdam) with new people per concept. */
  perDay: { day: string; waitlist: number; account: number }[];
};

function amsterdamDay(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(date);
}

/** Sign-ups per concept: total, last 7 days and per day (by first touch). */
export function conceptStats(people: Iterable<PersonConcept>, now: Date, days = 14): ConceptStats {
  const total = { waitlist: 0, account: 0 };
  const last7d = { waitlist: 0, account: 0 };
  let overlap = 0;
  const dayKeys: string[] = [];
  for (let i = 0; i < days; i++) dayKeys.push(amsterdamDay(new Date(now.getTime() - i * 86_400_000)));
  const perDay = new Map(dayKeys.map((d) => [d, { day: d, waitlist: 0, account: 0 }]));
  const weekAgo = now.getTime() - 7 * 86_400_000;
  for (const p of people) {
    total[p.concept] += 1;
    if (p.firstAt.getTime() >= weekAgo) last7d[p.concept] += 1;
    if (p.concept === "waitlist" && p.hasAccount) overlap += 1;
    const bucket = perDay.get(amsterdamDay(p.firstAt));
    if (bucket) bucket[p.concept] += 1;
  }
  return { total, last7d, overlap, perDay: dayKeys.map((d) => perDay.get(d)!) };
}

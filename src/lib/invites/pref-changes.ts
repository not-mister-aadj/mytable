import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { invitePrefChanges, inviteSends } from "@/db/schema";
import type { CityPref } from "@/lib/invites/logic";

/** One city going from one setting to another. */
export type PrefChange = { city: string; from: CityPref; to: CityPref };

/**
 * What changed between two sets of city settings. `followed` are the cities
 * they got invites for before: a followed city without a setting counts as
 * "all", any other city as "none".
 */
export function prefChanges(before: Record<string, CityPref>, after: Record<string, CityPref>, followed: string[]): PrefChange[] {
  const cities = [...new Set([...followed, ...Object.keys(before), ...Object.keys(after)])].sort();
  const was = (city: string): CityPref => before[city] ?? (followed.includes(city) ? "all" : "none");
  // A city left out of the new settings keeps what it had.
  return cities.map((city) => ({ city, from: was(city), to: after[city] ?? was(city) })).filter((c) => c.from !== c.to);
}

/** They follow no city anymore after these changes. */
export function unsubscribedAfter(before: Record<string, CityPref>, after: Record<string, CityPref>, followed: string[]): boolean {
  const cities = [...new Set([...followed, ...Object.keys(before), ...Object.keys(after)])];
  const now = (city: string): CityPref => after[city] ?? before[city] ?? (followed.includes(city) ? "all" : "none");
  return cities.length > 0 && cities.every((city) => now(city) === "none");
}

/**
 * Keeps a change of invite settings, with the last invite they got before it.
 * Nothing is written when nothing changed. Never throws: measuring must not
 * stand in the way of saving the settings.
 */
export async function recordPrefChange(input: {
  email: string;
  source: "page" | "one_click" | "settings";
  before: Record<string, CityPref>;
  after: Record<string, CityPref>;
  followed: string[];
}): Promise<void> {
  try {
    const changes = prefChanges(input.before, input.after, input.followed);
    if (changes.length === 0) return;
    const db = getDb();
    const [last] = await db
      .select({ id: inviteSends.id })
      .from(inviteSends)
      .where(and(eq(inviteSends.emailNormalized, input.email), eq(inviteSends.status, "sent")))
      .orderBy(desc(inviteSends.sentAt))
      .limit(1);
    await db.insert(invitePrefChanges).values({
      emailNormalized: input.email,
      source: input.source,
      changes,
      unsubscribed: unsubscribedAfter(input.before, input.after, input.followed),
      lastSendId: last?.id ?? null,
    });
  } catch (error) {
    console.error("[invites] could not record a settings change:", error);
  }
}

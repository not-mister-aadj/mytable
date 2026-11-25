import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { inviteSubscribers } from "@/db/schema";
import { normalizeEmail } from "@/lib/customers/normalize";
import { citiesForEmail } from "@/lib/invites/cities";
import type { CityPref } from "@/lib/invites/logic";
import { recordPrefChange } from "@/lib/invites/pref-changes";

/**
 * The "Mail me over nieuwe tafels in mijn steden" switch in the settings
 * writes the same city settings as the unsubscribe link in an invite, so the
 * invites and the switch can never disagree.
 *
 * Off: every city they follow goes to "none". On: every "none" goes back to
 * "all" ("less" stays).
 */
export function switchedPrefs(before: Record<string, CityPref>, followed: string[], on: boolean): Record<string, CityPref> {
  const after: Record<string, CityPref> = { ...before };
  if (on) {
    for (const [city, pref] of Object.entries(after)) if (pref === "none") after[city] = "all";
  } else {
    for (const city of followed) after[city] = "none";
  }
  return after;
}

/** Off when they follow cities and every one of them is set to "none". */
export function invitesOff(prefs: Record<string, CityPref>, followed: string[]): boolean {
  return followed.length > 0 && followed.every((city) => prefs[city] === "none");
}

export async function setInvitesOn(email: string, on: boolean): Promise<void> {
  if (!isDbConfigured()) return;
  const key = normalizeEmail(email);
  const db = getDb();
  const [sub] = await db.select().from(inviteSubscribers).where(eq(inviteSubscribers.emailNormalized, key)).limit(1);
  const before = (sub?.cityPrefs ?? {}) as Record<string, CityPref>;
  const followed = await citiesForEmail(key);
  const after = switchedPrefs(before, followed, on);
  if (sub) {
    await db.update(inviteSubscribers).set({ cityPrefs: after, updatedAt: new Date() }).where(eq(inviteSubscribers.emailNormalized, key));
  } else {
    await db
      .insert(inviteSubscribers)
      .values({ emailNormalized: key, token: randomBytes(18).toString("base64url"), cityPrefs: after })
      .onConflictDoUpdate({ target: inviteSubscribers.emailNormalized, set: { cityPrefs: after, updatedAt: new Date() } });
  }
  await recordPrefChange({ email: key, source: "settings", before, after, followed });
}

export async function invitesOffFor(email: string): Promise<boolean> {
  if (!isDbConfigured()) return false;
  const key = normalizeEmail(email);
  const [sub] = await getDb().select().from(inviteSubscribers).where(eq(inviteSubscribers.emailNormalized, key)).limit(1);
  return invitesOff((sub?.cityPrefs ?? {}) as Record<string, CityPref>, await citiesForEmail(key));
}

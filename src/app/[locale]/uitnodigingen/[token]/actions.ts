"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, isDbConfigured } from "@/db/index";
import { inviteSubscribers } from "@/db/schema";
import type { CityPref } from "@/lib/invites/logic";
import { supportedCity } from "@/lib/jouw-tafel/logic";

const PREFS: CityPref[] = ["all", "less", "none"];

/** Saves how often someone wants invites per city (no login: the token is the key). */
export async function saveInvitePrefs(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const locale = formData.get("locale") === "en" ? "en" : "nl";
  if (!isDbConfigured() || !token) return;
  const db = getDb();
  const [sub] = await db.select().from(inviteSubscribers).where(eq(inviteSubscribers.token, token)).limit(1);
  if (!sub) return;
  const prefs: Record<string, CityPref> = {};
  for (const [key, value] of formData.entries()) {
    const pref = String(value) as CityPref;
    if (!PREFS.includes(pref)) continue;
    if (key.startsWith("city:")) prefs[key.slice(5)] = pref;
    // A city they did not follow yet: only kept when they want its invites.
    const added = key.startsWith("add:") ? supportedCity(key.slice(4)) : null;
    if (added && pref !== "none") prefs[added] = pref;
  }
  await db.update(inviteSubscribers).set({ cityPrefs: prefs, updatedAt: new Date() }).where(eq(inviteSubscribers.token, token));
  redirect(`${locale === "en" ? "/en" : ""}/uitnodigingen/${token}?opgeslagen=1`);
}

"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, isDbConfigured } from "@/db/index";
import { inviteSubscribers } from "@/db/schema";
import type { CityPref } from "@/lib/invites/logic";

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
    if (!key.startsWith("city:")) continue;
    const pref = String(value) as CityPref;
    if (PREFS.includes(pref)) prefs[key.slice(5)] = pref;
  }
  await db.update(inviteSubscribers).set({ cityPrefs: prefs, updatedAt: new Date() }).where(eq(inviteSubscribers.token, token));
  redirect(`${locale === "en" ? "/en" : ""}/uitnodigingen/${token}?opgeslagen=1`);
}

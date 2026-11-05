import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "@/db/index";
import { inviteSubscribers } from "@/db/schema";

export type InvitePause = {
  /** City preferences they chose on their invite settings page. */
  cityPrefs: Record<string, "all" | "less" | "none">;
  /** YYYY-MM-DD, or null without a pause. */
  pausedUntil: string | null;
};

export async function getInvitePause(email: string): Promise<InvitePause> {
  const key = email.trim().toLowerCase();
  const [row] = await getDb()
    .select({ cityPrefs: inviteSubscribers.cityPrefs, pausedUntil: inviteSubscribers.pausedUntil })
    .from(inviteSubscribers)
    .where(eq(inviteSubscribers.emailNormalized, key))
    .limit(1)
    .catch(() => []);
  return { cityPrefs: row?.cityPrefs ?? {}, pausedUntil: row?.pausedUntil ?? null };
}

/** Sets or clears the pause. Someone without settings yet gets a row (with a token, as the engine would). */
export async function setInvitePause(email: string, pausedUntil: string | null): Promise<void> {
  const key = email.trim().toLowerCase();
  await getDb()
    .insert(inviteSubscribers)
    .values({ emailNormalized: key, token: randomBytes(18).toString("base64url"), pausedUntil })
    .onConflictDoUpdate({ target: inviteSubscribers.emailNormalized, set: { pausedUntil, updatedAt: new Date() } });
}

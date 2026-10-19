import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { siteSettings } from "@/db/schema";

/** The invite system's switches, in site_settings under "invites". */
export type InviteSettings = {
  /** Plans and sends at all. Off until an admin starts it. */
  enabled: boolean;
  /** Emergency stop: nothing is sent while true (planning goes on). */
  paused: boolean;
  /** When it was started: the daily maximum grows from here. */
  startedAt: string | null;
  /** Until this moment every day's mails need an admin's approval. */
  approveUntil: string | null;
  capStart: number;
  capGrowthPerWeek: number;
};

const KEY = "invites";

export const DEFAULT_INVITE_SETTINGS: InviteSettings = {
  enabled: false,
  paused: false,
  startedAt: null,
  approveUntil: null,
  capStart: 50,
  capGrowthPerWeek: 10,
};

export async function getInviteSettings(): Promise<InviteSettings> {
  const [row] = await getDb().select().from(siteSettings).where(eq(siteSettings.key, KEY)).limit(1);
  return { ...DEFAULT_INVITE_SETTINGS, ...((row?.value as Partial<InviteSettings> | undefined) ?? {}) };
}

export async function saveInviteSettings(patch: Partial<InviteSettings>): Promise<InviteSettings> {
  const next = { ...(await getInviteSettings()), ...patch };
  await getDb()
    .insert(siteSettings)
    .values({ key: KEY, value: next as unknown as Record<string, unknown> })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: next as unknown as Record<string, unknown>, updatedAt: new Date() } });
  return next;
}

/** True while each day's mails wait for an admin's approval. */
export function needsApproval(settings: InviteSettings, now: Date = new Date()): boolean {
  return Boolean(settings.approveUntil && now.getTime() < Date.parse(settings.approveUntil));
}

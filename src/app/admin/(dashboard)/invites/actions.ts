"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { emailLog, inviteClicks, inviteSends } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { planInvites, sendDueInvites } from "@/lib/invites/engine";
import { amsterdamParts } from "@/lib/invites/logic";
import { getInviteSettings, saveInviteSettings } from "@/lib/invites/settings";

const DAY = 24 * 60 * 60 * 1000;

function done() {
  revalidatePath("/admin/invites");
}

/** Starts the system: two weeks of daily approval, then automatic. */
export async function startInvites(): Promise<void> {
  await requireAdmin();
  const now = new Date();
  await saveInviteSettings({
    enabled: true,
    paused: false,
    startedAt: now.toISOString(),
    approveUntil: new Date(now.getTime() + 14 * DAY).toISOString(),
  });
  // The daily planning runs at 06:00; the first list is made right away.
  await planInvites();
  done();
}

export async function togglePause(): Promise<void> {
  await requireAdmin();
  const s = await getInviteSettings();
  await saveInviteSettings({ paused: !s.paused, pausedReason: null });
  done();
}

/** Approves the selected mails; each goes out at its own time. */
export async function approveInvites(ids: string[]): Promise<number> {
  await requireAdmin();
  if (ids.length === 0) return 0;
  const rows = await getDb()
    .update(inviteSends)
    .set({ status: "approved", approvedAt: new Date() })
    .where(and(inArray(inviteSends.id, ids), eq(inviteSends.status, "queued")))
    .returning({ id: inviteSends.id });
  done();
  return rows.length;
}

/** Skips the selected mails; the next morning plans those people again. */
export async function skipInvites(ids: string[]): Promise<number> {
  await requireAdmin();
  if (ids.length === 0) return 0;
  const rows = await getDb()
    .update(inviteSends)
    .set({ status: "skipped", skipReason: "overgeslagen door admin" })
    .where(and(inArray(inviteSends.id, ids), inArray(inviteSends.status, ["queued", "approved"])))
    .returning({ id: inviteSends.id });
  done();
  return rows.length;
}

/** "Later": the same time of day, `days` later; needs approval again. */
export async function postponeInvites(ids: string[], days: number): Promise<number> {
  await requireAdmin();
  if (ids.length === 0 || ![1, 2, 7].includes(days)) return 0;
  const rows = await getDb()
    .update(inviteSends)
    .set({
      status: "queued",
      approvedAt: null,
      postponedAt: new Date(),
      scheduledFor: sql`${inviteSends.scheduledFor} + make_interval(days => ${days})`,
    })
    .where(and(inArray(inviteSends.id, ids), inArray(inviteSends.status, ["queued", "approved"])))
    .returning({ id: inviteSends.id });
  done();
  return rows.length;
}

export type RecipientHistoryItem = { at: string; subject: string; status: string };

/** Every mail this address got (email_log), newest first, with what they did. */
export async function getRecipientHistory(email: string): Promise<RecipientHistoryItem[]> {
  await requireAdmin();
  const db = getDb();
  const key = email.trim().toLowerCase();
  const mails = await db
    .select({ at: emailLog.sentAt, subject: emailLog.subject, lastEvent: emailLog.lastEvent, resendId: emailLog.resendId })
    .from(emailLog)
    .where(eq(emailLog.emailNormalized, key))
    .orderBy(desc(emailLog.sentAt))
    .limit(30);
  const sends = await db.select({ id: inviteSends.id, resendId: inviteSends.resendId }).from(inviteSends).where(eq(inviteSends.emailNormalized, key));
  const clicked = new Set(
    (sends.length
      ? await db.select({ sendId: inviteClicks.sendId }).from(inviteClicks).where(inArray(inviteClicks.sendId, sends.map((x) => x.id)))
      : []
    ).map((c) => sends.find((x) => x.id === c.sendId)?.resendId),
  );
  const label: Record<string, string> = { delivered: "Afgeleverd", opened: "Geopend", clicked: "Geklikt", bounced: "Bounce", complained: "Spam", suppressed: "Tegengehouden" };
  return mails.map((m) => ({
    at: m.at.toISOString(),
    subject: m.subject,
    status: m.resendId && clicked.has(m.resendId) ? "Geklikt" : label[m.lastEvent ?? ""] ?? "Verstuurd",
  }));
}

/** What would go out right now, without sending or claiming anything. */
export async function dryRunInvites(): Promise<Array<{ email: string; status: string; reason?: string; subject?: string }>> {
  await requireAdmin();
  const result = await sendDueInvites(new Date(), { dryRun: true });
  return result.details;
}

/** Approves every mail planned for today (Amsterdam). */
export async function approveToday(): Promise<void> {
  await requireAdmin();
  const db = getDb();
  const today = amsterdamParts(new Date()).day;
  const queued = await db.select({ id: inviteSends.id, at: inviteSends.scheduledFor }).from(inviteSends).where(eq(inviteSends.status, "queued"));
  const ids = queued.filter((q) => amsterdamParts(q.at).day === today).map((q) => q.id);
  if (ids.length) {
    await db
      .update(inviteSends)
      .set({ status: "approved", approvedAt: new Date() })
      .where(and(inArray(inviteSends.id, ids), eq(inviteSends.status, "queued")));
  }
  done();
}

export async function skipInvite(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getDb()
    .update(inviteSends)
    .set({ status: "skipped", skipReason: "overgeslagen door admin" })
    .where(and(eq(inviteSends.id, id), inArray(inviteSends.status, ["queued", "approved"])));
  done();
}

export async function saveInviteSettingsForm(formData: FormData): Promise<void> {
  await requireAdmin();
  const capStart = Math.max(1, Math.min(1000, Number(formData.get("capStart")) || 50));
  const capGrowthPerWeek = Math.max(0, Math.min(500, Number(formData.get("capGrowthPerWeek")) || 0));
  const approval = formData.get("approval") === "on";
  const s = await getInviteSettings();
  const approveUntil = approval
    ? s.approveUntil && Date.parse(s.approveUntil) > Date.now()
      ? s.approveUntil
      : new Date(Date.now() + 14 * DAY).toISOString()
    : null;
  await saveInviteSettings({ capStart, capGrowthPerWeek, approveUntil });
  done();
}

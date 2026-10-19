"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { inviteSends } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { planInvites } from "@/lib/invites/engine";
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
  await saveInviteSettings({ paused: !s.paused });
  done();
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

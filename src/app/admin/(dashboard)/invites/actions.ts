"use server";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { emailLog, inviteClicks, inviteSends } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { emailKind } from "@/lib/email/email-kind";
import { planInvites } from "@/lib/invites/engine";
import { amsterdamParts } from "@/lib/invites/logic";
import { getInviteSettings, saveInviteSettings } from "@/lib/invites/settings";


function done() {
  revalidatePath("/admin/invites");
}

/** Starts the system in the chosen mode (manual by default). */
export async function startInvites(): Promise<void> {
  await requireAdmin();
  const now = new Date();
  await saveInviteSettings({
    enabled: true,
    paused: false,
    startedAt: now.toISOString(),
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

export type RecipientHistoryItem = {
  at: string;
  /** "mail" was sent to them; "moment" is something they did (signup, ticket). */
  type: "mail" | "moment";
  kind: string;
  subject: string;
  status: string | null;
};

const MAIL_STATUS: Record<string, string> = {
  delivered: "Afgeleverd",
  opened: "Geopend",
  clicked: "Geklikt",
  bounced: "Bounce",
  complained: "Spam",
  suppressed: "Tegengehouden",
};

/**
 * Everything this address got and did, newest first: every mail in
 * email_log, the confirmations and intro mails the bookings recorded (also
 * from before email_log began), and their signups and tickets.
 */
export async function getRecipientHistory(email: string): Promise<RecipientHistoryItem[]> {
  await requireAdmin();
  const db = getDb();
  const key = email.trim().toLowerCase();
  const mails = await db
    .select({ at: emailLog.sentAt, subject: emailLog.subject, lastEvent: emailLog.lastEvent, resendId: emailLog.resendId })
    .from(emailLog)
    .where(eq(emailLog.emailNormalized, key))
    .orderBy(desc(emailLog.sentAt))
    .limit(60);
  const sends = await db.select({ id: inviteSends.id, resendId: inviteSends.resendId }).from(inviteSends).where(eq(inviteSends.emailNormalized, key));
  const clicked = new Set(
    (sends.length
      ? await db.select({ sendId: inviteClicks.sendId }).from(inviteClicks).where(inArray(inviteClicks.sendId, sends.map((x) => x.id)))
      : []
    ).map((c) => sends.find((x) => x.id === c.sendId)?.resendId),
  );
  const items: RecipientHistoryItem[] = mails.map((m) => ({
    at: m.at.toISOString(),
    type: "mail",
    kind: emailKind(m.subject),
    subject: m.subject,
    status: m.resendId && clicked.has(m.resendId) ? "Geklikt" : MAIL_STATUS[m.lastEvent ?? ""] ?? "Verstuurd",
  }));

  const bookings = (await db.execute(sql`
    select b.created_at, b.confirmation_email_sent_at, b.intro_request_sent_at, b.seats,
      coalesce(e.name_nl, '') as event_name, e.city, e.starts_at
    from bookings b join events e on e.id = b.event_id
    where lower(b.email) = ${key} and b.payment_status = 'paid'
  `)) as unknown as Array<{
    created_at: string | Date;
    confirmation_email_sent_at: string | Date | null;
    intro_request_sent_at: string | Date | null;
    seats: number;
    event_name: string;
    city: string;
    starts_at: string | Date;
  }>;
  const day = (d: string | Date) =>
    new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", day: "numeric", month: "short" }).format(new Date(d));
  // A mail the booking recorded counts once: skip it when email_log has the same kind within ten minutes.
  const logged = (kind: string, at: Date) =>
    items.some((i) => i.type === "mail" && i.kind === kind && Math.abs(Date.parse(i.at) - at.getTime()) < 10 * 60 * 1000);
  for (const b of bookings) {
    const event = `${b.event_name || b.city} ${day(b.starts_at)}`;
    items.push({
      at: new Date(b.created_at).toISOString(),
      type: "moment",
      kind: "Ticket",
      subject: `${b.seats > 1 ? `${b.seats} plekken` : "Plek"} gekocht · ${event} · ${b.city}`,
      status: null,
    });
    if (b.confirmation_email_sent_at && !logged("Bevestiging", new Date(b.confirmation_email_sent_at))) {
      items.push({ at: new Date(b.confirmation_email_sent_at).toISOString(), type: "mail", kind: "Bevestiging", subject: `Bevestiging · ${event}`, status: "Verstuurd" });
    }
    if (b.intro_request_sent_at) {
      items.push({ at: new Date(b.intro_request_sent_at).toISOString(), type: "mail", kind: "Intro", subject: `Intro-verzoek · ${event}`, status: "Verstuurd" });
    }
  }

  const signups = (await db.execute(sql`
    select created_at, 'Aangemeld · wachtlijst · ' || city as subject from waitlist_signups where lower(email) = ${key}
    union all
    select n.created_at, 'Laat het me weten · ' || e.city from event_notify_signups n join events e on e.id = n.event_id where lower(n.email) = ${key}
    union all
    select created_at, 'Quiz begonnen' || coalesce(' · ' || (state->'answers'->>'city'), '') from jouw_tafel_guests where lower(email) = ${key}
  `)) as unknown as Array<{ created_at: string | Date; subject: string }>;
  for (const s of signups) {
    items.push({ at: new Date(s.created_at).toISOString(), type: "moment", kind: "Aanmelding", subject: s.subject, status: null });
  }

  return items.sort((x, y) => y.at.localeCompare(x.at)).slice(0, 80);
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
  await saveInviteSettings({ capStart, capGrowthPerWeek });
  done();
}

/** An uncertain mail, checked by an admin in Resend: it went out, or it did not. */
export async function settleUncertainInvite(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const wasSent = formData.get("sent") === "1";
  await getDb()
    .update(inviteSends)
    .set(
      wasSent
        ? { status: "sent", sentAt: sql`coalesce(${inviteSends.claimedAt}, now())` }
        : { status: "skipped", skipReason: "niet verstuurd (gecontroleerd)" },
    )
    .where(and(eq(inviteSends.id, id), eq(inviteSends.status, "sending")));
  done();
}

/** Manual: every mail waits for approval. Auto: mails go out on their own time. */
export async function setInviteMode(mode: "manual" | "auto"): Promise<void> {
  await requireAdmin();
  await saveInviteSettings({ mode: mode === "auto" ? "auto" : "manual" });
  done();
}

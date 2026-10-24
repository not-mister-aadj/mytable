"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import { eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { emailLog, events } from "@/db/schema";
import {
  buildSundayMail,
  loadSundayMailContext,
  mailBlocker,
  sendRendered,
  type ScheduledMail,
  type SundayMailKind,
} from "@/lib/admin/sunday-mails";
import { Resend } from "resend";
import { amsterdamDateTime } from "@/lib/sunday-wine-table";

type Result = { ok: true; message: string } | { ok: false; error: string };

function isKind(value: string): value is SundayMailKind {
  return value === "location" || value === "saturday" || value === "morning" || value === "feedback";
}

/** The mail as one guest would get it. */
export async function previewSundayMailAction(
  eventId: string,
  kind: string,
  bookingId: string,
): Promise<{ ok: true; subject: string; html: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isKind(kind)) return { ok: false, error: "Onbekende mail." };
  const ctx = await loadSundayMailContext(eventId);
  if (!ctx) return { ok: false, error: "Zondag niet gevonden." };
  if (!ctx.venue) return { ok: false, error: "Deze zondag heeft nog geen locatie met adres." };
  const guest = ctx.guests.find((g) => g.bookingId === bookingId) ?? ctx.guests[0];
  if (!guest) return { ok: false, error: "Nog geen gasten." };
  if (kind !== "location" && guest.groupNumber === null) {
    return { ok: false, error: `${guest.firstName || "Deze gast"} heeft nog geen groep.` };
  }
  const mail = await buildSundayMail(ctx, kind, guest);
  const { html } = await renderEmailForDelivery(mail.element);
  return { ok: true, subject: mail.subject, html };
}

/** One copy to the admin who is logged in, as the chosen guest would get it. */
export async function sendSundayMailTestAction(eventId: string, kind: string, bookingId: string): Promise<Result> {
  const { user } = await requireAdmin();
  if (!isKind(kind)) return { ok: false, error: "Onbekende mail." };
  const ctx = await loadSundayMailContext(eventId);
  if (!ctx?.venue) return { ok: false, error: "Deze zondag heeft nog geen locatie met adres." };
  const guest = ctx.guests.find((g) => g.bookingId === bookingId) ?? ctx.guests[0];
  if (!guest) return { ok: false, error: "Nog geen gasten." };
  if (kind !== "location" && guest.groupNumber === null) return { ok: false, error: "Deze gast heeft nog geen groep." };
  const mail = await buildSundayMail(ctx, kind, guest);
  const ok = await sendRendered(user.email!, `[Test: mail van ${guest.firstName || "gast"}] ${mail.subject}`, mail.element);
  return ok ? { ok: true, message: `Test verstuurd naar ${user.email}.` } : { ok: false, error: "Versturen lukte niet." };
}

/** Sends the mail to every guest who hasn't had it yet. */
export async function sendSundayMailAction(eventId: string, kind: string): Promise<Result> {
  await requireAdmin();
  if (!isKind(kind)) return { ok: false, error: "Onbekende mail." };
  const ctx = await loadSundayMailContext(eventId);
  if (!ctx) return { ok: false, error: "Zondag niet gevonden." };
  const blocker = mailBlocker(ctx, kind);
  if (blocker) return { ok: false, error: blocker };
  if (kind !== "location" && ctx.schedule[kind]) return { ok: false, error: "Deze mail staat ingepland. Annuleer die eerst." };
  const todo = ctx.guests.filter((g) => !sentFor(g, kind));
  if (todo.length === 0) return { ok: true, message: "Iedereen heeft deze mail al." };
  let sent = 0;
  const failed: string[] = [];
  for (const guest of todo) {
    const mail = await buildSundayMail(ctx, kind, guest);
    if (await sendRendered(guest.email, mail.subject, mail.element)) sent++;
    else failed.push(guest.firstName || guest.email);
  }
  revalidatePath(`/admin/events/${eventId}/guests`);
  revalidatePath("/admin");
  return failed.length
    ? { ok: false, error: `${sent} verstuurd, niet gelukt voor: ${failed.join(", ")}.` }
    : { ok: true, message: `Verstuurd naar ${sent} ${sent === 1 ? "gast" : "gasten"}.` };
}

function sentFor(g: { sentLocation: boolean; sentSaturday: boolean; sentMorning: boolean; sentFeedback: boolean }, kind: SundayMailKind) {
  return kind === "location" ? g.sentLocation : kind === "saturday" ? g.sentSaturday : kind === "morning" ? g.sentMorning : g.sentFeedback;
}

async function setSchedule(eventId: string, kind: "saturday" | "morning" | "feedback", value: ScheduledMail | null) {
  await getDb()
    .update(events)
    .set({
      extras: value
        ? sql`coalesce(${events.extras}, '{}'::jsonb) || jsonb_build_object('mailSchedule',
            coalesce(${events.extras} -> 'mailSchedule', '{}'::jsonb) || jsonb_build_object(${kind}::text, ${JSON.stringify(value)}::jsonb))`
        : sql`coalesce(${events.extras}, '{}'::jsonb) #- ${`{mailSchedule,${kind}}`}::text[]`,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));
}

/** Hands the mail to Resend for every guest who hasn't had it, with a send
 * time (`local` is "YYYY-MM-DDTHH:mm" in Amsterdam). */
export async function scheduleSundayMailAction(eventId: string, kind: string, local: string): Promise<Result> {
  await requireAdmin();
  if (kind !== "saturday" && kind !== "morning" && kind !== "feedback") return { ok: false, error: "Deze mail kun je niet inplannen." };
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return { ok: false, error: "Kies een datum en tijd." };
  const at = amsterdamDateTime(Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5]));
  const ctx = await loadSundayMailContext(eventId);
  if (!ctx) return { ok: false, error: "Zondag niet gevonden." };
  if (at.getTime() < Date.now() + 2 * 60_000) return { ok: false, error: "Kies een tijd in de toekomst." };
  if (kind !== "feedback" && at.getTime() >= ctx.startsAt.getTime()) return { ok: false, error: "Kies een tijd voor de zondag begint." };
  if (kind === "feedback" && at.getTime() < ctx.startsAt.getTime()) return { ok: false, error: "Kies een tijd na de zondag." };
  if (ctx.schedule[kind]) return { ok: false, error: "Deze mail staat al ingepland." };
  const blocker = mailBlocker(ctx, kind);
  if (blocker) return { ok: false, error: blocker };
  const todo = ctx.guests.filter((g) => !sentFor(g, kind));
  if (todo.length === 0) return { ok: true, message: "Iedereen heeft deze mail al." };
  const ids: ScheduledMail["ids"] = [];
  const failed: string[] = [];
  for (const guest of todo) {
    const mail = await buildSundayMail(ctx, kind, guest);
    const resendId = await sendRendered(guest.email, mail.subject, mail.element, at);
    if (resendId) ids.push({ bookingId: guest.bookingId, resendId });
    else failed.push(guest.firstName || guest.email);
  }
  if (ids.length > 0) {
    await setSchedule(eventId, kind, { at: at.toISOString(), ids });
    // The send is logged now; date it to when it really goes out.
    await getDb().update(emailLog).set({ sentAt: at }).where(inArray(emailLog.resendId, ids.map((i) => i.resendId)));
  }
  revalidatePath(`/admin/events/${eventId}/guests`);
  return failed.length
    ? { ok: false, error: `${ids.length} ingepland, niet gelukt voor: ${failed.join(", ")}.` }
    : { ok: true, message: `Ingepland voor ${ids.length} ${ids.length === 1 ? "gast" : "gasten"}.` };
}

/** Takes a planned mail back from Resend, for everyone. */
export async function cancelScheduledSundayMailAction(eventId: string, kind: string): Promise<Result> {
  await requireAdmin();
  if (kind !== "saturday" && kind !== "morning" && kind !== "feedback") return { ok: false, error: "Onbekende mail." };
  const ctx = await loadSundayMailContext(eventId);
  const planned = ctx?.schedule[kind];
  if (!planned) return { ok: true, message: "Er stond niets ingepland." };
  // Cancelling needs a full-access key; the sending key may only send.
  const key = process.env.RESEND_FULL_ACCESS_API_KEY?.trim() || process.env.RESEND_READ_API_KEY?.trim();
  if (!key) return { ok: false, error: "Annuleren kan pas met RESEND_FULL_ACCESS_API_KEY. Annuleer nu in Resend zelf." };
  const resend = new Resend(key);
  const failed: string[] = [];
  for (const { resendId } of planned.ids) {
    const { error } = await resend.emails.cancel(resendId);
    if (error) failed.push(resendId);
  }
  const cancelled = planned.ids.filter((i) => !failed.includes(i.resendId));
  if (cancelled.length > 0) {
    await getDb().delete(emailLog).where(inArray(emailLog.resendId, cancelled.map((i) => i.resendId)));
  }
  await setSchedule(eventId, kind, failed.length ? { ...planned, ids: planned.ids.filter((i) => failed.includes(i.resendId)) } : null);
  revalidatePath(`/admin/events/${eventId}/guests`);
  return failed.length
    ? { ok: false, error: `${failed.length} konden niet meer geannuleerd worden (al verstuurd?).` }
    : { ok: true, message: "Ingeplande mail geannuleerd." };
}

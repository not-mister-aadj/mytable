"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { events } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import {
  buildSundayMail,
  loadSundayMailContext,
  mailBlocker,
  sendRendered,
  type SundayMailKind,
} from "@/lib/admin/sunday-mails";

type Result = { ok: true; message: string } | { ok: false; error: string };

function isKind(value: string): value is SundayMailKind {
  return value === "location" || value === "saturday";
}

/** The mail as one guest would get it (with unsaved picks, for the preview). */
export async function previewSundayMailAction(
  eventId: string,
  kind: string,
  bookingId: string,
  picks?: string,
): Promise<{ ok: true; subject: string; html: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isKind(kind)) return { ok: false, error: "Onbekende mail." };
  const ctx = await loadSundayMailContext(eventId);
  if (!ctx) return { ok: false, error: "Zondag niet gevonden." };
  if (!ctx.venue) return { ok: false, error: "Deze zondag heeft nog geen locatie met adres." };
  const guest = ctx.guests.find((g) => g.bookingId === bookingId) ?? ctx.guests[0];
  if (!guest) return { ok: false, error: "Nog geen gasten." };
  if (kind === "saturday" && guest.groupNumber === null) {
    return { ok: false, error: `${guest.firstName || "Deze gast"} heeft nog geen groep.` };
  }
  const mail = await buildSundayMail(ctx, kind, guest, picks ?? ctx.picks);
  const { html } = await renderEmailForDelivery(mail.element);
  return { ok: true, subject: mail.subject, html };
}

export async function saveSundayPicksAction(eventId: string, picks: string): Promise<Result> {
  await requireAdmin();
  await getDb()
    .update(events)
    .set({
      extras: sql`coalesce(${events.extras}, '{}'::jsonb) || jsonb_build_object('mailPicks', ${picks.slice(0, 2000)}::text)`,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));
  revalidatePath(`/admin/events/${eventId}/guests`);
  return { ok: true, message: "Aanraders opgeslagen." };
}

/** One copy to the admin who is logged in, as the chosen guest would get it. */
export async function sendSundayMailTestAction(eventId: string, kind: string, bookingId: string): Promise<Result> {
  const { user } = await requireAdmin();
  if (!isKind(kind)) return { ok: false, error: "Onbekende mail." };
  const ctx = await loadSundayMailContext(eventId);
  if (!ctx?.venue) return { ok: false, error: "Deze zondag heeft nog geen locatie met adres." };
  const guest = ctx.guests.find((g) => g.bookingId === bookingId) ?? ctx.guests[0];
  if (!guest) return { ok: false, error: "Nog geen gasten." };
  if (kind === "saturday" && guest.groupNumber === null) return { ok: false, error: "Deze gast heeft nog geen groep." };
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
  const todo = ctx.guests.filter((g) => (kind === "location" ? !g.sentLocation : !g.sentSaturday));
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

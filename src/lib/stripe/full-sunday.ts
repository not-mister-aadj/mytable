import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, type Booking, type Event } from "@/db/schema";
import { jouwTafelKiesPath } from "@/i18n/config";
import { mailLoginUrl } from "@/lib/auth/mail-login";
import { getSiteUrl } from "@/lib/env";
import { getEmailReplyTo } from "@/lib/email/resend";
import { getStripe } from "@/lib/stripe";

/**
 * Paid while the last seat went to someone else (two people in Stripe at
 * once). The money goes straight back, the booking is closed, and the guest
 * and we hear it. Runs once per booking: the booking moves out of "pending"
 * first, and only that call goes on.
 */
export const FULL_SUNDAY_EVENT = "sunday_full_refunded";

export async function refundFullSunday(input: { booking: Booking; event: Event; paymentIntentId: string | null; sessionId: string }): Promise<boolean> {
  const { booking, event } = input;
  const db = getDb();
  const [claimed] = await db
    .update(bookings)
    .set({ paymentStatus: "refunded" })
    .where(and(eq(bookings.id, booking.id), eq(bookings.paymentStatus, "pending")))
    .returning({ id: bookings.id });
  if (!claimed) return false;

  let refundId: string | null = null;
  if (input.paymentIntentId) {
    try {
      const refund = await getStripe().refunds.create(
        { payment_intent: input.paymentIntentId, metadata: { booking_id: booking.id, reason: "sunday_full" } },
        { idempotencyKey: `sunday-full-${booking.id}` },
      );
      refundId = refund.id;
    } catch (error) {
      console.error("[full sunday] refund failed", error);
    }
  }
  await db.insert(bookingEvents).values({
    bookingId: booking.id,
    type: FULL_SUNDAY_EVENT,
    payload: { sessionId: input.sessionId, refundId, amountCents: booking.amountCents },
  });

  const { sendSundayMail } = await import("@/lib/admin/sunday-mails");
  await sendSundayMail(booking.email, await fullSundayMail(booking, event)).catch((error) => console.error("[full sunday] guest mail failed", error));
  const date = sundayLabel(event.startsAt, "nl");
  await sendSundayMail(getEmailReplyTo(), {
    subject: `[vol, terugbetaald] ${booking.customerName ?? booking.email} · ${event.city} ${date}`,
    text: [
      `${booking.customerName ?? booking.email} (${booking.email}) betaalde voor ${event.city}, ${date}, terwijl de laatste plek net weg was.`,
      refundId ? `Terugbetaald: €${(booking.amountCents / 100).toFixed(2)} (${refundId}).` : "Terugbetalen lukte NIET automatisch: doe het in Stripe.",
      `Plekken: ${event.spotsSold} van ${event.capacity}.`,
    ].join("\n"),
  }).catch(() => undefined);
  return true;
}

function sundayLabel(date: Date, locale: "nl" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

async function fullSundayMail(booking: Booking, event: Event): Promise<{ subject: string; text: string }> {
  const en = booking.locale === "en";
  const locale = en ? "en" : "nl";
  const base = getSiteUrl().replace(/\/$/, "");
  const kies = await mailLoginUrl(booking.email, jouwTafelKiesPath(locale), base).catch(() => `${base}${jouwTafelKiesPath(locale)}`);
  const first = (booking.customerName ?? "").trim().split(/\s+/)[0] ?? "";
  const day = sundayLabel(event.startsAt, locale);
  const euros = `€${(booking.amountCents / 100).toFixed(2).replace(/\.00$/, "")}`;
  if (en) {
    return {
      subject: "This Sunday just filled up",
      text: [
        `Hi ${first},`,
        "",
        `While you were paying, the last seat for ${day} in ${event.city} went to someone else. We sent your ${euros} straight back; it is in your account within a few days.`,
        "",
        `Pick another Sunday here: ${kies}`,
        "",
        "The MyTable team",
      ].join("\n"),
    };
  }
  return {
    subject: "Deze zondag was net vol",
    text: [
      `Hoi ${first},`,
      "",
      `Terwijl je betaalde, ging de laatste plek voor ${day} in ${event.city} net naar iemand anders. Je ${euros} hebben we meteen teruggestort; binnen een paar dagen staat het weer op je rekening.`,
      "",
      `Kies hier een andere zondag: ${kies}`,
      "",
      "Het MyTable team",
    ].join("\n"),
  };
}

/** A member's table filled up while they joined: the membership stays, the Sunday did not fit. */
export async function tellMemberSundayWasFull(input: { bookingId: string }): Promise<void> {
  const db = getDb();
  const { events } = await import("@/db/schema");
  const [row] = await db
    .select({ booking: bookings, event: events })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(eq(bookings.id, input.bookingId))
    .limit(1);
  if (!row) return;
  const { booking, event } = row;
  const en = booking.locale === "en";
  const locale = en ? "en" : "nl";
  const base = getSiteUrl().replace(/\/$/, "");
  const kies = await mailLoginUrl(booking.email, jouwTafelKiesPath(locale), base).catch(() => `${base}${jouwTafelKiesPath(locale)}`);
  const first = (booking.customerName ?? "").trim().split(/\s+/)[0] ?? "";
  const day = sundayLabel(event.startsAt, locale);
  const { sendSundayMail } = await import("@/lib/admin/sunday-mails");
  await sendSundayMail(
    booking.email,
    en
      ? {
          subject: "This Sunday just filled up",
          text: [`Hi ${first},`, "", `Welcome as a club member. While you joined, the last seat for ${day} in ${event.city} went to someone else. Your club membership is active, so pick another Sunday here: ${kies}`, "", "The MyTable team"].join("\n"),
        }
      : {
          subject: "Deze zondag was net vol",
          text: [`Hoi ${first},`, "", `Welkom als club member. Terwijl je lid werd, ging de laatste plek voor ${day} in ${event.city} net naar iemand anders. Je club membership loopt, dus kies hier een andere zondag: ${kies}`, "", "Het MyTable team"].join("\n"),
        },
  ).catch((error) => console.error("[full sunday] member mail failed", error));
  await sendSundayMail(getEmailReplyTo(), {
    subject: `[vol, nieuw member] ${booking.customerName ?? booking.email} · ${event.city} ${sundayLabel(event.startsAt, "nl")}`,
    text: `${booking.customerName ?? booking.email} (${booking.email}) werd club member voor ${event.city}, maar die zondag was net vol. Membership loopt; we vroegen een andere zondag te kiezen. Eventueel een tafel erbij zetten?`,
  }).catch(() => undefined);
}

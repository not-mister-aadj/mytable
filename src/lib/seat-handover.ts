import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookingEvents, bookings, eventGroups, eventVenues, events, venues } from "@/db/schema";
import { buttonMail, dropPlannedMailsFor, longDate, sendSundayMail, shortDate } from "@/lib/admin/sunday-mails";
import { onBookingCreated } from "@/lib/customers/hooks";
import { normalizeEmail } from "@/lib/customers/normalize";
import { getEmailReplyTo } from "@/lib/email/resend";
import { isValidEmail } from "@/lib/event-notify-signups";
import { tablePageUrl } from "@/lib/table-page";

/**
 * "Geef mijn plek door" on the table page, once the seat is fixed (less than
 * 7 days before): someone else comes in the guest's place, so the table stays
 * complete. The seat moves to a booking in the other person's name, in the
 * same group; they get a mail with their table page, and we hear about it.
 * Not a missed Sunday.
 */

const FROM = "MyTable <hallo@tafels.mytable.club>";

export type HandOverResult = { ok: true; bookingId: string } | { ok: false; error: "closed" | "invalid" | "same" | "already" | "failed" };

export async function handOverSeat(bookingId: string, to: { name: string; email: string; birthDate?: string | null }, now: Date = new Date()): Promise<HandOverResult> {
  const name = to.name.trim().replace(/\s+/g, " ").slice(0, 80);
  const email = to.email.trim().toLowerCase();
  if (!name || !isValidEmail(email)) return { ok: false, error: "invalid" };
  const db = getDb();
  let done: { fresh: typeof bookings.$inferSelect; old: typeof bookings.$inferSelect; event: typeof events.$inferSelect } | HandOverResult;
  try {
    done = await db.transaction(async (tx) => {
      const [old] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).for("update").limit(1);
      if (!old || old.paymentStatus !== "paid" || old.lifecycleStatus !== "active" || old.cancelledLateAt || old.noShowAt) {
        return { ok: false, error: "closed" } as const;
      }
      const [event] = await tx.select().from(events).where(eq(events.id, old.eventId)).limit(1);
      if (!event || event.startsAt.getTime() <= now.getTime()) return { ok: false, error: "closed" } as const;
      if (normalizeEmail(old.email) === email) return { ok: false, error: "same" } as const;
      const [there] = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.eventId, event.id),
            eq(bookings.paymentStatus, "paid"),
            eq(bookings.lifecycleStatus, "active"),
            isNull(bookings.cancelledLateAt),
            sql`lower(trim(${bookings.email})) = ${email}`,
          ),
        )
        .limit(1);
      if (there) return { ok: false, error: "already" } as const;
      const [fresh] = await tx
        .insert(bookings)
        .values({
          eventId: event.id,
          email,
          customerName: name,
          seats: old.seats,
          amountCents: old.amountCents,
          currency: old.currency,
          stripePaymentIntentId: old.stripePaymentIntentId,
          paymentStatus: "paid",
          locale: old.locale,
          tableLanguagePreference: old.tableLanguagePreference,
          birthDate: to.birthDate ?? null,
          membershipId: old.membershipId,
          groupId: old.groupId,
          lifecycleStatus: "active",
          transferredFromBookingId: old.id,
          transferredAt: now,
          transferredBy: "doorgegeven",
          confirmationEmailSentAt: now,
        })
        .returning();
      if (!fresh) throw new Error("no new booking");
      await tx
        .update(bookings)
        .set({ lifecycleStatus: "transferred", transferredToEventId: event.id, transferredToBookingId: fresh.id, transferredAt: now, transferredBy: "doorgegeven" })
        .where(eq(bookings.id, old.id));
      await tx.insert(bookingEvents).values([
        { bookingId: old.id, type: "handed_over", payload: { toBookingId: fresh.id, toName: name } },
        { bookingId: fresh.id, type: "handed_over_in", payload: { fromBookingId: old.id } },
      ]);
      return { fresh, old, event };
    });
  } catch (error) {
    console.error("[seat-handover] failed", error);
    return { ok: false, error: "failed" };
  }
  if ("ok" in done) return done;
  const { fresh, old, event } = done;

  await onBookingCreated({ booking: fresh, event }).catch((error) => console.error("[seat-handover] customer link failed", error));
  // Planned Sunday mails were made for the first guest: those are taken back, ours to plan again.
  const left = await dropPlannedMailsFor(event.id, old.id).catch(() => ["saturday", "morning", "feedback"]);

  const locale = old.locale === "en" ? "en" : "nl";
  const [venue] = await db
    .select({ name: venues.name, address: venues.address })
    .from(eventVenues)
    .innerJoin(venues, eq(venues.id, eventVenues.venueId))
    .where(eq(eventVenues.eventId, event.id))
    .orderBy(eventVenues.position)
    .limit(1);
  const mail = handedOverMail({
    locale,
    firstName: name.split(" ")[0]!,
    fromName: old.customerName?.trim().split(/\s+/)[0] ?? "",
    city: event.city,
    startsAt: event.startsAt,
    // The address only once the location mail is out (a week before).
    venue: venue?.address && event.startsAt.getTime() - now.getTime() <= 7 * 86_400_000 ? { name: venue.name, address: venue.address } : null,
    tableUrl: await tablePageUrl(fresh.id, locale),
  });
  await sendSundayMail(email, { ...mail, from: FROM }).catch((error) => console.error("[seat-handover] mail failed", error));

  const [group] = old.groupId ? await db.select({ number: eventGroups.number }).from(eventGroups).where(eq(eventGroups.id, old.groupId)).limit(1) : [];
  const date = shortDate(event.startsAt, "nl");
  await sendSundayMail(getEmailReplyTo(), {
    subject: `[doorgegeven] ${old.customerName?.trim() || old.email} → ${name} · ${event.city} ${date}`,
    text: [
      `${old.customerName?.trim() || old.email} heeft de plek voor ${event.city}, ${date} doorgegeven.`,
      "",
      `Komt nu: ${name}, ${email}`,
      ...(group ? [`Groep ${group.number}`] : []),
      ...(left.length ? [`Geplande mail niet teruggehaald: ${left.join(", ")}`] : []),
      "Al geplande zondagmails staan nog niet op de nieuwe gast: plan ze opnieuw.",
    ].join("\n"),
  }).catch((error) => console.error("[seat-handover] telling the owner failed", error));

  // The guest who gave it: it's taken care of.
  const giver = handOverDoneMail({ locale, firstName: old.customerName?.trim().split(/\s+/)[0] ?? "", toName: name.split(" ")[0]!, city: event.city, startsAt: event.startsAt });
  await sendSundayMail(old.email, { ...giver, from: FROM }).catch((error) => console.error("[seat-handover] mail to the giver failed", error));
  return { ok: true, bookingId: fresh.id };
}

/** To the guest who handed the seat over: who comes instead. Short, no fault. */
export function handOverDoneMail(p: { locale: "nl" | "en"; firstName: string; toName: string; city: string; startsAt: Date }): { subject: string; text: string; html: string } {
  const nl = p.locale === "nl";
  const day = longDate(p.startsAt, p.locale);
  const text = (
    nl
      ? [`Hoi${p.firstName ? ` ${p.firstName}` : ""},`, "", `${p.toName} neemt je plek over op ${day} in ${p.city}. Fijn dat je het geregeld hebt.`, "", "Tot een volgende keer,", "MyTable"]
      : [`Hi${p.firstName ? ` ${p.firstName}` : ""},`, "", `${p.toName} is taking your seat on ${day} in ${p.city}. Thanks for sorting it out.`, "", "See you another time,", "MyTable"]
  ).join("\n");
  const escape = (l: string) => l.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const paragraphs = text.split("\n\n").map((b) => `<p style="margin:0 0 16px">${b.split("\n").map(escape).join("<br>")}</p>`);
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#2b0d12;max-width:560px">${paragraphs.join("")}</div>`;
  return { subject: nl ? `${p.toName} neemt je plek over · ${shortDate(p.startsAt, "nl")}` : `${p.toName} is taking your seat · ${shortDate(p.startsAt, "en")}`, text, html };
}

/** To the one who comes instead: what it is, where and when, and their table page. */
export function handedOverMail(p: {
  locale: "nl" | "en";
  firstName: string;
  fromName: string;
  city: string;
  startsAt: Date;
  venue: { name: string; address: string } | null;
  tableUrl: string;
}): { subject: string; text: string; html: string } {
  const nl = p.locale === "nl";
  const day = longDate(p.startsAt, p.locale);
  const at = new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit" }).format(p.startsAt);
  const from = p.fromName || (nl ? "Iemand" : "Someone");
  const where = p.venue ? (nl ? `bij ${p.venue.name} (${p.venue.address})` : `at ${p.venue.name} (${p.venue.address})`) : `in ${p.city}`;
  const text = (
    nl
      ? [
          `Hoi ${p.firstName},`,
          "",
          `${from} kan er niet bij zijn en heeft de plek aan jou gegeven. Je schuift aan op ${day} om ${at} ${where}.`,
          "",
          "Sunday Social is een middag aan tafel met een kleine groep mensen van rond jouw leeftijd. De plek is geregeld; wat je bestelt, reken je zelf af.",
          "",
          "Op je tafelpagina zie je waar je zit en met wie. Daar vul je ook drie korte vragen in, zodat je tafel weet wie er aanschuift:",
          p.tableUrl,
          "",
          "Tot zondag,",
          "MyTable",
        ]
      : [
          `Hi ${p.firstName},`,
          "",
          `${from} can't make it and has given the seat to you. You're joining on ${day} at ${at} ${where}.`,
          "",
          "Sunday Social is an afternoon at a table with a small group of people around your age. The seat is taken care of; what you order, you pay yourself.",
          "",
          "Your table page shows where you sit and with whom. There you also answer three short questions, so your table knows who is joining:",
          p.tableUrl,
          "",
          "See you Sunday,",
          "MyTable",
        ]
  ).join("\n");
  return {
    subject: nl ? `${from} heeft je een plek gegeven: ${day} in ${p.city}` : `${from} has given you a seat: ${day} in ${p.city}`,
    ...buttonMail(text, p.tableUrl, nl ? "Naar je tafelpagina" : "To your table page"),
  };
}

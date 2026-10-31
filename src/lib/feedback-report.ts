import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/index";
import { bookings, events, feedbackReports } from "@/db/schema";
import { getAdminHost } from "@/lib/admin-url";
import { getEmailFrom, getResendClient } from "@/lib/email/resend";
import { loadFeedbackPage } from "@/lib/feedback";

/**
 * "Gebeurde er iets waar je je niet prettig bij voelde?": a quiet line in the
 * 20:00 mail opens a short page with the same link. What they write is only
 * for us, and info@ gets a mail for every report.
 */

const REPORT_TO = "info@mytable.club";
const MAX_BODY = 4000;

export type ReportInput = { about: string[]; aboutOther: boolean; body: string; contactOk: boolean };

export async function saveFeedbackReport(bookingId: string, input: ReportInput): Promise<boolean> {
  const page = await loadFeedbackPage(bookingId);
  const body = input.body.trim().slice(0, MAX_BODY);
  if (!page || !body) return false;
  const allowed = new Set(page.tablemates.map((m) => m.bookingId));
  const about = input.about.filter((id) => allowed.has(id));

  const db = getDb();
  const [row] = await db
    .select({ name: bookings.customerName, email: bookings.email, eventId: events.id, startsAt: events.startsAt })
    .from(bookings)
    .innerJoin(events, eq(events.id, bookings.eventId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!row) return false;

  await db.insert(feedbackReports).values({
    bookingId,
    eventId: row.eventId,
    about,
    aboutOther: input.aboutOther,
    body,
    contactOk: input.contactOk,
  });

  const names = about.length
    ? (await db.select({ name: bookings.customerName }).from(bookings).where(inArray(bookings.id, about))).map((r) => r.name?.trim() || "?")
    : [];
  if (input.aboutOther) names.push("iemand anders");
  const day = new Intl.DateTimeFormat("nl-NL", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(row.startsAt);
  const where = `${page.venueName ?? page.city}, ${day}`;

  const resend = getResendClient();
  if (resend) {
    await resend.emails.send({
      from: getEmailFrom(),
      to: REPORT_TO,
      replyTo: row.email,
      subject: `Melding na Sunday Social: ${where}`,
      text: [
        `${row.name?.trim() || "Een gast"} (${row.email}) meldt iets na ${where}.`,
        "",
        `Over: ${names.length ? names.join(", ") : "niemand aangetikt"}`,
        `Contact opnemen: ${input.contactOk ? "ja" : "nee"}`,
        "",
        body,
        "",
        `https://${getAdminHost()}/events/${row.eventId}/guests?tab=feedback`,
      ].join("\n"),
    });
  }
  return true;
}

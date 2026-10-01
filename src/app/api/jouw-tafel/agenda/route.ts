import { and, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { events } from "@/db/schema";

/** iCalendar text: escape the characters RFC 5545 reserves. */
function icsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Calendar file for a Sunday Table that is not on sale yet ("Jouw tafel komt
 * eraan" in the quiz). Served as a real text/calendar response rather than a
 * blob download, because the Instagram and Facebook in-app browsers only
 * offer "add to calendar" for files that come from a URL.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("event")?.trim();
  const locale = url.searchParams.get("locale") === "en" ? "en" : "nl";
  if (!slug || !isDbConfigured()) {
    return new Response("Not found", { status: 404 });
  }

  const db = getDb();
  const [event] = await db
    .select({
      id: events.id,
      city: events.city,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
    })
    .from(events)
    .where(
      and(
        eq(events.slug, slug),
        eq(events.experienceType, "sunday-table"),
        eq(events.workflowStatus, "published"),
      ),
    )
    .limit(1);
  if (!event) return new Response("Not found", { status: 404 });

  const start = event.startsAt;
  const end = event.endsAt ?? new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const summary = `Sunday Table ${event.city} (MyTable)`;
  const description =
    locale === "en"
      ? "Booking for this table opens soon. You're on the list, so you'll hear it first by email. www.mytable.club"
      : "Aanmelden voor deze tafel opent binnenkort. Je staat op de lijst en hoort het als eerste per mail. www.mytable.club";

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyTable//Sunday Table//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@mytable.club`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(summary)}`,
    `DESCRIPTION:${icsText(description)}`,
    `LOCATION:${icsText(event.city)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="sunday-table-${slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}

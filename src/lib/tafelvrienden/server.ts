import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { SUNDAY_SOCIAL_TYPE, JOUW_TAFEL_TYPE } from "@/lib/event-concepts";
import { feedbackUrl, loadFeedbackPage, saveFeedback } from "@/lib/feedback";
import { isLikeWindowOpen, likeWindowClosesAt, mutualMatches, type Pick } from "@/lib/tafelvrienden/logic";

/** Tafelvrienden: who someone picked to see again, on their profile page. */

const key = (email: string) => email.trim().toLowerCase();
const firstName = (name: string | null) => name?.trim().split(/\s+/)[0] || "";

export type TafelMate = { bookingId: string; firstName: string; photoUrl: string | null; liked: boolean };

/** A Sunday whose tablemates can still be picked (until the next Sunday 18:00). */
export type RecentSunday = {
  bookingId: string;
  label: string;
  venue: string | null;
  closesAt: string;
  reportUrl: string;
  mates: TafelMate[];
};

/** Someone they picked: one row per person, the latest Sunday they met. */
export type TafelVriend = { email: string; firstName: string; photoUrl: string | null; metAt: string; venue: string | null };

export type OpenReport = { id: string; about: string; metAt: string };

export type Tafelvrienden = { recent: RecentSunday[]; friends: TafelVriend[]; reports: OpenReport[] };

function dateLabel(d: Date, locale: "nl" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Amsterdam",
  })
    .format(d)
    .replace(".", "");
}

/** Photos of people who share their answers with their table. */
async function sharedPhotos(emails: string[]): Promise<Map<string, string>> {
  if (emails.length === 0) return new Map();
  const rows = (await getDb().execute(sql`
    select email_normalized as email, photo_url from customers
    where email_normalized in (${sql.join(emails.map((e) => sql`${key(e)}`), sql`, `)})
      and intro_share_consent and photo_url is not null`)) as unknown as Array<{ email: string; photo_url: string }>;
  return new Map(rows.map((r) => [r.email, r.photo_url]));
}

export async function loadTafelvrienden(email: string, locale: "nl" | "en", now = new Date()): Promise<Tafelvrienden> {
  const db = getDb();
  const me = key(email);

  const sundays = (await db.execute(sql`
    select b.id, e.starts_at, coalesce(gv.name, (select v.name from event_venues ev join venues v on v.id = ev.venue_id where ev.event_id = e.id order by ev.position limit 1)) as venue
    from bookings b
    join events e on e.id = b.event_id
    left join event_groups g on g.id = b.group_id
    left join venues gv on gv.id = g.venue_id
    where lower(trim(b.email)) = ${me} and b.payment_status = 'paid' and b.lifecycle_status = 'active'
      and b.no_show_at is null and b.cancelled_late_at is null
      and e.experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
      and e.starts_at <= ${now.toISOString()}::timestamptz
    order by e.starts_at desc`)) as unknown as Array<{ id: string; starts_at: Date; venue: string | null }>;

  const recent: RecentSunday[] = [];
  for (const s of sundays) {
    const startsAt = new Date(s.starts_at);
    if (!isLikeWindowOpen(startsAt, now)) continue;
    const page = await loadFeedbackPage(s.id, now.getTime());
    if (!page || page.tablemates.length === 0) continue;
    const mateEmails = (await db.execute(sql`
      select id, lower(trim(email)) as email from bookings
      where id in (${sql.join(page.tablemates.map((m) => sql`${m.bookingId}::uuid`), sql`, `)})`)) as unknown as Array<{ id: string; email: string }>;
    const emailOf = new Map(mateEmails.map((m) => [m.id, m.email]));
    const photos = await sharedPhotos(mateEmails.map((m) => m.email));
    const liked = new Set(page.saved.wantToSee);
    recent.push({
      bookingId: s.id,
      label: dateLabel(startsAt, locale),
      venue: s.venue,
      closesAt: likeWindowClosesAt(startsAt).toISOString(),
      reportUrl: `${await feedbackUrl(s.id, locale)}/melden`,
      mates: page.tablemates.map((m) => ({
        bookingId: m.bookingId,
        firstName: m.firstName,
        photoUrl: photos.get(emailOf.get(m.bookingId) ?? "") ?? null,
        liked: liked.has(m.bookingId),
      })),
    });
  }

  const picked = (await db.execute(sql`
    select lower(trim(tb.email)) as email, tb.customer_name as name, e.starts_at,
      coalesce(gv.name, (select v.name from event_venues ev join venues v on v.id = ev.venue_id where ev.event_id = e.id order by ev.position limit 1)) as venue
    from booking_feedback f
    join bookings fb on fb.id = f.booking_id
    cross join lateral jsonb_array_elements_text(f.want_to_see) w(id)
    join bookings tb on tb.id::text = w.id
    join events e on e.id = tb.event_id
    left join event_groups g on g.id = tb.group_id
    left join venues gv on gv.id = g.venue_id
    where lower(trim(fb.email)) = ${me}
    order by e.starts_at desc`)) as unknown as Array<{ email: string; name: string | null; starts_at: Date; venue: string | null }>;
  const seen = new Set<string>();
  const latest = picked.filter((p) => p.email !== me && !seen.has(p.email) && seen.add(p.email));
  const photos = await sharedPhotos(latest.map((p) => p.email));
  const friends = latest.map((p) => ({
    email: p.email,
    firstName: firstName(p.name) || "Gast",
    photoUrl: photos.get(p.email) ?? null,
    metAt: dateLabel(new Date(p.starts_at), locale),
    venue: p.venue,
  }));

  const reportRows = (await db.execute(sql`
    select r.id, r.about_venue, r.about_other, r.about_other_note, e.starts_at,
      (select string_agg(split_part(coalesce(tb.customer_name, 'Gast'), ' ', 1), ', ')
         from jsonb_array_elements_text(r.about) a(id) join bookings tb on tb.id::text = a.id) as names
    from feedback_reports r
    join bookings fb on fb.id = r.booking_id
    join events e on e.id = r.event_id
    where lower(trim(fb.email)) = ${me} and r.withdrawn_at is null
    order by r.created_at desc`)) as unknown as Array<{
    id: string;
    about_venue: boolean;
    about_other: boolean;
    about_other_note: string | null;
    starts_at: Date;
    names: string | null;
  }>;
  const venueWord = locale === "en" ? "the venue" : "de zaak";
  const otherWord = locale === "en" ? "someone else" : "iemand anders";
  const reports = reportRows.map((r) => ({
    id: r.id,
    about: [r.names, r.about_venue ? venueWord : null, r.about_other ? r.about_other_note?.trim() || otherWord : null].filter(Boolean).join(", "),
    metAt: dateLabel(new Date(r.starts_at), locale),
  }));

  return { recent, friends, reports };
}

/** Owns this booking and it is a past shared-table Sunday they were at. */
async function ownBooking(email: string, bookingId: string): Promise<boolean> {
  const [row] = (await getDb().execute(sql`
    select 1 from bookings where id = ${bookingId}::uuid and lower(trim(email)) = ${key(email)}
      and payment_status = 'paid' and lifecycle_status = 'active' limit 1`)) as unknown as unknown[];
  return Boolean(row);
}

/** Picks or unpicks a tablemate of a recent Sunday (only while the week is open). */
export async function setLike(email: string, bookingId: string, mateBookingId: string, on: boolean, now = new Date()): Promise<boolean> {
  if (!(await ownBooking(email, bookingId))) return false;
  const page = await loadFeedbackPage(bookingId, now.getTime());
  if (!page || !page.tablemates.some((m) => m.bookingId === mateBookingId)) return false;
  const [event] = (await getDb().execute(sql`
    select e.starts_at from bookings b join events e on e.id = b.event_id where b.id = ${bookingId}::uuid`)) as unknown as Array<{ starts_at: Date }>;
  if (!event || !isLikeWindowOpen(new Date(event.starts_at), now)) return false;
  const current = new Set(page.saved.wantToSee);
  if (on) current.add(mateBookingId);
  else current.delete(mateBookingId);
  await saveFeedback(bookingId, { wantToSee: [...current] });
  return true;
}

/** Removes someone from their list: every pick of them, on every Sunday. */
export async function removeFriend(email: string, friendEmail: string): Promise<void> {
  await getDb().execute(sql`
    update booking_feedback f set
      want_to_see = coalesce((
        select jsonb_agg(w.id) from jsonb_array_elements_text(f.want_to_see) w(id)
        where not exists (select 1 from bookings tb where tb.id::text = w.id and lower(trim(tb.email)) = ${key(friendEmail)})
      ), '[]'::jsonb),
      updated_at = now()
    from bookings fb
    where fb.id = f.booking_id and lower(trim(fb.email)) = ${key(email)}`);
}

/** Withdraws a report they made. Admin keeps seeing it, marked as withdrawn. */
export async function withdrawReport(email: string, reportId: string): Promise<boolean> {
  const rows = (await getDb().execute(sql`
    update feedback_reports r set withdrawn_at = now()
    from bookings fb
    where r.id = ${reportId}::uuid and fb.id = r.booking_id and lower(trim(fb.email)) = ${key(email)} and r.withdrawn_at is null
    returning r.id`)) as unknown as unknown[];
  return rows.length > 0;
}

/** Everyone's mutual likes, without open reports between them (for the match mails). */
export async function loadMutualMatches(): Promise<Map<string, Set<string>>> {
  const db = getDb();
  const [likes, reports] = await Promise.all([
    db.execute(sql`
      select lower(trim(fb.email)) as "from", lower(trim(tb.email)) as "to"
      from booking_feedback f
      join bookings fb on fb.id = f.booking_id
      cross join lateral jsonb_array_elements_text(f.want_to_see) w(id)
      join bookings tb on tb.id::text = w.id`),
    db.execute(sql`
      select lower(trim(fb.email)) as "from", lower(trim(tb.email)) as "to"
      from feedback_reports r
      join bookings fb on fb.id = r.booking_id
      cross join lateral jsonb_array_elements_text(r.about) a(id)
      join bookings tb on tb.id::text = a.id
      where r.withdrawn_at is null`),
  ]);
  return mutualMatches(likes as unknown as Pick[], reports as unknown as Pick[]);
}

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { siteSettings } from "@/db/schema";
import { getEmailFrom, getResendClient } from "@/lib/email/resend";

/**
 * Resend's free plan sends at most 100 mails a day; above that, mails are
 * not sent at all. From 80 on a day (sent plus planned), admin shows it and
 * info@ gets one mail per day.
 */
export const EMAIL_DAY_WARN = 80;
export const EMAIL_DAY_LIMIT = 100;
const ALERT_TO = "info@mytable.club";
const ALERT_KEY = "email_volume_alerts";

const amsterdamDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(d);

/** Mails per Amsterdam day for today and tomorrow: sent, planned and invites in the queue. */
export async function emailVolume(now = new Date()): Promise<{ day: string; count: number }[]> {
  const days = [amsterdamDay(now), amsterdamDay(new Date(now.getTime() + 86_400_000))];
  // Logged sends (planned ones on their day) plus invites still waiting in the queue.
  const rows = await getDb().execute<{ day: string; n: number }>(sql`
    select day, sum(n)::int as n from (
      select to_char(sent_at at time zone 'Europe/Amsterdam', 'YYYY-MM-DD') as day, count(*) as n
      from email_log
      where (sent_at at time zone 'Europe/Amsterdam')::date in (${days[0]}::date, ${days[1]}::date)
      group by 1
      union all
      select to_char(scheduled_for at time zone 'Europe/Amsterdam', 'YYYY-MM-DD'), count(*)
      from invite_sends
      where status in ('queued', 'approved') and (scheduled_for at time zone 'Europe/Amsterdam')::date in (${days[0]}::date, ${days[1]}::date)
      group by 1
    ) t group by day`);
  const byDay = new Map(rows.map((r) => [r.day, Number(r.n)]));
  return days.map((day) => ({ day, count: byDay.get(day) ?? 0 }));
}

/** Mails info@ once per day that reaches the warning level. Returns the days it mailed about. */
export async function alertOnEmailVolume(now = new Date()): Promise<string[]> {
  const volume = await emailVolume(now);
  const db = getDb();
  const [row] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, ALERT_KEY)).limit(1);
  const stored = row?.value?.days;
  const alerted = new Set(Array.isArray(stored) ? (stored as string[]) : []);
  const due = volume.filter((v) => v.count >= EMAIL_DAY_WARN && !alerted.has(v.day));
  if (due.length === 0) return [];
  const resend = getResendClient();
  if (!resend) return [];
  const label = (day: string) =>
    new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(
      new Date(`${day}T12:00:00Z`),
    );
  const lines = due.map((v) => `${label(v.day)}: ${v.count} mails (verstuurd en ingepland)`);
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to: ALERT_TO,
    subject: `Mail-limiet bijna bereikt: ${due.map((v) => v.count).join(" / ")} van ${EMAIL_DAY_LIMIT}`,
    text: [
      "Hoi,",
      "",
      `Resend verstuurt op het gratis abonnement maximaal ${EMAIL_DAY_LIMIT} mails per dag. Wat daarboven komt, gaat niet de deur uit.`,
      "",
      ...lines,
      "",
      "Overweeg een betaald abonnement in Resend (Settings > Billing), of verschuif ingeplande mails naar een andere dag.",
      "",
      "MyTable admin",
    ].join("\n"),
  });
  if (error) return [];
  const next = [...alerted, ...due.map((v) => v.day)].slice(-30);
  await db
    .insert(siteSettings)
    .values({ key: ALERT_KEY, value: { days: next }, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: { days: next }, updatedAt: new Date() } });
  return due.map((v) => v.day);
}

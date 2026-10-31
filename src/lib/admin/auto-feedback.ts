import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { buildSundayMail, defaultScheduleAt, loadSundayMailContext, mailBlocker, mailRecipients, sendSundayMail } from "@/lib/admin/sunday-mails";
import { emailVolume } from "@/lib/email/volume";

/**
 * Mails after a Sunday that go by themselves, from an hourly cron: the
 * feedback mail from 20:00 (Amsterdam) that day, and on Wednesday from 08:00
 * the reminder for who didn't answer. Each to every guest who hasn't had it,
 * and only within a day of its time, so nothing old goes out. A mail planned
 * by hand wins. Above SAFE_DAY_TOTAL mails on a day the rest waits, and
 * admin shows it under Te doen.
 */

export type AutoMailKind = "feedback" | "reminder";
export const AUTO_MAIL_KINDS: AutoMailKind[] = ["feedback", "reminder"];

const SAFE_DAY_TOTAL = 90;
const SEND_INTERVAL_MS = 600;
const DAY_MS = 86_400_000;

/** Sundays whose mail of this kind is due now: past its time, less than a day ago. */
export async function dueAutoMailEvents(kind: AutoMailKind, now = new Date()): Promise<string[]> {
  const rows = await getDb().execute<{ id: string; starts_at: Date }>(sql`
    select id, starts_at from events
    where workflow_status = 'published'
      and experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
      and starts_at between ${new Date(now.getTime() - 5 * DAY_MS).toISOString()}::timestamptz and ${now.toISOString()}::timestamptz`);
  return rows
    .filter((r) => {
      const at = defaultScheduleAt(new Date(r.starts_at), kind).getTime();
      return now.getTime() >= at && now.getTime() < at + DAY_MS;
    })
    .map((r) => r.id);
}

/** Guests of this kind still waiting for it. */
export const sentAuto = (kind: AutoMailKind, g: { sentFeedback: boolean; sentReminder: boolean }) =>
  kind === "feedback" ? g.sentFeedback : g.sentReminder;

export type AutoMailResult = { kind: AutoMailKind; eventId: string; sent: number; held: number; failed: number };

export async function sendDueAutoMails(now = new Date()): Promise<AutoMailResult[]> {
  const results: AutoMailResult[] = [];
  let today = (await emailVolume(now))[0]?.count ?? 0;
  for (const kind of AUTO_MAIL_KINDS) {
    for (const eventId of await dueAutoMailEvents(kind, now)) {
      const ctx = await loadSundayMailContext(eventId);
      if (!ctx || (kind === "feedback" && ctx.schedule.feedback) || mailBlocker(ctx, kind)) continue;
      const todo = mailRecipients(ctx, kind).filter((g) => !sentAuto(kind, g));
      const result = { kind, eventId, sent: 0, held: 0, failed: 0 };
      for (const guest of todo) {
        if (today >= SAFE_DAY_TOTAL) {
          result.held++;
          continue;
        }
        if (result.sent + result.failed > 0) await new Promise((r) => setTimeout(r, SEND_INTERVAL_MS));
        const mail = await buildSundayMail(ctx, kind, guest);
        if (await sendSundayMail(guest.email, mail)) {
          result.sent++;
          today++;
        } else result.failed++;
      }
      if (todo.length > 0) results.push(result);
    }
  }
  return results;
}

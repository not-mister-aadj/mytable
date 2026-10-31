import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { buildSundayMail, defaultScheduleAt, loadSundayMailContext, mailBlocker, mailRecipients, sendSundayMail } from "@/lib/admin/sunday-mails";
import { emailVolume } from "@/lib/email/volume";

/**
 * The feedback mail goes by itself: from 20:00 (Amsterdam) on the day of a
 * Sunday, an hourly cron sends it to every guest who hasn't had it. Only
 * Sundays of the last 24 hours, so nothing old goes out. A mail planned by
 * hand wins. Above SAFE_DAY_TOTAL mails on a day the rest waits, and admin
 * shows it under Te doen.
 */

const SAFE_DAY_TOTAL = 90;
const SEND_INTERVAL_MS = 600;

/** 20:00 in Amsterdam on the day the Sunday starts. */
export const feedbackSendAt = (startsAt: Date) => defaultScheduleAt(startsAt, "feedback");

/** Sundays whose feedback mail is due now: past 20:00 that day, less than a day ago. */
export async function dueFeedbackEvents(now = new Date()): Promise<string[]> {
  const rows = await getDb().execute<{ id: string; starts_at: Date }>(sql`
    select id, starts_at from events
    where workflow_status = 'published'
      and experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
      and starts_at between ${new Date(now.getTime() - 2 * 86_400_000).toISOString()}::timestamptz and ${now.toISOString()}::timestamptz`);
  return rows
    .filter((r) => {
      const at = feedbackSendAt(new Date(r.starts_at)).getTime();
      return now.getTime() >= at && now.getTime() < at + 86_400_000;
    })
    .map((r) => r.id);
}

export type AutoFeedbackResult = { eventId: string; sent: number; held: number; failed: number };

export async function sendDueFeedbackMails(now = new Date()): Promise<AutoFeedbackResult[]> {
  const results: AutoFeedbackResult[] = [];
  let today = (await emailVolume(now))[0]?.count ?? 0;
  for (const eventId of await dueFeedbackEvents(now)) {
    const ctx = await loadSundayMailContext(eventId);
    if (!ctx || ctx.schedule.feedback || mailBlocker(ctx, "feedback")) continue;
    const todo = mailRecipients(ctx, "feedback").filter((g) => !g.sentFeedback);
    const result = { eventId, sent: 0, held: 0, failed: 0 };
    for (const guest of todo) {
      if (today >= SAFE_DAY_TOTAL) {
        result.held++;
        continue;
      }
      if (result.sent + result.failed > 0) await new Promise((r) => setTimeout(r, SEND_INTERVAL_MS));
      const mail = await buildSundayMail(ctx, "feedback", guest);
      if (await sendSundayMail(guest.email, mail)) {
        result.sent++;
        today++;
      } else result.failed++;
    }
    if (todo.length > 0) results.push(result);
  }
  return results;
}

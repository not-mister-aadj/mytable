import { sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { JOUW_TAFEL_TYPE, SUNDAY_SOCIAL_TYPE } from "@/lib/event-concepts";
import { buildSundayMail, defaultScheduleAt, loadSundayMailContext, mailBlocker, mailRecipients, sendSundayMail } from "@/lib/admin/sunday-mails";
import { emailVolume } from "@/lib/email/volume";

/**
 * Sunday mails that go by themselves, from an hourly cron: "Kom je zondag?"
 * nine days before from 10:00 (to who hasn't said yes) and once more a day
 * later for who chose nothing, the feedback mail
 * from 20:00 (Amsterdam) that day, on Tuesday from 08:00 the reminder for who
 * didn't answer, and on Wednesday from 19:00 "Ze vonden je gezellig" for who
 * a tablemate picked. Each to every guest who hasn't had it,
 * and only within a day of its time, so nothing old goes out. A mail planned
 * by hand wins. Above SAFE_DAY_TOTAL mails on a day the rest waits, and
 * admin shows it under Te doen.
 */

export type AutoMailKind = "confirm" | "confirmAgain" | "feedback" | "reminder" | "liked";
export const AUTO_MAIL_KINDS: AutoMailKind[] = ["confirm", "confirmAgain", "feedback", "reminder", "liked"];

const SAFE_DAY_TOTAL = 90;
const SEND_INTERVAL_MS = 600;
const DAY_MS = 86_400_000;

/** Sundays whose mail of this kind is due now: past its time, less than a day ago, and not switched off for that Sunday. */
export async function dueAutoMailEvents(kind: AutoMailKind, now = new Date()): Promise<string[]> {
  const rows = await getDb().execute<{ id: string; starts_at: Date }>(sql`
    select id, starts_at from events
    where workflow_status = 'published'
      and experience_type in (${SUNDAY_SOCIAL_TYPE}, ${JOUW_TAFEL_TYPE})
      -- A Sunday can switch a kind off by hand: events.extras.autoMailsOff, e.g. ["reminder"].
      and not (coalesce(extras -> 'autoMailsOff', '[]'::jsonb) @> ${JSON.stringify([kind])}::jsonb)
      and starts_at between ${new Date(now.getTime() - 5 * DAY_MS).toISOString()}::timestamptz and ${new Date(now.getTime() + 10 * DAY_MS).toISOString()}::timestamptz`);
  return rows
    .filter((r) => {
      const at = defaultScheduleAt(new Date(r.starts_at), kind).getTime();
      return now.getTime() >= at && now.getTime() < at + DAY_MS;
    })
    .map((r) => r.id);
}

/** Guests of this kind still waiting for it. */
export const sentAuto = (
  kind: AutoMailKind,
  g: { sentConfirm: boolean; sentConfirmAgain: boolean; sentFeedback: boolean; sentReminder: boolean; sentLiked: boolean },
) =>
  kind === "confirm" ? g.sentConfirm : kind === "confirmAgain" ? g.sentConfirmAgain : kind === "feedback" ? g.sentFeedback : kind === "reminder" ? g.sentReminder : g.sentLiked;

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

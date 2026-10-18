import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { emailLog } from "@/db/schema";
import type { ResendWebhookEvent } from "@/lib/outreach/resend-events";

/** Ranked so a late "delivered" cannot undo an "opened". */
export const EMAIL_EVENT_RANK: Record<string, number> = {
  sent: 0,
  delivered: 1,
  opened: 2,
  clicked: 3,
  suppressed: 4,
  bounced: 5,
  complained: 6,
};

const EVENT_NAMES: Record<string, string> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

/**
 * Records one Resend event on the logged email it belongs to. Returns false
 * when no logged email has that Resend id. A retried delivery carries the same
 * created_at, so opens and clicks are only counted once.
 */
export async function applyResendEmailLogEvent(event: ResendWebhookEvent): Promise<boolean> {
  const resendId = event.data?.email_id;
  const name = EVENT_NAMES[event.type];
  if (!resendId || !name) return false;

  const when = event.created_at ? new Date(event.created_at) : new Date();
  const at = sql`${(Number.isNaN(when.getTime()) ? new Date() : when).toISOString()}::timestamptz`;
  const rank = EMAIL_EVENT_RANK[name]!;
  const rankSql = sql.raw(
    `case ${emailLog.lastEvent.name} ${Object.entries(EMAIL_EVENT_RANK)
      .map(([key, value]) => `when '${key}' then ${value}`)
      .join(" ")} else -1 end`,
  );
  const lastEvent = sql`case when ${rankSql} < ${rank} then ${name} else ${emailLog.lastEvent} end`;

  const set: Record<string, unknown> = { lastEvent };
  switch (name) {
    case "delivered":
      set.deliveredAt = sql`coalesce(${emailLog.deliveredAt}, ${at})`;
      break;
    case "opened":
      set.firstOpenedAt = sql`coalesce(${emailLog.firstOpenedAt}, ${at})`;
      set.openCount = sql`case when ${emailLog.lastOpenedAt} is null or ${emailLog.lastOpenedAt} < ${at} then ${emailLog.openCount} + 1 else ${emailLog.openCount} end`;
      set.lastOpenedAt = sql`greatest(${emailLog.lastOpenedAt}, ${at})`;
      break;
    case "clicked":
      set.firstClickedAt = sql`coalesce(${emailLog.firstClickedAt}, ${at})`;
      set.clickCount = sql`case when ${emailLog.lastClickedAt} is null or ${emailLog.lastClickedAt} < ${at} then ${emailLog.clickCount} + 1 else ${emailLog.clickCount} end`;
      set.lastClickedAt = sql`greatest(${emailLog.lastClickedAt}, ${at})`;
      break;
    case "bounced":
      set.bouncedAt = sql`coalesce(${emailLog.bouncedAt}, ${at})`;
      break;
    case "complained":
      set.complainedAt = sql`coalesce(${emailLog.complainedAt}, ${at})`;
      break;
  }

  const updated = await getDb()
    .update(emailLog)
    .set(set)
    .where(eq(emailLog.resendId, resendId))
    .returning({ id: emailLog.id });
  return updated.length > 0;
}

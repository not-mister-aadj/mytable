import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { outreachMessages, outreachProspects } from "@/db/schema";
import type { OutreachMessageLogRow } from "@/lib/outreach/message-status";

export type { OutreachMessageLogRow } from "@/lib/outreach/message-status";

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Every mail we sent, newest first. Capped because this is a reading log, not
 * an export — the whole campaign is a few hundred mails per city anyway.
 */
export async function getOutreachMessageLog(
  limit = 1000,
): Promise<OutreachMessageLogRow[]> {
  const rows = await getDb()
    .select({
      id: outreachMessages.id,
      prospectId: outreachMessages.prospectId,
      prospectName: outreachProspects.name,
      city: outreachProspects.city,
      toEmail: outreachMessages.toEmail,
      templateKey: outreachMessages.templateKey,
      step: outreachMessages.step,
      subject: outreachMessages.subject,
      bodySnapshot: outreachMessages.bodySnapshot,
      attachmentName: outreachMessages.attachmentName,
      status: outreachMessages.status,
      error: outreachMessages.error,
      sentAt: outreachMessages.sentAt,
      deliveredAt: outreachMessages.deliveredAt,
      firstOpenedAt: outreachMessages.firstOpenedAt,
      lastOpenedAt: outreachMessages.lastOpenedAt,
      openCount: outreachMessages.openCount,
      firstClickedAt: outreachMessages.firstClickedAt,
      clickCount: outreachMessages.clickCount,
      bouncedAt: outreachMessages.bouncedAt,
      complainedAt: outreachMessages.complainedAt,
    })
    .from(outreachMessages)
    .innerJoin(
      outreachProspects,
      eq(outreachProspects.id, outreachMessages.prospectId),
    )
    .orderBy(desc(outreachMessages.sentAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    prospectId: row.prospectId,
    prospectName: row.prospectName,
    city: row.city,
    toEmail: row.toEmail,
    templateKey: row.templateKey,
    step: row.step,
    subject: row.subject,
    bodySnapshot: row.bodySnapshot,
    attachmentName: row.attachmentName,
    error: row.error,
    sentAt: row.sentAt.toISOString(),
    deliveredAt: iso(row.deliveredAt),
    firstOpenedAt: iso(row.firstOpenedAt),
    lastOpenedAt: iso(row.lastOpenedAt),
    openCount: row.openCount,
    firstClickedAt: iso(row.firstClickedAt),
    clickCount: row.clickCount,
    bouncedAt: iso(row.bouncedAt),
    complainedAt: iso(row.complainedAt),
    failed: row.status === "failed",
  }));
}

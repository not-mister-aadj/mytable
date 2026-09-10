import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import { outreachEvents, outreachMessages, outreachProspects } from "@/db/schema";

/** Resend signs webhooks with Svix: HMAC-SHA256 over `id.timestamp.payload`. */
export function verifyResendSignature(input: {
  payload: string;
  id: string | null;
  timestamp: string | null;
  signature: string | null;
  secret: string;
}): boolean {
  const { payload, id, timestamp, signature, secret } = input;
  if (!id || !timestamp || !signature) return false;

  // Reject replays of old deliveries (Svix tolerance is 5 minutes).
  const sentAt = Number(timestamp) * 1000;
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > 5 * 60 * 1000) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  const expectedBuffer = Buffer.from(expected);

  // The header carries a space-separated list of `v1,<signature>` entries.
  return signature.split(" ").some((entry) => {
    const value = entry.split(",")[1];
    if (!value) return false;
    const candidate = Buffer.from(value);
    return (
      candidate.length === expectedBuffer.length &&
      timingSafeEqual(candidate, expectedBuffer)
    );
  });
}

export type ResendWebhookEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    click?: { timestamp?: string; link?: string };
    [key: string]: unknown;
  };
};

/** Delivery states ranked so a late "delivered" cannot undo an "opened". */
const STATUS_RANK: Record<string, number> = {
  sent: 0,
  delivered: 1,
  opened: 2,
  clicked: 3,
  bounced: 4,
  complained: 5,
  failed: 6,
};

function statusFor(type: string): string | null {
  switch (type) {
    case "email.delivered":
      return "delivered";
    case "email.opened":
      return "opened";
    case "email.clicked":
      return "clicked";
    case "email.bounced":
      return "bounced";
    case "email.complained":
      return "complained";
    default:
      return null;
  }
}

/**
 * Record one Resend event against the message it belongs to. Returns false when
 * the event is for a mail we did not send from the outreach funnel (the same
 * webhook can carry booking mail if you point it at one endpoint).
 */
export async function applyResendOutreachEvent(
  event: ResendWebhookEvent,
): Promise<boolean> {
  const resendMessageId = event.data?.email_id;
  if (!resendMessageId) return false;

  const db = getDb();
  const [message] = await db
    .select({
      id: outreachMessages.id,
      prospectId: outreachMessages.prospectId,
      status: outreachMessages.status,
    })
    .from(outreachMessages)
    .where(eq(outreachMessages.resendMessageId, resendMessageId))
    .limit(1);

  if (!message) return false;

  const occurredAt = event.created_at ? new Date(event.created_at) : new Date();

  // Resend retries on any non-2xx; the unique index makes that a no-op.
  const inserted = await db
    .insert(outreachEvents)
    .values({
      messageId: message.id,
      resendMessageId,
      type: event.type,
      occurredAt,
      payload: (event.data ?? {}) as Record<string, unknown>,
    })
    .onConflictDoNothing()
    .returning({ id: outreachEvents.id });

  if (inserted.length === 0) return true;

  const nextStatus = statusFor(event.type);
  const status =
    nextStatus &&
    (STATUS_RANK[nextStatus] ?? 0) > (STATUS_RANK[message.status] ?? 0)
      ? nextStatus
      : undefined;

  switch (event.type) {
    case "email.delivered":
      await db
        .update(outreachMessages)
        .set({ status, deliveredAt: occurredAt })
        .where(eq(outreachMessages.id, message.id));
      break;
    case "email.opened":
      await db
        .update(outreachMessages)
        .set({
          status,
          firstOpenedAt: sql`coalesce(${outreachMessages.firstOpenedAt}, ${occurredAt})`,
          lastOpenedAt: occurredAt,
          openCount: sql`${outreachMessages.openCount} + 1`,
        })
        .where(eq(outreachMessages.id, message.id));
      break;
    case "email.clicked":
      await db
        .update(outreachMessages)
        .set({
          status,
          firstClickedAt: sql`coalesce(${outreachMessages.firstClickedAt}, ${occurredAt})`,
          clickCount: sql`${outreachMessages.clickCount} + 1`,
        })
        .where(eq(outreachMessages.id, message.id));
      break;
    case "email.bounced":
    case "email.complained": {
      const isBounce = event.type === "email.bounced";
      await db
        .update(outreachMessages)
        .set({
          status,
          bouncedAt: isBounce ? occurredAt : undefined,
          complainedAt: isBounce ? undefined : occurredAt,
        })
        .where(eq(outreachMessages.id, message.id));
      // A hard bounce or a spam complaint ends the sequence for this venue.
      await db
        .update(outreachProspects)
        .set({
          status: isBounce ? "bounced" : "unsubscribed",
          nextFollowUpAt: null,
          lastActivityAt: occurredAt,
          updatedAt: new Date(),
        })
        .where(eq(outreachProspects.id, message.prospectId));
      break;
    }
    default:
      break;
  }

  return true;
}

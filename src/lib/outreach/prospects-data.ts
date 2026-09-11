import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  outreachActivities,
  outreachMessages,
  outreachProspects,
  type OutreachProspect,
} from "@/db/schema";
import {
  OUTREACH_STOPPED_STATUSES,
  isOutreachStatus,
  type OutreachSentiment,
  type OutreachStatus,
} from "@/lib/outreach/constants";

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

export type OutreachProspectRow = {
  id: string;
  name: string;
  city: string;
  category: string | null;
  address: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  mapsUrl: string | null;
  rating: string | null;
  reviewsCount: number | null;
  contactName: string | null;
  status: OutreachStatus;
  sequenceStep: number;
  notes: string | null;
  nextFollowUpAt: string | null;
  lastContactedAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  /** Aggregates over everything we sent to this prospect. */
  messageCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  replyCount: number;
  lastSentAt: string | null;
  lastOpenedAt: string | null;
  /** One entry per sequence mail that went out, oldest step first. */
  steps: OutreachStepState[];
};

/** What happened to one mail of the sequence — drives the dots in the list. */
export type OutreachStepState = {
  step: number;
  sentAt: string;
  deliveredAt: string | null;
  openedAt: string | null;
  openCount: number;
  clickCount: number;
  bouncedAt: string | null;
  failed: boolean;
};

export type OutreachMessageRow = {
  id: string;
  templateKey: string | null;
  step: number | null;
  toEmail: string;
  subject: string;
  bodySnapshot: string;
  attachmentName: string | null;
  status: string;
  error: string | null;
  sentAt: string;
  deliveredAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  firstClickedAt: string | null;
  clickCount: number;
  bouncedAt: string | null;
  repliedAt: string | null;
};

export type OutreachActivityRow = {
  id: string;
  type: string;
  body: string | null;
  sentiment: string | null;
  occurredAt: string;
  createdBy: string | null;
};

export type OutreachProspectDetail = OutreachProspectRow & {
  messages: OutreachMessageRow[];
  activities: OutreachActivityRow[];
};

function toStatus(value: string): OutreachStatus {
  return isOutreachStatus(value) ? value : "new";
}

type ProspectAggregateRow = {
  prospect: OutreachProspect;
  messageCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  replyCount: number;
  lastSentAt: Date | string | null;
  lastOpenedAt: Date | string | null;
};

function mapProspectRow(
  row: ProspectAggregateRow,
  steps: OutreachStepState[] = [],
): OutreachProspectRow {
  const p = row.prospect;
  return {
    id: p.id,
    name: p.name,
    city: p.city,
    category: p.category,
    address: p.address,
    website: p.website,
    email: p.email,
    phone: p.phone,
    mapsUrl: p.mapsUrl,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    contactName: p.contactName,
    status: toStatus(p.status),
    sequenceStep: p.sequenceStep,
    notes: p.notes,
    nextFollowUpAt: iso(p.nextFollowUpAt),
    lastContactedAt: iso(p.lastContactedAt),
    lastActivityAt: iso(p.lastActivityAt),
    createdAt: iso(p.createdAt)!,
    messageCount: Number(row.messageCount ?? 0),
    deliveredCount: Number(row.deliveredCount ?? 0),
    openedCount: Number(row.openedCount ?? 0),
    clickedCount: Number(row.clickedCount ?? 0),
    bouncedCount: Number(row.bouncedCount ?? 0),
    replyCount: Number(row.replyCount ?? 0),
    lastSentAt: iso(row.lastSentAt),
    lastOpenedAt: iso(row.lastOpenedAt),
    steps,
  };
}

/** Grouping by the primary key lets Postgres return every prospect column. */
const prospectAggregateSelection = {
  prospect: outreachProspects,
  messageCount: sql<number>`count(${outreachMessages.id})::int`,
  deliveredCount: sql<number>`count(${outreachMessages.deliveredAt})::int`,
  openedCount: sql<number>`count(${outreachMessages.firstOpenedAt})::int`,
  clickedCount: sql<number>`count(${outreachMessages.firstClickedAt})::int`,
  bouncedCount: sql<number>`count(${outreachMessages.bouncedAt})::int`,
  replyCount: sql<number>`(select count(*)::int from ${outreachActivities} where ${outreachActivities.prospectId} = ${outreachProspects.id} and ${outreachActivities.type} = 'reply')`,
  lastSentAt: sql<Date | null>`max(${outreachMessages.sentAt})`,
  lastOpenedAt: sql<Date | null>`max(${outreachMessages.lastOpenedAt})`,
};

function toStepState(message: {
  step: number | null;
  status: string;
  sentAt: Date;
  deliveredAt: Date | null;
  firstOpenedAt: Date | null;
  openCount: number;
  clickCount: number;
  bouncedAt: Date | null;
}): OutreachStepState {
  return {
    step: message.step ?? 0,
    sentAt: iso(message.sentAt)!,
    deliveredAt: iso(message.deliveredAt),
    openedAt: iso(message.firstOpenedAt),
    openCount: message.openCount,
    clickCount: message.clickCount,
    bouncedAt: iso(message.bouncedAt),
    failed: message.status === "failed",
  };
}

/**
 * Per-mail state for every prospect at once. One extra query beats a lateral
 * join here: the list is a few hundred rows and the messages are far fewer.
 */
async function getStepStatesByProspect(): Promise<Map<string, OutreachStepState[]>> {
  const messages = await getDb()
    .select({
      prospectId: outreachMessages.prospectId,
      step: outreachMessages.step,
      status: outreachMessages.status,
      sentAt: outreachMessages.sentAt,
      deliveredAt: outreachMessages.deliveredAt,
      firstOpenedAt: outreachMessages.firstOpenedAt,
      openCount: outreachMessages.openCount,
      clickCount: outreachMessages.clickCount,
      bouncedAt: outreachMessages.bouncedAt,
    })
    .from(outreachMessages)
    .orderBy(asc(outreachMessages.sentAt));

  const byProspect = new Map<string, OutreachStepState[]>();
  for (const message of messages) {
    // Hand-written mails are not a step of the sequence and get no dot.
    if (message.step === null) continue;
    const list = byProspect.get(message.prospectId) ?? [];
    list.push(toStepState(message));
    byProspect.set(message.prospectId, list);
  }
  return byProspect;
}

export async function getOutreachProspects(): Promise<OutreachProspectRow[]> {
  const [rows, stepsByProspect] = await Promise.all([
    getDb()
      .select(prospectAggregateSelection)
      .from(outreachProspects)
      .leftJoin(
        outreachMessages,
        eq(outreachMessages.prospectId, outreachProspects.id),
      )
      .groupBy(outreachProspects.id)
      .orderBy(asc(outreachProspects.name)),
    getStepStatesByProspect(),
  ]);

  return rows.map((row) =>
    mapProspectRow(row, stepsByProspect.get(row.prospect.id) ?? []),
  );
}

export async function getOutreachProspect(
  id: string,
): Promise<OutreachProspectDetail | null> {
  const db = getDb();
  const [row] = await db
    .select(prospectAggregateSelection)
    .from(outreachProspects)
    .leftJoin(
      outreachMessages,
      eq(outreachMessages.prospectId, outreachProspects.id),
    )
    .where(eq(outreachProspects.id, id))
    .groupBy(outreachProspects.id)
    .limit(1);

  if (!row) return null;

  const [messages, activities] = await Promise.all([
    db
      .select()
      .from(outreachMessages)
      .where(eq(outreachMessages.prospectId, id))
      .orderBy(sql`${outreachMessages.sentAt} desc`),
    db
      .select()
      .from(outreachActivities)
      .where(eq(outreachActivities.prospectId, id))
      .orderBy(sql`${outreachActivities.occurredAt} desc`),
  ]);

  return {
    ...mapProspectRow(
      row,
      [...messages]
        .reverse()
        .filter((message) => message.step !== null)
        .map(toStepState),
    ),
    messages: messages.map((m) => ({
      id: m.id,
      templateKey: m.templateKey,
      step: m.step,
      toEmail: m.toEmail,
      subject: m.subject,
      bodySnapshot: m.bodySnapshot,
      attachmentName: m.attachmentName,
      status: m.status,
      error: m.error,
      sentAt: iso(m.sentAt)!,
      deliveredAt: iso(m.deliveredAt),
      firstOpenedAt: iso(m.firstOpenedAt),
      lastOpenedAt: iso(m.lastOpenedAt),
      openCount: m.openCount,
      firstClickedAt: iso(m.firstClickedAt),
      clickCount: m.clickCount,
      bouncedAt: iso(m.bouncedAt),
      repliedAt: iso(m.repliedAt),
    })),
    activities: activities.map((a) => ({
      id: a.id,
      type: a.type,
      body: a.body,
      sentiment: a.sentiment,
      occurredAt: iso(a.occurredAt)!,
      createdBy: a.createdBy,
    })),
  };
}

/** The columns a send needs — kept small so a bulk send stays one query. */
export async function getOutreachSendTargets(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select({
      id: outreachProspects.id,
      name: outreachProspects.name,
      city: outreachProspects.city,
      category: outreachProspects.category,
      contactName: outreachProspects.contactName,
      website: outreachProspects.website,
      email: outreachProspects.email,
      status: outreachProspects.status,
      sequenceStep: outreachProspects.sequenceStep,
    })
    .from(outreachProspects)
    .where(inArray(outreachProspects.id, ids))
    .orderBy(asc(outreachProspects.name));

  return rows.map((row) => ({ ...row, status: toStatus(row.status) }));
}

export type ImportProspectInput = {
  name: string;
  city: string;
  category?: string | null;
  address?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  mapsUrl?: string | null;
  rating?: string | null;
  reviewsCount?: number | null;
  priceLevel?: string | null;
  source?: string;
};

/**
 * Upsert on (city, name). Re-running an import refreshes contact details but
 * never touches status, sequence progress or notes — that is your work, not
 * the scraper's.
 */
export async function importOutreachProspects(
  rows: ImportProspectInput[],
): Promise<{ imported: number; skipped: number }> {
  const valid = rows.filter((row) => row.name.trim() && row.city.trim());
  if (valid.length === 0) return { imported: 0, skipped: rows.length };

  const result = await getDb()
    .insert(outreachProspects)
    .values(
      valid.map((row) => ({
        name: row.name.trim(),
        city: row.city.trim(),
        category: row.category?.trim() || null,
        address: row.address?.trim() || null,
        website: row.website?.trim() || null,
        email: row.email?.trim().toLowerCase() || null,
        phone: row.phone?.trim() || null,
        mapsUrl: row.mapsUrl?.trim() || null,
        rating: row.rating?.trim() || null,
        reviewsCount: row.reviewsCount ?? null,
        priceLevel: row.priceLevel?.trim() || null,
        source: row.source?.trim() || "import",
      })),
    )
    .onConflictDoUpdate({
      target: [outreachProspects.city, outreachProspects.name],
      set: {
        category: sql`coalesce(excluded.category, ${outreachProspects.category})`,
        address: sql`coalesce(excluded.address, ${outreachProspects.address})`,
        website: sql`coalesce(excluded.website, ${outreachProspects.website})`,
        email: sql`coalesce(excluded.email, ${outreachProspects.email})`,
        phone: sql`coalesce(excluded.phone, ${outreachProspects.phone})`,
        mapsUrl: sql`coalesce(excluded.maps_url, ${outreachProspects.mapsUrl})`,
        rating: sql`coalesce(excluded.rating, ${outreachProspects.rating})`,
        reviewsCount: sql`coalesce(excluded.reviews_count, ${outreachProspects.reviewsCount})`,
        updatedAt: new Date(),
      },
    })
    .returning({ id: outreachProspects.id });

  return { imported: result.length, skipped: rows.length - valid.length };
}

export async function updateOutreachProspectDetails(
  id: string,
  patch: {
    /** Editable: the scraped Google Maps name reads badly inside a sentence. */
    name?: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    notes?: string | null;
  },
): Promise<void> {
  await getDb()
    .update(outreachProspects)
    .set({
      ...patch,
      email:
        patch.email === undefined ? undefined : patch.email?.toLowerCase() || null,
      updatedAt: new Date(),
    })
    .where(eq(outreachProspects.id, id));
}

/** A stopped status also cancels the pending follow-up. */
export async function setOutreachStatus(
  id: string,
  status: OutreachStatus,
): Promise<void> {
  const stops = OUTREACH_STOPPED_STATUSES.includes(status);
  await getDb()
    .update(outreachProspects)
    .set({
      status,
      nextFollowUpAt: stops ? null : undefined,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(outreachProspects.id, id));
}

export async function addOutreachActivity(input: {
  prospectId: string;
  type: string;
  body?: string | null;
  sentiment?: OutreachSentiment | null;
  occurredAt?: Date;
  createdBy?: string | null;
  messageId?: string | null;
}): Promise<void> {
  const db = getDb();
  const occurredAt = input.occurredAt ?? new Date();

  await db.insert(outreachActivities).values({
    prospectId: input.prospectId,
    messageId: input.messageId ?? null,
    type: input.type,
    body: input.body?.trim() || null,
    sentiment: input.sentiment ?? null,
    occurredAt,
    createdBy: input.createdBy ?? null,
  });

  await db
    .update(outreachProspects)
    .set({ lastActivityAt: occurredAt, updatedAt: new Date() })
    .where(eq(outreachProspects.id, input.prospectId));

  // A reply ends the sequence: nothing kills a warm lead faster than a
  // "just checking in" landing after someone already answered.
  if (input.type === "reply") {
    await db
      .update(outreachProspects)
      .set({ status: "replied", nextFollowUpAt: null, updatedAt: new Date() })
      .where(
        and(
          eq(outreachProspects.id, input.prospectId),
          inArray(outreachProspects.status, ["new", "contacted"]),
        ),
      );
  }
}

export async function deleteOutreachProspect(id: string): Promise<void> {
  await getDb().delete(outreachProspects).where(eq(outreachProspects.id, id));
}

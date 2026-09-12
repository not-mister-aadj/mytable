import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { outreachTemplates, type OutreachTemplate } from "@/db/schema";

export type OutreachTemplateRow = {
  id: string;
  key: string;
  name: string;
  kind: string;
  step: number | null;
  delayDays: number;
  subject: string;
  body: string;
  attachmentPath: string | null;
  attachmentName: string | null;
  isActive: boolean;
  updatedAt: string;
};

function mapTemplate(row: OutreachTemplate): OutreachTemplateRow {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    kind: row.kind,
    step: row.step,
    delayDays: row.delayDays,
    subject: row.subject,
    body: row.body,
    attachmentPath: row.attachmentPath,
    attachmentName: row.attachmentName,
    isActive: row.isActive,
    // Never null per the schema; guarded so one bad row cannot take the page down.
    updatedAt: (row.updatedAt ?? new Date(0)).toISOString(),
  };
}

export async function getOutreachTemplates(): Promise<OutreachTemplateRow[]> {
  const rows = await getDb()
    .select()
    .from(outreachTemplates)
    .orderBy(asc(outreachTemplates.kind), asc(outreachTemplates.step));
  return rows.map(mapTemplate);
}

export async function getOutreachTemplate(
  id: string,
): Promise<OutreachTemplateRow | null> {
  const [row] = await getDb()
    .select()
    .from(outreachTemplates)
    .where(eq(outreachTemplates.id, id))
    .limit(1);
  return row ? mapTemplate(row) : null;
}

export type SaveOutreachTemplateInput = {
  id?: string;
  key: string;
  name: string;
  kind: string;
  step: number | null;
  delayDays: number;
  subject: string;
  body: string;
  attachmentPath: string | null;
  attachmentName: string | null;
  isActive: boolean;
};

export async function saveOutreachTemplate(
  input: SaveOutreachTemplateInput,
): Promise<string> {
  const db = getDb();
  const values = {
    key: input.key.trim(),
    name: input.name.trim(),
    kind: input.kind,
    step: input.kind === "sequence" ? input.step : null,
    delayDays: input.delayDays,
    subject: input.subject.trim(),
    body: input.body,
    attachmentPath: input.attachmentPath,
    attachmentName: input.attachmentName,
    isActive: input.isActive,
    updatedAt: new Date(),
  };

  if (input.id) {
    await db
      .update(outreachTemplates)
      .set(values)
      .where(eq(outreachTemplates.id, input.id));
    return input.id;
  }

  const [created] = await db
    .insert(outreachTemplates)
    .values(values)
    .returning({ id: outreachTemplates.id });
  return created.id;
}

export async function deleteOutreachTemplate(id: string): Promise<void> {
  await getDb().delete(outreachTemplates).where(eq(outreachTemplates.id, id));
}

/**
 * The live outreach copy. It reads as a reservation request, not as a pitch:
 * the greeting already says who the mail is for, the two Sundays are named so
 * a yes or no costs one line, and the only explanation given is the one a
 * venue actually worries about (no work, no bill, no risk).
 * Follow-ups keep "Re:" on the original subject so they read as one thread.
 */
export const DEFAULT_OUTREACH_TEMPLATES: SaveOutreachTemplateInput[] = [
  {
    key: "venue-step-1",
    name: "1. Eerste mail",
    kind: "sequence",
    step: 1,
    delayDays: 0,
    subject: "tafel reserveren zondag 18 of 25 oktober",
    body: `Hi {{naam}},

Ik wil voor MyTable een tafel reserveren op zondagmiddag 18 of 25 oktober, voor 14 tot 20 mensen.

Wij stellen het gezelschap samen; ze bestellen bij jullie zelf hun drankjes en bites. Jullie hoeven alleen de tafels vrij te houden.

Lukt een van die twee zondagen?

Cheers,
Team MyTable
mytable.club`,
    attachmentPath: null,
    attachmentName: null,
    isActive: true,
  },
  {
    key: "venue-step-2",
    name: "2. Opvolging",
    kind: "sequence",
    step: 2,
    delayDays: 4,
    subject: "Re: tafel reserveren zondag 18 of 25 oktober",
    body: `Hi {{naam}},

Ik wilde even checken of een tafel voor 14 tot 20 personen op zondag 18 of 25 oktober mogelijk is.

Of kan ik dit beter met iemand anders binnen jullie team bespreken?

Cheers,
Team MyTable
mytable.club`,
    attachmentPath: null,
    attachmentName: null,
    isActive: true,
  },
  {
    key: "venue-step-3",
    name: "3. Laatste mail",
    kind: "sequence",
    step: 3,
    delayDays: 7,
    subject: "Re: tafel reserveren zondag 18 of 25 oktober",
    body: `Hi {{naam}},

Ik stuur hierover nog een laatste berichtje. Is een groep van 14 tot 20 mensen op zondagmiddag 18 of 25 oktober iets waar jullie voor openstaan?

Als het niet past, is dat natuurlijk ook helemaal goed.

Cheers,
Team MyTable
mytable.club`,
    attachmentPath: null,
    attachmentName: null,
    isActive: true,
  },
];

/** Inserts the starter templates once; never overwrites edited copy. */
export async function ensureDefaultOutreachTemplates(): Promise<void> {
  const db = getDb();
  const existing = await db
    .select({ key: outreachTemplates.key })
    .from(outreachTemplates);
  const known = new Set(existing.map((row) => row.key));
  const missing = DEFAULT_OUTREACH_TEMPLATES.filter((row) => !known.has(row.key));
  if (missing.length === 0) return;

  // ON CONFLICT: two requests can both see a key as missing — a first page
  // load racing a second, or a read that came back incomplete while the
  // database was timing out. Either way the row exists; a duplicate is not an
  // error worth failing the whole dashboard over.
  await db
    .insert(outreachTemplates)
    .values(
      missing.map((row) => ({
        key: row.key,
        name: row.name,
        kind: row.kind,
        step: row.step,
        delayDays: row.delayDays,
        subject: row.subject,
        body: row.body,
        isActive: row.isActive,
      })),
    )
    .onConflictDoNothing();
}

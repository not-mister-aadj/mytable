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
 * The live outreach copy: the founder's own text, with only the venue name and
 * city as placeholders so the same mails work in a second city. Follow-ups keep
 * "Re:" on the original subject so they read as one thread.
 *
 * There is deliberately no reply template. Answers to a venue that wrote back
 * are written by hand from the founder's own inbox — a templated reply to a
 * real reply reads as exactly what it is.
 */
export const DEFAULT_OUTREACH_TEMPLATES: SaveOutreachTemplateInput[] = [
  {
    key: "venue-step-1",
    name: "1. Eerste mail",
    kind: "sequence",
    step: 1,
    delayDays: 0,
    subject: "tafel reserveren op zondagmiddag",
    body: `Hi,

Ik ben voor MyTable op zoek naar een locatie in {{stad}} waar we op zondagmiddag met ongeveer 10–20 personen kunnen zitten, verdeeld over een paar tafels.

De aanmeldingen lopen via ons. Op locatie bestelt iedereen zelf drankjes en bites bij jullie.

Zou dit bij {{naam}} kunnen?

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
    subject: "Re: tafel reserveren op zondagmiddag",
    body: `Hi,

Ik wilde even checken of een reservering voor 10–20 personen op zondagmiddag bij {{naam}} mogelijk is.

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
    subject: "Re: tafel reserveren op zondagmiddag",
    body: `Hi,

Ik stuur hierover nog één laatste berichtje. Is een groep van 10–20 personen op zondagmiddag iets waar jullie voor openstaan?

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

import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { outreachTemplates, type OutreachTemplate } from "@/db/schema";
import {
  toOutreachTemplateKind,
  type OutreachTemplateKind,
} from "@/lib/outreach/constants";

export type OutreachTemplateRow = {
  id: string;
  key: string;
  name: string;
  kind: OutreachTemplateKind;
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
    kind: toOutreachTemplateKind(row.kind),
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
    .orderBy(asc(outreachTemplates.kind), asc(outreachTemplates.name));
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
    kind: toOutreachTemplateKind(input.kind),
    step: null,
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

"use server";

import { revalidatePath } from "next/cache";
import { isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-url";
import {
  isOutreachStatus,
  type OutreachSentiment,
} from "@/lib/outreach/constants";
import { parseProspectsCsv } from "@/lib/outreach/parse-prospects-csv";
import {
  addOutreachActivity,
  deleteOutreachProspect,
  getOutreachSendTargets,
  importOutreachProspects,
  setOutreachStatus,
  updateOutreachProspectDetails,
} from "@/lib/outreach/prospects-data";
import {
  manualMailSource,
  nextSequenceTemplate,
  renderOutreachMail,
  sendOutreachBatch,
  sendOutreachMail,
  type OutreachMailSource,
} from "@/lib/outreach/send";
import {
  deleteOutreachTemplate,
  getOutreachTemplates,
  saveOutreachTemplate,
  type OutreachTemplateRow,
} from "@/lib/outreach/templates-data";

type ActionResult = { error: string | null };

function revalidateOutreach(prospectId?: string) {
  revalidatePath(adminPath("/outreach"));
  if (prospectId) revalidatePath(adminPath(`/outreach/${prospectId}`));
}

async function guard(): Promise<{ email: string } | { error: string }> {
  const { user } = await requireAdmin();
  if (!isDbConfigured()) return { error: "Database niet geconfigureerd." };
  return { email: user.email ?? "" };
}

export async function importProspectsCsvAction(
  csv: string,
  city: string,
): Promise<{ error: string | null; imported: number; skipped: number }> {
  const context = await guard();
  if ("error" in context) {
    return { error: context.error, imported: 0, skipped: 0 };
  }

  const parsed = parseProspectsCsv(csv, city.trim() || "Rotterdam");
  if (parsed.error) return { error: parsed.error, imported: 0, skipped: 0 };

  try {
    const result = await importOutreachProspects(parsed.rows);
    revalidateOutreach();
    return {
      error: null,
      imported: result.imported,
      skipped: result.skipped + parsed.skipped,
    };
  } catch (error) {
    console.error("[outreach] import failed", error);
    return { error: "Importeren mislukt.", imported: 0, skipped: 0 };
  }
}

/**
 * Send the next due sequence step to each selected prospect. Prospects without
 * an address, or who already had the whole sequence, are reported back instead
 * of silently skipped.
 */
export async function sendSequenceAction(prospectIds: string[]): Promise<{
  error: string | null;
  sent: number;
  failures: { name: string; reason: string }[];
}> {
  const context = await guard();
  if ("error" in context) {
    return { error: context.error, sent: 0, failures: [] };
  }

  try {
    const [targets, templates] = await Promise.all([
      getOutreachSendTargets(prospectIds),
      getOutreachTemplates(),
    ]);

    const failures: { name: string; reason: string }[] = [];
    const queue = [];

    for (const prospect of targets) {
      if (!prospect.email) {
        failures.push({ name: prospect.name, reason: "geen e-mailadres" });
        continue;
      }
      const blocked = blockedReason(prospect.status);
      if (blocked) {
        failures.push({ name: prospect.name, reason: blocked });
        continue;
      }
      const template = nextSequenceTemplate(templates, prospect.sequenceStep);
      if (!template) {
        failures.push({ name: prospect.name, reason: "sequence is klaar" });
        continue;
      }
      queue.push({
        prospect,
        template,
        nextTemplate: nextSequenceTemplate(templates, template.step ?? 0),
      });
    }

    const results = await sendOutreachBatch(queue);
    for (const [index, result] of results.entries()) {
      if (!result.ok) {
        failures.push({
          name: queue[index].prospect.name,
          reason: result.error,
        });
      }
    }

    revalidateOutreach();
    return {
      error: null,
      sent: results.filter((result) => result.ok).length,
      failures,
    };
  } catch (error) {
    console.error("[outreach] sequence send failed", error);
    return { error: "Versturen mislukt.", sent: 0, failures: [] };
  }
}

/** Send one specific template — used for the reply mail and one-offs. */
export async function sendTemplateAction(
  prospectId: string,
  templateId: string,
): Promise<ActionResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error };

  try {
    const [targets, templates] = await Promise.all([
      getOutreachSendTargets([prospectId]),
      getOutreachTemplates(),
    ]);
    const prospect = targets[0];
    const template = templates.find((row) => row.id === templateId);
    if (!prospect) return { error: "Zaak niet gevonden." };
    if (!template) return { error: "Template niet gevonden." };
    const blocked = blockedReason(prospect.status);
    if (blocked) return { error: `Niet verstuurd: ${blocked}.` };

    const result = await sendOutreachMail({
      prospect,
      template,
      nextTemplate: nextSequenceTemplate(templates, template.step ?? 0),
      sentBy: context.email,
    });

    revalidateOutreach(prospectId);
    return { error: result.ok ? null : result.error };
  } catch (error) {
    console.error("[outreach] template send failed", error);
    return { error: "Versturen mislukt." };
  }
}

/** Venues that must not get another mail, whatever the sender picked. */
function blockedReason(status: string): string | null {
  if (status === "unsubscribed") return "afgemeld";
  if (status === "bounced") return "bounce";
  return null;
}

type BulkSendResult = {
  error: string | null;
  sent: number;
  failures: { name: string; reason: string }[];
};

/** Shared tail of every bulk send: skip who cannot be mailed, send the rest. */
async function sendToTargets(
  targets: Awaited<ReturnType<typeof getOutreachSendTargets>>,
  source: OutreachMailSource,
  templates: OutreachTemplateRow[],
): Promise<BulkSendResult> {
  const failures: BulkSendResult["failures"] = [];
  const queue: Parameters<typeof sendOutreachBatch>[0] = [];

  for (const prospect of targets) {
    if (!prospect.email) {
      failures.push({ name: prospect.name, reason: "geen e-mailadres" });
      continue;
    }
    const blocked = blockedReason(prospect.status);
    if (blocked) {
      failures.push({ name: prospect.name, reason: blocked });
      continue;
    }
    queue.push({
      prospect,
      template: source,
      nextTemplate:
        source.kind === "sequence"
          ? nextSequenceTemplate(templates, source.step ?? 0)
          : null,
    });
  }

  const results = await sendOutreachBatch(queue);
  for (const [index, result] of results.entries()) {
    if (!result.ok) {
      failures.push({ name: queue[index].prospect.name, reason: result.error });
    }
  }
  return {
    error: null,
    sent: results.filter((result) => result.ok).length,
    failures,
  };
}

/**
 * Send one chosen template to every selected venue. Unlike sendSequenceAction
 * this does not pick the next step per venue — the sender chose this mail.
 */
export async function sendTemplateToManyAction(
  prospectIds: string[],
  templateId: string,
): Promise<BulkSendResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error, sent: 0, failures: [] };

  try {
    const [targets, templates] = await Promise.all([
      getOutreachSendTargets(prospectIds),
      getOutreachTemplates(),
    ]);
    const template = templates.find((row) => row.id === templateId);
    if (!template) {
      return { error: "Template niet gevonden.", sent: 0, failures: [] };
    }
    const result = await sendToTargets(targets, template, templates);
    revalidateOutreach();
    return result;
  } catch (error) {
    console.error("[outreach] template bulk send failed", error);
    return { error: "Versturen mislukt.", sent: 0, failures: [] };
  }
}

/**
 * Send a mail written by hand in the dashboard — to one venue from its page
 * or to a whole selection. Placeholders are filled per venue, it is logged
 * like any other mail, and it never moves anyone along the sequence.
 */
export async function sendCustomMailAction(input: {
  prospectIds: string[];
  subject: string;
  body: string;
}): Promise<BulkSendResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error, sent: 0, failures: [] };
  if (!input.subject.trim()) {
    return { error: "Onderwerp is leeg.", sent: 0, failures: [] };
  }
  if (!input.body.trim()) return { error: "Tekst is leeg.", sent: 0, failures: [] };

  try {
    const [targets, templates] = await Promise.all([
      getOutreachSendTargets(input.prospectIds),
      getOutreachTemplates(),
    ]);
    const result = await sendToTargets(
      targets,
      manualMailSource(input.subject.trim(), input.body),
      templates,
    );
    revalidateOutreach(
      input.prospectIds.length === 1 ? input.prospectIds[0] : undefined,
    );
    return result;
  } catch (error) {
    console.error("[outreach] custom mail send failed", error);
    return { error: "Versturen mislukt.", sent: 0, failures: [] };
  }
}

/** Rendered preview of a template for one prospect, before anything is sent. */
export async function previewTemplateAction(
  prospectId: string,
  templateId: string,
): Promise<{ error: string | null; subject: string; body: string }> {
  const context = await guard();
  if ("error" in context) {
    return { error: context.error, subject: "", body: "" };
  }

  const [targets, templates] = await Promise.all([
    getOutreachSendTargets([prospectId]),
    getOutreachTemplates(),
  ]);
  const prospect = targets[0];
  const template = templates.find((row) => row.id === templateId);
  if (!prospect || !template) {
    return { error: "Niet gevonden.", subject: "", body: "" };
  }

  const mail = await renderOutreachMail(template, prospect);
  return { error: null, subject: mail.subject, body: mail.body };
}

export async function logReplyAction(input: {
  prospectId: string;
  body: string;
  sentiment: OutreachSentiment;
  receivedAt?: string;
}): Promise<ActionResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error };
  if (!input.body.trim()) return { error: "Antwoord is leeg." };

  try {
    await addOutreachActivity({
      prospectId: input.prospectId,
      type: "reply",
      body: input.body,
      sentiment: input.sentiment,
      occurredAt: input.receivedAt ? new Date(input.receivedAt) : undefined,
      createdBy: context.email,
    });
    revalidateOutreach(input.prospectId);
    return { error: null };
  } catch (error) {
    console.error("[outreach] log reply failed", error);
    return { error: "Opslaan mislukt." };
  }
}

export async function addActivityAction(input: {
  prospectId: string;
  type: string;
  body: string;
}): Promise<ActionResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error };

  try {
    await addOutreachActivity({
      prospectId: input.prospectId,
      type: input.type,
      body: input.body,
      createdBy: context.email,
    });
    revalidateOutreach(input.prospectId);
    return { error: null };
  } catch (error) {
    console.error("[outreach] add activity failed", error);
    return { error: "Opslaan mislukt." };
  }
}

export async function setStatusAction(
  prospectId: string,
  status: string,
): Promise<ActionResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error };
  if (!isOutreachStatus(status)) return { error: "Onbekende status." };

  try {
    await setOutreachStatus(prospectId, status);
    revalidateOutreach(prospectId);
    return { error: null };
  } catch (error) {
    console.error("[outreach] set status failed", error);
    return { error: "Opslaan mislukt." };
  }
}

export async function updateProspectAction(
  prospectId: string,
  patch: {
    name?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    website?: string;
    notes?: string;
  },
): Promise<ActionResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error };
  if (patch.name !== undefined && !patch.name.trim()) {
    return { error: "Naam mag niet leeg zijn." };
  }

  try {
    await updateOutreachProspectDetails(prospectId, patch);
    revalidateOutreach(prospectId);
    return { error: null };
  } catch (error) {
    console.error("[outreach] update prospect failed", error);
    const duplicate =
      error instanceof Error &&
      error.message.includes("outreach_prospects_city_name_unique");
    return {
      error: duplicate
        ? "Er staat al een zaak met deze naam in deze stad."
        : "Opslaan mislukt.",
    };
  }
}

export async function deleteProspectAction(
  prospectId: string,
): Promise<ActionResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error };

  try {
    await deleteOutreachProspect(prospectId);
    revalidateOutreach();
    return { error: null };
  } catch (error) {
    console.error("[outreach] delete prospect failed", error);
    return { error: "Verwijderen mislukt." };
  }
}

export async function saveTemplateAction(input: {
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
}): Promise<ActionResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error };
  if (!input.key.trim()) return { error: "Sleutel is verplicht." };
  if (!input.subject.trim()) return { error: "Onderwerp is verplicht." };
  if (!input.body.trim()) return { error: "Tekst is verplicht." };

  try {
    await saveOutreachTemplate(input);
    revalidatePath(adminPath("/outreach/templates"));
    revalidateOutreach();
    return { error: null };
  } catch (error) {
    console.error("[outreach] save template failed", error);
    const duplicate =
      error instanceof Error && error.message.includes("outreach_templates_key");
    return {
      error: duplicate ? "Die sleutel bestaat al." : "Opslaan mislukt.",
    };
  }
}

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  const context = await guard();
  if ("error" in context) return { error: context.error };

  try {
    await deleteOutreachTemplate(id);
    revalidatePath(adminPath("/outreach/templates"));
    return { error: null };
  } catch (error) {
    console.error("[outreach] delete template failed", error);
    return { error: "Verwijderen mislukt." };
  }
}

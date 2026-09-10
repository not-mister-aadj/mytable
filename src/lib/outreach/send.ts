import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import { outreachMessages, outreachProspects } from "@/db/schema";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import { getEmailFrom, getEmailReplyTo, getResendClient } from "@/lib/email/resend";
import { createSupabaseAdminClient, MEDIA_BUCKET } from "@/lib/supabase/admin";
import { OUTREACH_STOPPED_STATUSES, type OutreachStatus } from "@/lib/outreach/constants";
import {
  fillOutreachTemplate,
  outreachBodyParagraphs,
} from "@/lib/outreach/render-template";
import type { OutreachTemplateRow } from "@/lib/outreach/templates-data";
import { VenueOutreachEmail } from "@/emails/VenueOutreachEmail";

/**
 * Cold outreach must not ride on the transactional domain: one spam complaint
 * too many and booking confirmations start landing in junk. Point
 * OUTREACH_EMAIL_FROM at a separate verified sending subdomain.
 */
export function getOutreachEmailFrom(): string {
  return process.env.OUTREACH_EMAIL_FROM?.trim() || getEmailFrom();
}

export function getOutreachReplyTo(): string {
  return process.env.OUTREACH_REPLY_TO?.trim() || getEmailReplyTo();
}

/** True when outreach is sent from its own domain, as it should be. */
export function isOutreachDomainSeparate(): boolean {
  return Boolean(process.env.OUTREACH_EMAIL_FROM?.trim());
}

export const OUTREACH_OPT_OUT_LINE =
  "Liever geen mail meer van ons? Antwoord met “nee” en je hoort niets meer.";

export type OutreachSendTarget = {
  id: string;
  name: string;
  city: string;
  category: string | null;
  contactName: string | null;
  website: string | null;
  email: string | null;
  status: OutreachStatus;
  sequenceStep: number;
};

export type OutreachSendResult =
  | { ok: true; prospectId: string; messageId: string }
  | { ok: false; prospectId: string; error: string };

export type RenderedOutreachMail = {
  subject: string;
  body: string;
  paragraphs: string[];
  html: string;
  text: string;
};

/** Fill the template for one prospect — also used by the preview in the UI. */
export async function renderOutreachMail(
  template: Pick<OutreachTemplateRow, "subject" | "body">,
  prospect: OutreachSendTarget,
): Promise<RenderedOutreachMail> {
  const subject = fillOutreachTemplate(template.subject, prospect);
  const body = fillOutreachTemplate(template.body, prospect);
  const paragraphs = outreachBodyParagraphs(body);
  const { html } = await renderEmailForDelivery(
    VenueOutreachEmail({
      preview: paragraphs[0]?.slice(0, 120) ?? subject,
      paragraphs,
      footer: OUTREACH_OPT_OUT_LINE,
    }),
  );
  // The plain-text alternative is the template body verbatim. Rendering it out
  // of the React email would collapse single newlines, which glues a signature
  // into one line ("Cheers, Siraadj MyTable mytable.club").
  const text = `${body.replace(/\r\n/g, "\n").trim()}\n\n${OUTREACH_OPT_OUT_LINE}\n`;
  return { subject, body, paragraphs, html, text };
}

function attachmentUrl(path: string): string {
  const supabase = createSupabaseAdminClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return publicUrl;
}

/**
 * Send one templated mail, log it, and move the prospect one step along the
 * sequence. `nextTemplate` decides when the follow-up becomes due; pass null
 * when this was the last step.
 */
export async function sendOutreachMail(input: {
  prospect: OutreachSendTarget;
  template: OutreachTemplateRow;
  nextTemplate: OutreachTemplateRow | null;
  sentBy?: string | null;
}): Promise<OutreachSendResult> {
  const { prospect, template, nextTemplate } = input;

  if (!prospect.email) {
    return { ok: false, prospectId: prospect.id, error: "Geen e-mailadres" };
  }

  const resend = getResendClient();
  if (!resend) {
    return {
      ok: false,
      prospectId: prospect.id,
      error: "RESEND_API_KEY ontbreekt",
    };
  }

  const mail = await renderOutreachMail(template, prospect);

  const attachments =
    template.attachmentPath && template.attachmentName
      ? [
          {
            path: attachmentUrl(template.attachmentPath),
            filename: template.attachmentName,
          },
        ]
      : undefined;

  const { data, error } = await resend.emails.send({
    from: getOutreachEmailFrom(),
    replyTo: getOutreachReplyTo(),
    to: prospect.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments,
    headers: {
      // One-click opt-out for mail clients; the reply lands in the same inbox
      // the venue would answer to anyway.
      "List-Unsubscribe": `<mailto:${getOutreachReplyTo()}?subject=Uitschrijven>`,
    },
    tags: [{ name: "outreach_prospect", value: prospect.id }],
  });

  const db = getDb();

  if (error || !data?.id) {
    const message = error?.message ?? "Onbekende fout bij Resend";
    await db.insert(outreachMessages).values({
      prospectId: prospect.id,
      templateId: template.id,
      templateKey: template.key,
      step: template.step,
      toEmail: prospect.email,
      subject: mail.subject,
      bodySnapshot: mail.body,
      attachmentName: template.attachmentName,
      status: "failed",
      error: message,
    });
    return { ok: false, prospectId: prospect.id, error: message };
  }

  const sentAt = new Date();
  const [message] = await db
    .insert(outreachMessages)
    .values({
      prospectId: prospect.id,
      templateId: template.id,
      templateKey: template.key,
      step: template.step,
      toEmail: prospect.email,
      subject: mail.subject,
      bodySnapshot: mail.body,
      attachmentName: template.attachmentName,
      resendMessageId: data.id,
      status: "sent",
      sentAt,
    })
    .returning({ id: outreachMessages.id });

  const isSequence = template.kind === "sequence";
  const stopped = OUTREACH_STOPPED_STATUSES.includes(prospect.status);
  const followUpAt =
    isSequence && nextTemplate && !stopped
      ? new Date(sentAt.getTime() + nextTemplate.delayDays * 24 * 60 * 60 * 1000)
      : null;

  await db
    .update(outreachProspects)
    .set({
      status: prospect.status === "new" ? "contacted" : prospect.status,
      sequenceStep: isSequence
        ? Math.max(prospect.sequenceStep, template.step ?? prospect.sequenceStep)
        : prospect.sequenceStep,
      lastContactedAt: sentAt,
      lastActivityAt: sentAt,
      nextFollowUpAt: followUpAt,
      updatedAt: new Date(),
    })
    .where(eq(outreachProspects.id, prospect.id));

  return { ok: true, prospectId: prospect.id, messageId: message.id };
}

/** Resend's default rate limit is 2 requests per second — stay under it. */
const SEND_INTERVAL_MS = 600;

export async function sendOutreachBatch(
  items: {
    prospect: OutreachSendTarget;
    template: OutreachTemplateRow;
    nextTemplate: OutreachTemplateRow | null;
  }[],
): Promise<OutreachSendResult[]> {
  const results: OutreachSendResult[] = [];
  for (const [index, item] of items.entries()) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS));
    }
    try {
      results.push(await sendOutreachMail(item));
    } catch (error) {
      results.push({
        ok: false,
        prospectId: item.prospect.id,
        error: error instanceof Error ? error.message : "Versturen mislukt",
      });
    }
  }
  return results;
}

/** The sequence template that is due next for this prospect, if any. */
export function nextSequenceTemplate(
  templates: OutreachTemplateRow[],
  sequenceStep: number,
): OutreachTemplateRow | null {
  return (
    templates.find(
      (template) =>
        template.kind === "sequence" &&
        template.isActive &&
        template.step === sequenceStep + 1,
    ) ?? null
  );
}

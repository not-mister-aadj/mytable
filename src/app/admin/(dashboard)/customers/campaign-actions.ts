"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { customers } from "@/db/schema";
import { getDb, isDbConfigured } from "@/db/index";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-url";
import { logCustomerActivity } from "@/lib/customers/activities";
import { CustomerActivityTypes } from "@/lib/customers/types";
import { getEmailReplyTo, getResendClient } from "@/lib/email/resend";
import { recipientRef, trackedLink } from "@/lib/email/tracked-link";
import {
  CAMPAIGN_MAX_RECIPIENTS,
  CAMPAIGN_UNSUBSCRIBE_MAILTO,
  buildCampaignMail,
  campaignExclusionReason,
  isValidCampaignSlug,
  isValidCampaignUrl,
  type CampaignExclusionReason,
  type CampaignMailContent,
} from "@/lib/email/campaign-mail";

const DEFAULT_CAMPAIGN_EMAIL_FROM = "Het MyTable-team <hallo@tafels.mytable.club>";
const CAMPAIGN_SEND_PAUSE_MS = 600;

function getCampaignEmailFrom(): string {
  return process.env.CAMPAIGN_EMAIL_FROM?.trim() || DEFAULT_CAMPAIGN_EMAIL_FROM;
}

export type CustomerCampaignInput = CampaignMailContent & {
  campaign: string;
};

function sanitizeCampaignInput(
  input: CustomerCampaignInput,
): { ok: true; value: CustomerCampaignInput } | { ok: false; error: string } {
  const value: CustomerCampaignInput = {
    campaign: input.campaign.trim().toLowerCase(),
    subject: input.subject.trim(),
    previewText: input.previewText.trim(),
    greeting: input.greeting.trim() || "Hoi",
    body: input.body.trim(),
    linkText: input.linkText.trim(),
    linkUrl: input.linkUrl.trim(),
  };
  if (!isValidCampaignSlug(value.campaign)) {
    return {
      ok: false,
      error: "Campagnenaam is verplicht: kleine letters, cijfers en - of _.",
    };
  }
  if (!value.subject) return { ok: false, error: "Onderwerp is verplicht." };
  if (!value.body) return { ok: false, error: "Tekst is verplicht." };
  if (value.linkUrl && !isValidCampaignUrl(value.linkUrl)) {
    return { ok: false, error: "Link-URL is geen geldige http(s)-link." };
  }
  if (value.linkUrl && !value.linkText) {
    return { ok: false, error: "Vul ook een linktekst in." };
  }
  return { ok: true, value };
}

type CampaignSendOutcome =
  | { ok: true; id: string; ref: string }
  | { ok: false; error: string };

async function sendCampaignMail(input: {
  content: CustomerCampaignInput;
  to: string;
  firstName: string | null;
  subjectPrefix?: string;
}): Promise<CampaignSendOutcome> {
  const resend = getResendClient();
  if (!resend) return { ok: false, error: "E-mail is niet geconfigureerd." };

  const { content, to } = input;
  const resolvedLinkUrl = content.linkUrl
    ? trackedLink(content.linkUrl, { campaign: content.campaign, email: to })
    : null;
  const { html, text } = buildCampaignMail({
    content,
    firstName: input.firstName,
    resolvedLinkUrl,
  });

  try {
    const { data, error } = await resend.emails.send({
      from: getCampaignEmailFrom(),
      replyTo: getEmailReplyTo(),
      to,
      subject: `${input.subjectPrefix ?? ""}${content.subject}`,
      html,
      text,
      headers: { "List-Unsubscribe": `<${CAMPAIGN_UNSUBSCRIBE_MAILTO}>` },
    });
    if (error || !data) {
      return { ok: false, error: error?.message ?? "Onbekende fout" };
    }
    return { ok: true, id: data.id, ref: recipientRef(content.campaign, to) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Onbekende fout",
    };
  }
}

/** Sends one copy of the campaign mail to the logged-in admin. Nothing is logged. */
export async function sendCustomerCampaignTestAction(input: {
  content: CustomerCampaignInput;
  sampleFirstName: string | null;
}): Promise<{ ok: true; to: string } | { ok: false; error: string }> {
  const { user } = await requireAdmin();
  const adminEmail = user.email;
  if (!adminEmail) {
    return { ok: false, error: "Geen e-mailadres bekend voor deze admin." };
  }

  const parsed = sanitizeCampaignInput(input.content);
  if (!parsed.ok) return parsed;

  const result = await sendCampaignMail({
    content: parsed.value,
    to: adminEmail,
    firstName: input.sampleFirstName,
    subjectPrefix: "[TEST] ",
  });
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, to: adminEmail };
}

export type CustomerCampaignSendResult =
  | {
      ok: true;
      sent: number;
      failed: number;
      excluded: Record<CampaignExclusionReason, number>;
      failures: { email: string; error: string }[];
    }
  | { ok: false; error: string };

/**
 * Sends the campaign mail one by one to the selected customers. The server
 * reloads the customers and applies the exclusions itself, and the admin has
 * to confirm the exact number of recipients.
 */
export async function sendCustomerCampaignAction(input: {
  content: CustomerCampaignInput;
  customerIds: string[];
  confirmCount: number;
}): Promise<CustomerCampaignSendResult> {
  await requireAdmin();
  if (!isDbConfigured()) {
    return { ok: false, error: "Database niet geconfigureerd" };
  }

  const parsed = sanitizeCampaignInput(input.content);
  if (!parsed.ok) return parsed;
  const content = parsed.value;

  const ids = [...new Set(input.customerIds)];
  if (ids.length === 0) {
    return { ok: false, error: "Geen ontvangers geselecteerd." };
  }

  const db = getDb();
  const rows = await db
    .select({
      id: customers.id,
      email: customers.email,
      firstName: customers.firstName,
      tags: customers.tags,
    })
    .from(customers)
    .where(inArray(customers.id, ids));

  const excluded: Record<CampaignExclusionReason, number> = {
    unsubscribed: 0,
    no_email: 0,
  };
  const seenEmails = new Set<string>();
  const recipients: typeof rows = [];
  for (const row of rows) {
    const reason = campaignExclusionReason({
      email: row.email,
      tags: Array.isArray(row.tags) ? row.tags : [],
    });
    if (reason) {
      excluded[reason] += 1;
      continue;
    }
    const key = row.email.trim().toLowerCase();
    if (seenEmails.has(key)) continue;
    seenEmails.add(key);
    recipients.push(row);
  }

  if (recipients.length === 0) {
    return { ok: false, error: "Geen ontvangers over na uitsluitingen." };
  }
  if (recipients.length > CAMPAIGN_MAX_RECIPIENTS) {
    return {
      ok: false,
      error: `Maximaal ${CAMPAIGN_MAX_RECIPIENTS} ontvangers per verzending. Maak de selectie kleiner.`,
    };
  }
  if (input.confirmCount !== recipients.length) {
    return {
      ok: false,
      error: `Bevestiging klopt niet: er zijn ${recipients.length} ontvangers.`,
    };
  }

  let sent = 0;
  const failures: { email: string; error: string }[] = [];

  for (const [index, recipient] of recipients.entries()) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, CAMPAIGN_SEND_PAUSE_MS));
    }
    const to = recipient.email.trim();
    const result = await sendCampaignMail({
      content,
      to,
      firstName: recipient.firstName,
    });
    if (!result.ok) {
      failures.push({ email: to, error: result.error });
      continue;
    }
    sent += 1;
    try {
      await logCustomerActivity({
        customerId: recipient.id,
        type: CustomerActivityTypes.emailSent,
        title: `Campagnemail: ${content.subject}`,
        description: `Campagne ${content.campaign}`,
        metadata: {
          campaign: content.campaign,
          subject: content.subject,
          ref: result.ref,
          resendId: result.id,
        },
      });
    } catch (err) {
      console.error("[customer campaign] could not log activity", err);
    }
  }

  revalidatePath(adminPath("/customers"));

  return { ok: true, sent, failed: failures.length, excluded, failures };
}

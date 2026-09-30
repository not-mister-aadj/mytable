// Plain, personal campaign mail sent from the admin customer list. Client safe
// on purpose (no node or db imports): the admin panel renders the live
// preview with the same builder the server action sends with.
//
// Kept deliberately simple (no logo, no boxes, one text link) since a mail
// that looks like a personal note lands in the Gmail Primary tab more often.

export const CAMPAIGN_MAX_RECIPIENTS = 300;
export const CAMPAIGN_UNSUBSCRIBE_MAILTO =
  "mailto:info@mytable.club?subject=Afmelden";
export const CAMPAIGN_UNSUBSCRIBED_TAG = "afgemeld";

const LINK_COLOR = "#600D1E";

export type CampaignMailContent = {
  subject: string;
  previewText: string;
  /** Word before the first name, e.g. "Hoi". */
  greeting: string;
  body: string;
  linkText: string;
  linkUrl: string;
};

export type CampaignExclusionReason = "unsubscribed" | "no_email";

export const CAMPAIGN_EXCLUSION_LABELS: Record<CampaignExclusionReason, string> = {
  unsubscribed: "afgemeld (tag)",
  no_email: "geen e-mailadres",
};

/** Why a customer must not get a campaign mail, or null when they may. */
export function campaignExclusionReason(customer: {
  email: string | null;
  tags: string[] | null;
}): CampaignExclusionReason | null {
  const tags = customer.tags ?? [];
  if (
    tags.some(
      (tag) =>
        typeof tag === "string" &&
        tag.trim().toLowerCase() === CAMPAIGN_UNSUBSCRIBED_TAG,
    )
  ) {
    return "unsubscribed";
  }
  if (!customer.email?.trim() || !customer.email.includes("@")) {
    return "no_email";
  }
  return null;
}

export function isValidCampaignSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(slug);
}

export function isValidCampaignUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Blank lines separate paragraphs; single line breaks stay line breaks. */
function splitParagraphs(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function greetingLine(greeting: string, firstName: string | null): string {
  const word = greeting.trim() || "Hoi";
  const name = firstName?.trim();
  return name ? `${word} ${name},` : `${word},`;
}

/**
 * Builds the HTML and plain-text parts for one recipient. `resolvedLinkUrl`
 * is the link as this recipient gets it (with tracking), so the caller
 * decides how links are tagged.
 */
export function buildCampaignMail(input: {
  content: CampaignMailContent;
  firstName: string | null;
  resolvedLinkUrl: string | null;
}): { html: string; text: string } {
  const { content, firstName, resolvedLinkUrl } = input;
  const paragraphs = splitParagraphs(content.body);
  const hello = greetingLine(content.greeting, firstName);
  const linkText = content.linkText.trim();
  const hasLink = Boolean(resolvedLinkUrl && linkText);

  const p = (inner: string) =>
    `<p style="margin:0 0 16px 0;">${inner}</p>`;

  const htmlParts: string[] = [];
  htmlParts.push(p(escapeHtml(hello)));
  for (const paragraph of paragraphs) {
    htmlParts.push(p(escapeHtml(paragraph).replace(/\n/g, "<br>")));
  }
  if (hasLink) {
    htmlParts.push(
      p(
        `<a href="${escapeHtml(resolvedLinkUrl!)}" style="color:${LINK_COLOR};font-weight:bold;text-decoration:underline;">${escapeHtml(linkText)}</a>`,
      ),
    );
  }
  htmlParts.push(p("Vragen? Antwoord gewoon op deze mail."));
  htmlParts.push(p("Tot aan tafel,<br>Het MyTable-team"));
  htmlParts.push(
    `<p style="margin:32px 0 0 0;font-size:12px;line-height:1.5;color:#999999;">Liever geen mails meer van ons? <a href="${CAMPAIGN_UNSUBSCRIBE_MAILTO}" style="color:#999999;text-decoration:underline;">Meld je hier af</a>.</p>`,
  );

  const preview = content.previewText.trim();
  const previewHtml = preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
${previewHtml}
<div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:Arial, Helvetica, sans-serif;font-size:15px;line-height:1.6;color:#222222;">
${htmlParts.join("\n")}
</div>
</body>
</html>`;

  const textParts: string[] = [hello, ...paragraphs];
  if (hasLink) {
    textParts.push(`${linkText}: ${resolvedLinkUrl}`);
  }
  textParts.push("Vragen? Antwoord gewoon op deze mail.");
  textParts.push("Tot aan tafel,\nHet MyTable-team");
  textParts.push(
    "Liever geen mails meer van ons? Stuur een mail naar info@mytable.club met als onderwerp Afmelden.",
  );

  return { html, text: textParts.join("\n\n") };
}

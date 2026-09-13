import type { OutreachProspect } from "@/db/schema";

/** The subset of a prospect a template can address. */
export type OutreachTemplateContext = Pick<
  OutreachProspect,
  "name" | "city" | "category" | "contactName" | "website"
>;

function stripProtocol(url: string | null): string {
  return (url ?? "").replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/**
 * Replace {{tokens}} with prospect data. Unknown tokens are left as-is: a typo
 * should be visible in the preview, not become an empty hole in a cold mail.
 */
export function fillOutreachTemplate(
  text: string,
  prospect: OutreachTemplateContext,
): string {
  const values: Record<string, string> = {
    naam: prospect.name,
    stad: prospect.city,
    categorie: prospect.category?.toLowerCase() ?? "zaak",
    contact: prospect.contactName?.trim() || "team",
    website: stripProtocol(prospect.website),
  };

  return text.replace(/\{\{\s*([a-z]+)\s*\}\}/gi, (match, token: string) => {
    const value = values[token.toLowerCase()];
    return value === undefined ? match : value;
  });
}

/** Any {{token}} the template context cannot fill — surfaced before sending. */
export function unknownPlaceholders(text: string): string[] {
  const known = new Set(["naam", "stad", "categorie", "contact", "website"]);
  const found = new Set<string>();
  for (const match of text.matchAll(/\{\{\s*([a-z]+)\s*\}\}/gi)) {
    const token = match[1].toLowerCase();
    if (!known.has(token)) found.add(match[0]);
  }
  return [...found];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A line that is nothing but a web address, e.g. "instagram.com/mytable.club". */
const BARE_URL_LINE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;

/**
 * One line of the mail as HTML. A line holding only a web address becomes a
 * link, as Gmail does when you type an address into a signature; everything
 * else stays plain text.
 */
function lineToHtml(line: string): string {
  if (!BARE_URL_LINE.test(line)) return escapeHtml(line);
  const href = /^https?:\/\//i.test(line) ? line : `https://${line}`;
  return `<a href="${escapeHtml(href)}">${escapeHtml(line)}</a>`;
}

/**
 * The HTML part of an outreach mail, built the way Gmail's own composer builds
 * a typed message: one div per line, an empty line as <div><br></div>, and no
 * styling at all, so every mail client shows it in its own default font.
 *
 * The HTML part exists only because open tracking needs one to carry its pixel.
 * It must not look any different from a mail typed by hand — no width, no font,
 * no colours, no footer.
 */
export function outreachTextToHtml(text: string): string {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  const inner = lines
    .map((line) =>
      line.trim() ? `<div>${lineToHtml(line.trim())}</div>` : "<div><br></div>",
    )
    .join("");
  // A complete document, so the open-tracking pixel always has a <body> to be
  // placed in. Still no styling anywhere: the mail looks exactly as before.
  return `<html><head><meta charset="utf-8"></head><body><div dir="ltr">${inner}</div></body></html>`;
}

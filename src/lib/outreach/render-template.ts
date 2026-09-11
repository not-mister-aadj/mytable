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
      line.trim() ? `<div>${escapeHtml(line)}</div>` : "<div><br></div>",
    )
    .join("");
  return `<div dir="ltr">${inner}</div>`;
}

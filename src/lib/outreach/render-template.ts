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

/** Blank-line separated blocks; single newlines stay inside a paragraph. */
export function outreachBodyParagraphs(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

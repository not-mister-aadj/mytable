import { recipientRef } from "@/lib/email/tracked-link";
import { emailKind } from "@/lib/email/email-kind";

/** Our own sites: only links to these get UTM tags. */
const OWN_HOSTS = new Set(["mytable.club", "www.mytable.club", "mytableclub.nl", "www.mytableclub.nl"]);

/** Query keys that carry the mail's source through a redirect. */
export const MAIL_TRACKING_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "r"] as const;

/** "Welkom", "+1 erbij", "Boeken open" -> "welkom", "1-erbij", "boeken-open". */
export function mailCampaignSlug(subject: string): string {
  const slug = emailKind(subject)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug === "e-mail" || !slug ? "overig" : slug;
}

function isOwnHost(host: string, extraHosts: readonly string[]): boolean {
  const h = host.toLowerCase();
  return OWN_HOSTS.has(h) || extraHosts.includes(h);
}

function tagUrl(raw: string, tags: Record<string, string>, extraHosts: readonly string[]): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  if (!/^https?:$/.test(url.protocol) || !isOwnHost(url.host, extraHosts)) return raw;
  // A link that already says where it comes from (a campaign mail) keeps it.
  if (url.searchParams.has("utm_source")) return raw;
  for (const [key, value] of Object.entries(tags)) url.searchParams.set(key, value);
  return url.toString();
}

/**
 * Adds UTM tags and the recipient code (`r`, see tracked-link.ts) to every
 * link to our own site in an automatic mail, so a visit or booking from it
 * shows the mail as its channel: utm_source=mail, utm_medium=email,
 * utm_campaign = the kind of mail ("welkom", "bevestiging", "locatie").
 * Links elsewhere (Instagram, Maps, mailto) and links that already carry
 * UTM tags are left alone.
 */
export function addMailUtm(
  input: { html?: string | null; text?: string | null; subject: string; to: string },
  extraHosts: readonly string[] = [],
): { html?: string | null; text?: string | null } {
  const campaign = mailCampaignSlug(input.subject);
  const tags = {
    utm_source: "mail",
    utm_medium: "email",
    utm_campaign: campaign,
    r: recipientRef(campaign, input.to),
  };
  const html =
    typeof input.html === "string"
      ? input.html.replace(/href=(["'])(https?:\/\/[^"']+)\1/gi, (_m, quote: string, href: string) => {
          // Attribute values have & written as &amp;.
          const tagged = tagUrl(href.replace(/&amp;/g, "&"), tags, extraHosts).replace(/&/g, "&amp;");
          return `href=${quote}${tagged}${quote}`;
        })
      : input.html;
  const text =
    typeof input.text === "string"
      ? input.text.replace(/https?:\/\/[^\s<>"')\]]+/gi, (match) => {
          // A full stop or comma after a link ends the sentence, not the link.
          const url = match.replace(/[.,;:!?]+$/, "");
          return tagUrl(url, tags, extraHosts) + match.slice(url.length);
        })
      : input.text;
  return { html, text };
}

/**
 * A mail to a real guest must never carry a link to a dev machine: a script
 * run locally builds links from .env.local (localhost), and guests then get a
 * button that goes nowhere (23 Nov 2026). Resend's own test inboxes may.
 */

const LOCAL_LINK = /\b(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(?:[/?#"'\s]|$)/i;
const TEST_RECIPIENT = /@resend\.dev$/i;

function recipients(to: unknown): string[] {
  const list = Array.isArray(to) ? to : [to];
  return list.filter((v): v is string => typeof v === "string").map((v) => v.trim().toLowerCase());
}

/** Why this mail may not go out, or null when it may. */
export function localLinkProblem(mail: { to?: unknown; html?: unknown; text?: unknown }): string | null {
  const to = recipients(mail.to);
  if (to.length > 0 && to.every((address) => TEST_RECIPIENT.test(address))) return null;
  const bodies = [mail.html, mail.text].filter((v): v is string => typeof v === "string");
  if (!bodies.some((body) => LOCAL_LINK.test(body))) return null;
  return "Mail not sent: it links to localhost. Build links with https://www.mytable.club, not the local site URL.";
}

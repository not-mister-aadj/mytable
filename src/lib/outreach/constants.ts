/** Pipeline states, in the order a prospect moves through them. */
export const OUTREACH_STATUSES = [
  "new",
  "contacted",
  "replied",
  "interested",
  "meeting",
  "partner",
  "not_interested",
  "bounced",
  "unsubscribed",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  new: "Nieuw",
  contacted: "Gemaild",
  replied: "Geantwoord",
  interested: "Interesse",
  meeting: "Afspraak",
  partner: "Partner",
  not_interested: "Geen interesse",
  bounced: "Bounce",
  unsubscribed: "Afgemeld",
};

/** Tailwind classes per status — same palette as the rest of the admin. */
export const OUTREACH_STATUS_CLASSES: Record<OutreachStatus, string> = {
  new: "border-wine/15 bg-wine/[0.04] text-wine/70",
  contacted: "border-burgundy/20 bg-burgundy/[0.06] text-burgundy",
  replied: "border-gold/40 bg-gold/[0.12] text-[#7A5A2B]",
  interested: "border-emerald-600/30 bg-emerald-600/[0.08] text-emerald-800",
  meeting: "border-emerald-600/40 bg-emerald-600/[0.14] text-emerald-900",
  partner: "border-emerald-700/50 bg-emerald-700/[0.18] text-emerald-900",
  not_interested: "border-wine/15 bg-wine/[0.04] text-wine/45",
  bounced: "border-red-500/30 bg-red-500/[0.08] text-red-800",
  unsubscribed: "border-wine/15 bg-wine/[0.04] text-wine/45",
};

/** Statuses that take a prospect out of the sequence for good. */
export const OUTREACH_STOPPED_STATUSES: readonly OutreachStatus[] = [
  "replied",
  "interested",
  "meeting",
  "partner",
  "not_interested",
  "bounced",
  "unsubscribed",
];

export function isOutreachStatus(value: string): value is OutreachStatus {
  return (OUTREACH_STATUSES as readonly string[]).includes(value);
}

export const OUTREACH_TEMPLATE_KINDS = ["sequence", "reply", "other"] as const;
export type OutreachTemplateKind = (typeof OUTREACH_TEMPLATE_KINDS)[number];

export const OUTREACH_TEMPLATE_KIND_LABELS: Record<
  OutreachTemplateKind,
  string
> = {
  sequence: "Sequence",
  reply: "Antwoord",
  other: "Los",
};

export const OUTREACH_ACTIVITY_TYPES = [
  "reply",
  "note",
  "call",
  "meeting",
] as const;
export type OutreachActivityType = (typeof OUTREACH_ACTIVITY_TYPES)[number];

export const OUTREACH_ACTIVITY_LABELS: Record<OutreachActivityType, string> = {
  reply: "Antwoord",
  note: "Notitie",
  call: "Telefoon",
  meeting: "Afspraak",
};

export const OUTREACH_SENTIMENTS = ["positive", "neutral", "negative"] as const;
export type OutreachSentiment = (typeof OUTREACH_SENTIMENTS)[number];

export const OUTREACH_SENTIMENT_LABELS: Record<OutreachSentiment, string> = {
  positive: "Positief",
  neutral: "Neutraal",
  negative: "Negatief",
};

/**
 * Placeholders you can use in a template subject or body. Anything unknown is
 * left untouched so a typo shows up in the preview instead of silently
 * mailing an empty gap.
 */
export const OUTREACH_PLACEHOLDERS = [
  { token: "{{naam}}", description: "Naam van de zaak" },
  { token: "{{stad}}", description: "Stad" },
  { token: "{{categorie}}", description: "Wijnbar, bistro, restaurant…" },
  { token: "{{contact}}", description: "Contactpersoon, anders “team”" },
  { token: "{{website}}", description: "Website zonder https://" },
] as const;

/** templateKey stored on a mail written by hand in the dashboard. */
export const OUTREACH_MANUAL_MAIL_KEY = "manual";

/**
 * Starting text for a hand-written mail: an open greeting and the sign-off
 * every venue mail uses.
 */
export const OUTREACH_MANUAL_MAIL_DRAFT =
  "Hi,\n\n\n\nCheers,\nTeam MyTable\nmytable.club";

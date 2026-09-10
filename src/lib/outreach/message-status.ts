/**
 * Shape and presentation of one sent mail. Deliberately free of any database
 * import: the mail log renders in the browser, and pulling the query module in
 * would drag the Postgres driver into the client bundle.
 */
export type OutreachMessageLogRow = {
  id: string;
  prospectId: string;
  prospectName: string;
  city: string;
  toEmail: string;
  templateKey: string | null;
  step: number | null;
  subject: string;
  bodySnapshot: string;
  attachmentName: string | null;
  error: string | null;
  sentAt: string;
  deliveredAt: string | null;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  openCount: number;
  firstClickedAt: string | null;
  clickCount: number;
  bouncedAt: string | null;
  complainedAt: string | null;
  failed: boolean;
};

export const MAIL_STATUSES = [
  "failed",
  "bounced",
  "complained",
  "clicked",
  "opened",
  "delivered",
  "sent",
] as const;

export type MailStatus = (typeof MAIL_STATUSES)[number];

export const MAIL_STATUS_LABELS: Record<MailStatus, string> = {
  failed: "Mislukt",
  bounced: "Bounce",
  complained: "Spamklacht",
  clicked: "Geklikt",
  opened: "Geopend",
  delivered: "Afgeleverd",
  sent: "Verstuurd",
};

export const MAIL_STATUS_CLASSES: Record<MailStatus, string> = {
  failed: "border-red-500/40 bg-red-500/[0.1] text-red-800",
  bounced: "border-red-500/30 bg-red-500/[0.08] text-red-800",
  complained: "border-red-500/40 bg-red-500/[0.12] text-red-900",
  clicked: "border-gold/50 bg-gold/[0.16] text-[#7A5A2B]",
  opened: "border-burgundy/30 bg-burgundy/[0.08] text-burgundy",
  delivered: "border-emerald-600/30 bg-emerald-600/[0.08] text-emerald-800",
  sent: "border-wine/15 bg-wine/[0.05] text-wine/70",
};

/**
 * The furthest state a mail actually reached, derived from the timestamps
 * rather than the stored status column — a late "delivered" webhook can never
 * make an opened mail look unopened.
 */
export function mailStatus(row: OutreachMessageLogRow): MailStatus {
  if (row.failed) return "failed";
  if (row.complainedAt) return "complained";
  if (row.bouncedAt) return "bounced";
  if (row.firstClickedAt) return "clicked";
  if (row.firstOpenedAt) return "opened";
  if (row.deliveredAt) return "delivered";
  return "sent";
}

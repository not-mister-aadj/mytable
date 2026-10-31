import type { OutreachProspectRow } from "@/lib/outreach/prospects-data";

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
  /** Share of the prospects we actually mailed. */
  rate: number;
  hint: string;
};

export type OutreachFunnel = {
  total: number;
  mailed: number;
  stages: FunnelStage[];
  bounced: number;
  unsubscribed: number;
  /** True until a webhook event has ever landed — the rates mean nothing yet. */
  awaitingTracking: boolean;
};

const INTERESTED_STATUSES = ["interested", "meeting", "partner"];

/**
 * The funnel is measured against the prospects we mailed, not the whole list:
 * an open rate over venues that never got a mail is a meaningless number.
 */
export function buildOutreachFunnel(rows: OutreachProspectRow[]): OutreachFunnel {
  const mailedRows = rows.filter((row) => row.messageCount > 0);
  const mailed = mailedRows.length;
  const rate = (count: number) => (mailed > 0 ? count / mailed : 0);

  const delivered = mailedRows.filter((row) => row.deliveredCount > 0).length;
  const opened = mailedRows.filter((row) => row.openedCount > 0).length;
  const clicked = mailedRows.filter((row) => row.clickedCount > 0).length;
  const replied = rows.filter((row) => row.replyCount > 0).length;
  const interested = rows.filter((row) =>
    INTERESTED_STATUSES.includes(row.status),
  ).length;
  const partner = rows.filter((row) => row.status === "partner").length;

  const stages: FunnelStage[] = [
    {
      key: "mailed",
      label: "Gemaild",
      count: mailed,
      rate: 1,
      hint: `van ${rows.length} zaken`,
    },
    {
      key: "delivered",
      label: "Afgeleverd",
      count: delivered,
      rate: rate(delivered),
      hint: "aangekomen bij de ontvanger",
    },
    {
      key: "opened",
      label: "Geopend",
      count: opened,
      rate: rate(opened),
      hint: "minstens één mail geopend",
    },
    {
      key: "replied",
      label: "Geantwoord",
      count: replied,
      rate: rate(replied),
      hint: "antwoord gelogd",
    },
    {
      key: "interested",
      label: "Interesse",
      count: interested,
      rate: rate(interested),
      hint: "interesse, afspraak of partner",
    },
    {
      key: "partner",
      label: "Partner",
      count: partner,
      rate: rate(partner),
      hint: "tafel geboekt",
    },
  ];

  // Click tracking is off by default; a permanently empty row is just noise.
  if (clicked > 0) {
    stages.splice(3, 0, {
      key: "clicked",
      label: "Geklikt",
      count: clicked,
      rate: rate(clicked),
      hint: "op een link geklikt",
    });
  }

  return {
    total: rows.length,
    mailed,
    stages,
    bounced: rows.filter((row) => row.bouncedCount > 0).length,
    unsubscribed: rows.filter((row) => row.status === "unsubscribed").length,
    awaitingTracking: mailed > 0 && delivered === 0 && opened === 0,
  };
}

export function formatRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return "0%";
  return `${Math.round(rate * 100)}%`;
}

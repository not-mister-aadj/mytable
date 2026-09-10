import type { OutreachProspectRow } from "@/lib/outreach/prospects-data";

export type FunnelStage = {
  key: string;
  label: string;
  count: number;
  /** Share of the prospects we actually mailed. */
  rate: number;
  hint: string;
};

export type StepStats = {
  step: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  /** Replies that arrived while this was the last mail sent. */
  replies: number;
};

export type OutreachFunnel = {
  total: number;
  mailed: number;
  stages: FunnelStage[];
  bounced: number;
  unsubscribed: number;
  steps: StepStats[];
  /** True until a webhook event has ever landed — the rates mean nothing yet. */
  awaitingTracking: boolean;
};

const INTERESTED_STATUSES = ["interested", "meeting", "partner"];

/**
 * The funnel is measured against the prospects we mailed, not the whole list:
 * an open rate over venues that never got a mail is a meaningless number.
 * Replies are attributed to the step a prospect had reached, which is exact —
 * the sequence stops the moment a reply is logged.
 */
export function buildOutreachFunnel(
  rows: OutreachProspectRow[],
  sequenceLength: number,
): OutreachFunnel {
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

  const steps: StepStats[] = [];
  for (let step = 1; step <= Math.max(sequenceLength, 1); step += 1) {
    const withStep = rows
      .map((row) => row.steps.find((entry) => entry.step === step))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
    if (withStep.length === 0) continue;
    steps.push({
      step,
      sent: withStep.length,
      delivered: withStep.filter((entry) => entry.deliveredAt).length,
      opened: withStep.filter((entry) => entry.openedAt).length,
      clicked: withStep.filter((entry) => entry.clickCount > 0).length,
      replies: rows.filter(
        (row) => row.replyCount > 0 && row.sequenceStep === step,
      ).length,
    });
  }

  return {
    total: rows.length,
    mailed,
    stages,
    bounced: rows.filter((row) => row.bouncedCount > 0).length,
    unsubscribed: rows.filter((row) => row.status === "unsubscribed").length,
    steps,
    awaitingTracking: mailed > 0 && delivered === 0 && opened === 0,
  };
}

export function formatRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return "0%";
  return `${Math.round(rate * 100)}%`;
}

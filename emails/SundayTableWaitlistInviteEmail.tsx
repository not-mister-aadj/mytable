import { EmailLayout } from "./components/EmailLayout";
import { Button } from "./components/Button";

export type SundayTableWaitlistInviteEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
  /** Already formatted, e.g. via formatSundayTableDate */
  dateLabel: string;
  timeLabel: string;
  tableType: "girls_only" | "mixed";
  seatsLeft: number;
  claimUrl: string;
  /** e.g. "Vanaf €8,33/maand (12 mnd)" — matches the LP's ctaHint copy */
  priceHint: string;
};

export function SundayTableWaitlistInviteEmail({
  locale,
  firstName,
  city,
  dateLabel,
  timeLabel,
  tableType,
  seatsLeft,
  claimUrl,
  priceHint,
}: SundayTableWaitlistInviteEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName
    ? nl
      ? `Hoi ${firstName},`
      : `Hi ${firstName},`
    : nl
      ? "Hoi,"
      : "Hi,";
  const tableTypeLabel = nl
    ? tableType === "girls_only"
      ? "girls only"
      : "gemengde"
    : tableType === "girls_only"
      ? "girls only"
      : "mixed";

  return (
    <EmailLayout preview={nl ? "Er vormt zich een tafel" : "A table is forming"}>
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {greeting}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 16, color: "#2b0d12" }}>
        {nl
          ? `Er vormt zich een ${tableTypeLabel} Sunday Table in ${city}, op ${dateLabel} om ${timeLabel}.`
          : `A ${tableTypeLabel} Sunday Table is forming in ${city}, on ${dateLabel} at ${timeLabel}.`}
      </p>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 15,
          color: "#5c3a42",
          lineHeight: 1.5,
        }}
      >
        {nl
          ? `Nog ${seatsLeft} plekken over, op basis van wie er tot nu toe heeft geclaimd.`
          : `${seatsLeft} seats left, based on who's claimed a spot so far.`}
      </p>
      <Button href={claimUrl}>
        {nl ? "Claim je plek" : "Claim your seat"}
      </Button>
      <p style={{ margin: "20px 0 0", fontSize: 13, color: "#8a6a72" }}>
        {priceHint}
      </p>
    </EmailLayout>
  );
}

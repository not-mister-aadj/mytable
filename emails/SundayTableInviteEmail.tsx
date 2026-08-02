import { EmailLayout } from "./components/EmailLayout";
import { Button } from "./components/Button";

export type SundayTableInviteEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
  shareUrl: string;
  whatsappUrl: string;
};

export function SundayTableInviteEmail({
  locale,
  firstName,
  city,
  shareUrl,
  whatsappUrl,
}: SundayTableInviteEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName
    ? nl
      ? `Hoi ${firstName},`
      : `Hi ${firstName},`
    : nl
      ? "Hoi,"
      : "Hi,";

  return (
    <EmailLayout preview={nl ? "Nodig iemand uit" : "Invite someone"}>
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {greeting}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 16, color: "#2b0d12" }}>
        {nl
          ? `Je Sunday Table in ${city} was afgelopen zondag. Nodig iemand uit voor de volgende eerste zondag.`
          : `Your Sunday Table in ${city} was this past Sunday. Invite someone to the next first Sunday.`}
      </p>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: 15,
          color: "#5c3a42",
          lineHeight: 1.5,
        }}
      >
        {nl
          ? "Elke eerste zondag. Nieuwe mensen. Een drankje. Daarna culinaire ervaringen."
          : "Every first Sunday. New people. A drink. Then culinary experiences."}
      </p>
      <Button href={whatsappUrl}>
        {nl ? "Deel via WhatsApp" : "Share on WhatsApp"}
      </Button>
      <p style={{ margin: "20px 0 0", fontSize: 13, color: "#8a6a72" }}>
        <a href={shareUrl} style={{ color: "#8a6a72" }}>
          {shareUrl}
        </a>
      </p>
    </EmailLayout>
  );
}

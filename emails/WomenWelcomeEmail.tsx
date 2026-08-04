import { EmailLayout } from "./components/EmailLayout";
import { Button } from "./components/Button";

export type WomenWelcomeEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  whatsappUrl: string;
  sundayTableUrl: string;
};

export function WomenWelcomeEmail({
  locale,
  firstName,
  whatsappUrl,
  sundayTableUrl,
}: WomenWelcomeEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName
    ? nl
      ? `Hoi ${firstName},`
      : `Hi ${firstName},`
    : nl
      ? "Hoi,"
      : "Hi,";

  return (
    <EmailLayout
      preview={
        nl
          ? "Welkom bij MyTable. Hier is de WhatsApp-groep."
          : "Welcome to MyTable. Here is the WhatsApp group."
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {greeting}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 16, color: "#2b0d12" }}>
        {nl ? "Welkom bij MyTable." : "Welcome to MyTable."}
      </p>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 16,
          color: "#2b0d12",
          lineHeight: 1.5,
        }}
      >
        {nl
          ? "Leuk dat je erbij bent. We hosten girls-only Sunday Tables op zondagmiddag: nieuwe vriendinnen, wijn en goed gezelschap. Geen dating vibe."
          : "Glad you are here. We host girls-only Sunday Tables on Sunday afternoons: new friends, wine and great company. No dating vibe."}
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
          ? "De WhatsApp-groep is de makkelijkste manier om op de hoogte te blijven van de tafels."
          : "The WhatsApp group is the easiest way to stay up to date on the tables."}
      </p>
      <Button href={whatsappUrl}>
        {nl ? "Naar de WhatsApp-groep" : "Join the WhatsApp group"}
      </Button>
      <p style={{ margin: "20px 0 0", fontSize: 13, color: "#8a6a72" }}>
        <a href={sundayTableUrl} style={{ color: "#8a6a72" }}>
          {nl ? "Of bekijk Sunday Table op de site" : "Or view Sunday Table on the site"}
        </a>
      </p>
    </EmailLayout>
  );
}

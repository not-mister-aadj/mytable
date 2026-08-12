import { EmailLayout } from "./components/EmailLayout";

export type SundayTableWaitlistWelcomeEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
};

export function SundayTableWaitlistWelcomeEmail({
  locale,
  firstName,
  city,
}: SundayTableWaitlistWelcomeEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName
    ? nl
      ? `Hoi ${firstName},`
      : `Hi ${firstName},`
    : nl
      ? "Hoi,"
      : "Hi,";

  return (
    <EmailLayout preview={nl ? "Je staat op de lijst" : "You're on the list"}>
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {greeting}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 16, color: "#2b0d12" }}>
        {nl
          ? `Je staat op de wachtlijst voor Sunday Table in ${city}.`
          : `You're on the Sunday Table waitlist for ${city}.`}
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
          ? "Zodra we genoeg mensen hebben voor een tafel die bij je past, mail we je meteen om je plek te claimen. Geen verdere actie nodig."
          : "As soon as we have enough people for a table that fits you, we'll email you right away to claim your seat. Nothing else to do for now."}
      </p>
      <p style={{ margin: "0", fontSize: 13, color: "#8a6a72" }}>
        {nl
          ? "Vragen? Antwoord gewoon op deze mail."
          : "Questions? Just reply to this email."}
      </p>
    </EmailLayout>
  );
}

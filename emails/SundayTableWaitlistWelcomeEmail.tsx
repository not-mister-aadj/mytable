import { EmailLayout } from "./components/EmailLayout";
import { joinCityNames } from "@/lib/email/format-cities";

export type SundayTableWaitlistWelcomeEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  /** Every city this signup joined the waitlist for, not just one. */
  cities: string[];
  /** Not used by this mail any more (it offered a WhatsApp group once);
   * kept so callers need no change. */
  gender?: "female" | "male" | "other" | "unspecified";
};

export function SundayTableWaitlistWelcomeEmail({
  locale,
  firstName,
  cities,
}: SundayTableWaitlistWelcomeEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName
    ? nl
      ? `Hoi ${firstName},`
      : `Hi ${firstName},`
    : nl
      ? "Hoi,"
      : "Hi,";
  const cityLabel = joinCityNames(cities, locale);

  return (
    <EmailLayout preview={nl ? "Je staat op de lijst" : "You're on the list"}>
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {greeting}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 16, color: "#2b0d12" }}>
        {nl
          ? `Je staat op de wachtlijst voor Sunday Social in ${cityLabel}.`
          : `You're on the Sunday Social waitlist for ${cityLabel}.`}
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
          ? "Zodra we genoeg mensen hebben voor een tafel die bij je past, mailen we je meteen om je plek te claimen. Geen verdere actie nodig."
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

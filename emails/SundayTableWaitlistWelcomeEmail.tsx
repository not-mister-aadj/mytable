import { Button } from "./components/Button";
import { EmailLayout } from "./components/EmailLayout";
import { joinCityNames } from "@/lib/email/format-cities";

export type SundayTableWaitlistWelcomeEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  /** Every city this signup joined the waitlist for, not just one. */
  cities: string[];
  /** Signs them in and opens "Kies je zondag" with the tables in their
   * cities. When no account could be made it goes to the log-in screen. */
  tablesUrl: string;
  /** Not used by this mail any more (it offered a WhatsApp group once);
   * kept so callers need no change. */
  gender?: "female" | "male" | "other" | "unspecified";
};

const text = { margin: "0 0 14px", fontSize: 16, color: "#2b0d12", lineHeight: 1.5 } as const;
const step = { margin: "0 0 10px", fontSize: 15, color: "#5c3a42", lineHeight: 1.5 } as const;

/**
 * "Welkom bij Sunday Social": the first mail after joining the waitlist. Most
 * people don't know the concept yet, so it explains it in three steps, says
 * invitations follow, and lets them see every open table now.
 */
export function SundayTableWaitlistWelcomeEmail({
  locale,
  firstName,
  cities,
  tablesUrl,
}: SundayTableWaitlistWelcomeEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName ? (nl ? `Hoi ${firstName},` : `Hi ${firstName},`) : nl ? "Hoi," : "Hi,";
  const cityLabel = joinCityNames(cities, locale);
  const where = cities.length === 1 ? cityLabel : nl ? "jouw stad" : "your city";

  return (
    <EmailLayout preview={nl ? "Zo werkt Sunday Social" : "How Sunday Social works"}>
      <p style={text}>{greeting}</p>
      <p style={text}>
        {nl
          ? `Leuk dat je op de wachtlijst staat. We sturen je ongeveer één keer per maand een uitnodiging voor een zondag in ${cityLabel}.`
          : `Great to have you on the waitlist. About once a month we'll send you an invitation for a Sunday in ${cityLabel}.`}
      </p>
      <p style={text}>{nl ? "Zo werkt Sunday Social:" : "This is how Sunday Social works:"}</p>
      <p style={step}>
        <strong style={{ color: "#2b0d12" }}>{nl ? "1. Wij reserveren een tafel" : "1. We book a table"}</strong>
        {nl
          ? ` bij een fijne wijnbar in ${where}, op een zondagmiddag. Welke zaak het is, hoor je een week van tevoren.`
          : ` at a lovely wine bar in ${where}, on a Sunday afternoon. You'll hear which one a week before.`}
      </p>
      <p style={step}>
        <strong style={{ color: "#2b0d12" }}>{nl ? "2. Jij schuift aan" : "2. You join"}</strong>
        {nl ? " met vier tot zes gezellige mensen die bij je passen." : " four to six friendly people who suit you."}
      </p>
      <p style={{ ...step, margin: "0 0 18px" }}>
        <strong style={{ color: "#2b0d12" }}>{nl ? "3. Jullie bestellen wat je lekker lijkt" : "3. You order whatever you fancy"}</strong>
        {nl
          ? ", met een paar aanraders van ons als je twijfelt. Gewoon een gezellige zondagmiddag aan een mooi glas."
          : ", with a few picks from us if you're unsure. Just a cosy Sunday afternoon over a good glass."}
      </p>
      <p style={{ ...text, margin: "0 0 20px" }}>
        {nl
          ? "Wil je niet wachten op je uitnodiging? Je kunt altijd inloggen in je account en zelf een tafel kiezen."
          : "Don't want to wait for your invitation? You can always log in to your account and pick a table yourself."}
      </p>
      <div style={{ margin: "0 0 24px" }}>
        <Button href={tablesUrl}>{nl ? "Bekijk je tafels" : "See your tables"}</Button>
      </div>
      <p style={{ ...text, margin: "0 0 4px" }}>{nl ? "Tot aan tafel," : "See you at the table,"}</p>
      <p style={{ ...text, margin: 0 }}>{nl ? "Het MyTable team" : "The MyTable team"}</p>
    </EmailLayout>
  );
}

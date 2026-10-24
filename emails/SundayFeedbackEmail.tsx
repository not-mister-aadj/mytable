import { Text } from "@react-email/components";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { CTASection } from "./components/CTASection";
import { emailType } from "./brand";

/** Sunday 20:00, after a Sunday Social: one tap on how the afternoon was. */
export type SundayFeedbackEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  venueName: string;
  feedbackUrl: string;
};

export function SundayFeedbackEmail(p: SundayFeedbackEmailProps) {
  const nl = p.locale !== "en";
  const greeting = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  return (
    <EmailLayout preview={nl ? `Hoe was je middag bij ${p.venueName}? Eén tik is genoeg.` : `How was your afternoon at ${p.venueName}? One tap is enough.`}>
      <EmailHero
        greeting={greeting}
        headline={nl ? "Bedankt voor vanmiddag" : "Thank you for this afternoon"}
        body={
          nl
            ? `Fijn dat je erbij was bij ${p.venueName}. Hoe was het? Eén tik is genoeg, en met je antwoord maken we de volgende zondag nog beter.`
            : `Lovely that you joined us at ${p.venueName}. How was it? One tap is enough, and your answer helps us make the next Sunday even better.`
        }
      />
      <CTASection href={p.feedbackUrl} label={nl ? "Hoe was je middag? →" : "How was your afternoon? →"} />
      <Text style={{ ...emailType.body, margin: "8px 0 0" }}>
        {nl ? "Tot een volgende keer," : "See you next time,"}
        <br />
        MyTable
      </Text>
    </EmailLayout>
  );
}

export default SundayFeedbackEmail;

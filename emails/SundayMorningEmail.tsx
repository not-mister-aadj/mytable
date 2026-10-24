import { Text } from "@react-email/components";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { EmailCard } from "./components/EmailCard";
import { CTASection } from "./components/CTASection";
import { emailType } from "./brand";

/** Sunday morning: our picks are on the table page now. Only the names of
 * the picks are in the mail; the why and the tablemates stay on the page. */
export type SundayMorningEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  groupNumber: number;
  venueName: string;
  time: string;
  /** "Crémant de Loire" and so on. */
  pickNames: string[];
  tableUrl: string;
};

export function SundayMorningEmail(p: SundayMorningEmailProps) {
  const nl = p.locale !== "en";
  const greeting = nl ? `Goedemorgen${p.firstName ? ` ${p.firstName}` : ""},` : `Good morning${p.firstName ? ` ${p.firstName}` : ""},`;
  return (
    <EmailLayout preview={nl ? `Vandaag om ${p.time} bij ${p.venueName}: onze aanraders staan klaar.` : `Today at ${p.time} at ${p.venueName}: our picks are ready.`}>
      <EmailHero
        greeting={greeting}
        headline={nl ? `Vandaag bij ${p.venueName}` : `Today at ${p.venueName}`}
        body={
          nl
            ? `Om ${p.time} staat je tafel klaar, groep ${p.groupNumber}. We hebben bij ${p.venueName} geproefd en met de sommeliers gepraat. Onze aanraders staan nu op je tafelpagina.`
            : `Your table is ready at ${p.time}, group ${p.groupNumber}. We tasted at ${p.venueName} and talked to the sommeliers. Our picks are on your table page now.`
        }
      />
      {p.pickNames.length > 0 ? (
        <EmailCard>
          <Text style={emailType.sectionLabel}>{nl ? "Onze aanraders" : "Our picks"}</Text>
          <Text style={{ ...emailType.body, margin: 0 }}>
            {p.pickNames.map((name, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                {i + 1}. {name}
              </span>
            ))}
          </Text>
        </EmailCard>
      ) : null}
      <CTASection
        helperText={nl ? "Waarom we ze kozen en waar ze bij passen, plus wie er bij je aan tafel zitten." : "Why we chose them and what they go with, plus who's at your table."}
        href={p.tableUrl}
        label={nl ? "Bekijk je tafel →" : "See your table →"}
      />
      <Text style={{ ...emailType.body, margin: "8px 0 0" }}>
        {nl ? "Tot vanmiddag," : "See you this afternoon,"}
        <br />
        MyTable
      </Text>
    </EmailLayout>
  );
}

export default SundayMorningEmail;

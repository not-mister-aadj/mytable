import { Column, Link, Row, Text } from "@react-email/components";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { EmailCard } from "./components/EmailCard";
import { EmailDivider } from "./components/EmailDivider";
import { EmailIcon } from "./components/EmailIcon";
import { CTASection } from "./components/CTASection";
import { emailBrand, emailFonts, emailType } from "./brand";

/** Saturday, the day before a Sunday Social, sent from the Sunday page in
 * admin: the group number to give at the door and a link to the table page
 * (who sits there, our picks). Names stay out of the mail itself, so they
 * are gone once the page closes. */
export type SundaySaturdayEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  plusOneName?: string | null;
  groupNumber: number;
  venueName: string;
  address: string;
  mapsUrl: string;
  time: string;
  /** The guest's own table page. */
  tableUrl: string;
};

export function SundaySaturdayEmail(p: SundaySaturdayEmailProps) {
  const nl = p.locale !== "en";
  const greeting = nl ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},` : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;

  return (
    <EmailLayout
      preview={
        nl
          ? `Morgen om ${p.time} bij ${p.venueName}. Je zit in groep ${p.groupNumber}.`
          : `Tomorrow at ${p.time} at ${p.venueName}. You're in group ${p.groupNumber}.`
      }
    >
      <EmailHero
        greeting={greeting}
        headline={nl ? `Morgen bij ${p.venueName}` : `Tomorrow at ${p.venueName}`}
        body={
          nl
            ? `Om ${p.time} staat je tafel klaar. Wie er bij je aan tafel zitten, zie je via de knop "Bekijk je tafel" onderaan deze mail. Morgenochtend zetten we daar ook onze aanraders van de kaart.`
            : `Your table is ready at ${p.time}. You'll see who's at your table via the "See your table" button at the bottom of this email. Tomorrow morning we'll add our picks from the menu there too.`
        }
      />

      <EmailCard>
        <Text style={emailType.sectionLabel}>{nl ? "Jouw groep" : "Your group"}</Text>
        <Text style={{ fontFamily: emailFonts.serif, fontSize: "40px", lineHeight: "44px", color: emailBrand.burgundy, margin: "0 0 8px" }}>
          {nl ? `Groep ${p.groupNumber}` : `Group ${p.groupNumber}`}
        </Text>
        <Text style={{ ...emailType.body, margin: "0 0 14px" }}>
          {nl
            ? `Zeg bij binnenkomst dat je bij MyTable hoort, groep ${p.groupNumber}. Dan wijst het team van ${p.venueName} je je tafel.`
            : `When you arrive, say you're with MyTable, group ${p.groupNumber}. The ${p.venueName} team will show you to your table.`}
          {p.plusOneName ? (nl ? ` ${p.plusOneName} zit natuurlijk naast je.` : ` ${p.plusOneName} sits with you, of course.`) : ""}
        </Text>
        <EmailDivider spacing="14px" />
        <Row>
          <Column style={{ width: "24px", verticalAlign: "top", paddingTop: "1px" }}>
            <EmailIcon name="pin" size={17} alt="" inline />
          </Column>
          <Column style={{ verticalAlign: "top" }}>
            <Text style={emailType.label}>{nl ? "Adres" : "Address"}</Text>
            <Text style={emailType.value}>
              <Link href={p.mapsUrl} style={{ color: emailBrand.burgundy, textDecoration: "underline" }}>
                {p.address}
              </Link>
            </Text>
          </Column>
        </Row>
      </EmailCard>

      <CTASection
        href={p.tableUrl}
        label={nl ? "Bekijk je tafel →" : "See your table →"}
      />

      <Text style={{ ...emailType.body, margin: "8px 0 0" }}>
        {nl ? "Tot morgen," : "See you tomorrow,"}
        <br />
        MyTable
      </Text>
    </EmailLayout>
  );
}

export default SundaySaturdayEmail;

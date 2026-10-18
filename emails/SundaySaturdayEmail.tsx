import { Column, Link, Row, Section, Text } from "@react-email/components";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { EmailCard } from "./components/EmailCard";
import { EmailDivider } from "./components/EmailDivider";
import { EmailIcon } from "./components/EmailIcon";
import { emailBrand, emailFonts, emailType } from "./brand";

/** Saturday, the day before a Sunday Social, sent from the Sunday page in
 * admin: the group number to give at the door, who sits at the table (with
 * what they agreed to share) and our picks from the menu. */
export type SundayTablemate = {
  name: string;
  /** "komt met Petra": someone's +1. */
  withName?: string;
  /** Only what they agreed to share; null when nothing. */
  answers: { askMeAbout?: string; favoriteSpot?: string; wine?: "red" | "white" | "bubbles"; intoNow?: string } | null;
};

export type SundaySaturdayEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  plusOneName?: string | null;
  groupNumber: number;
  venueName: string;
  address: string;
  mapsUrl: string;
  time: string;
  tablemates: SundayTablemate[];
  /** Our picks from the menu, one per line. */
  picks: string[];
  /** Personal link to see or change their own answers. */
  introUrl: string;
};

const WINE = { red: { nl: "Rood", en: "Red" }, white: { nl: "Wit", en: "White" }, bubbles: { nl: "Bubbels", en: "Bubbles" } };

function Mate({ m, nl, last }: { m: SundayTablemate; nl: boolean; last: boolean }) {
  const a = m.answers;
  const rows: Array<[string, string]> = [];
  if (a?.askMeAbout) rows.push([nl ? "Vraag me naar" : "Ask me about", a.askMeAbout]);
  if (a?.intoNow) rows.push([nl ? "Nu bezig met" : "Into right now", a.intoNow]);
  if (a?.favoriteSpot) rows.push([nl ? "Favoriete plek" : "Favourite spot", a.favoriteSpot]);
  if (a?.wine) rows.push([nl ? "Drinkt het liefst" : "Drinks", WINE[a.wine][nl ? "nl" : "en"]]);
  return (
    <Section
      style={{
        margin: last ? 0 : "0 0 14px",
        paddingBottom: last ? 0 : "14px",
        borderBottom: last ? "none" : `1px solid ${emailBrand.divider}`,
      }}
    >
      <Text style={{ ...emailType.body, margin: "0 0 4px", fontWeight: 600, color: emailBrand.burgundy }}>
        {m.name}
        {m.withName ? <span style={{ fontWeight: 400 }}>{nl ? ` (komt met ${m.withName})` : ` (with ${m.withName})`}</span> : null}
      </Text>
      {rows.length > 0 ? (
        rows.map(([label, value]) => (
          <Text key={label} style={{ ...emailType.body, margin: "0 0 2px", fontSize: "15px" }}>
            <span style={{ opacity: 0.65 }}>{label}: </span>
            {value}
          </Text>
        ))
      ) : (
        <Text style={{ ...emailType.body, margin: 0, fontSize: "15px", opacity: 0.65 }}>
          {nl ? "Leer je morgen kennen." : "You'll meet tomorrow."}
        </Text>
      )}
    </Section>
  );
}

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
            ? `Om ${p.time} staat je tafel klaar. Hieronder lees je in welke groep je zit, wie er bij je aan tafel zitten en wat wij van de kaart aanraden.`
            : `Your table is ready at ${p.time}. Below you'll find your group, who's at your table and what we recommend from the menu.`
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

      <EmailCard>
        <Text style={emailType.sectionLabel}>{nl ? "Aan jouw tafel" : "At your table"}</Text>
        {p.tablemates.length > 0 ? (
          <>
            <Text style={{ ...emailType.body, margin: "0 0 16px" }}>
              {nl ? "Dit vertelden je tafelgenoten over zichzelf." : "This is what your tablemates shared about themselves."}
              {p.plusOneName ? (nl ? ` ${p.plusOneName} zit natuurlijk naast je.` : ` ${p.plusOneName} sits with you, of course.`) : ""}
            </Text>
            {p.tablemates.map((m, i) => (
              <Mate key={`${m.name}-${i}`} m={m} nl={nl} last={i === p.tablemates.length - 1} />
            ))}
          </>
        ) : (
          <Text style={{ ...emailType.body, margin: 0 }}>{nl ? "Je leert je tafelgenoten morgen kennen." : "You'll meet your tablemates tomorrow."}</Text>
        )}
        <Text style={{ ...emailType.body, margin: "16px 0 0", fontSize: "15px" }}>
          <Link href={p.introUrl} style={{ color: emailBrand.burgundy, textDecoration: "underline" }}>
            {nl ? "Bekijk of pas aan wat jij over jezelf vertelde" : "See or change what you shared about yourself"}
          </Link>
        </Text>
      </EmailCard>

      {p.picks.length > 0 ? (
        <EmailCard>
          <Text style={emailType.sectionLabel}>{nl ? "Onze aanraders" : "Our picks"}</Text>
          <Text style={{ ...emailType.body, margin: "0 0 12px" }}>
            {p.picks.map((pick, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}· {pick}
              </span>
            ))}
          </Text>
          <Text style={{ ...emailType.body, margin: 0, fontSize: "15px", opacity: 0.75 }}>
            {nl
              ? `Wat je drinkt en eet, bestel en betaal je zelf. Het team van ${p.venueName} helpt je ook graag kiezen.`
              : `You order and pay for your own drinks and food. The ${p.venueName} team is happy to help you choose too.`}
          </Text>
        </EmailCard>
      ) : null}

      <Text style={{ ...emailType.body, margin: "8px 0 0" }}>
        {nl ? "Tot morgen," : "See you tomorrow,"}
        <br />
        MyTable
      </Text>
    </EmailLayout>
  );
}

export default SundaySaturdayEmail;

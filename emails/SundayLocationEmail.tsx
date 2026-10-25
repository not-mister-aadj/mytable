import { Column, Link, Row, Section, Text } from "@react-email/components";
import { EmailIcon } from "./components/EmailIcon";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { EmailCard } from "./components/EmailCard";
import { EmailDivider } from "./components/EmailDivider";
import { CityRow, LocationRow } from "./components/InfoGrid4";
import { emailBrand, emailFonts, emailRadii, emailType } from "./brand";

/** A week before a Sunday Social, sent from the Sunday page in admin: where
 * it is, how the afternoon goes, what follows on Saturday, and a one-click
 * link to the questions (to fill in, or to change). */
export type SundayLocationEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  plusOneName?: string | null;
  dateLabel: string;
  time: string;
  venueName: string;
  /** Neighbourhood, e.g. "Kralingen"; left out when unknown. */
  area: string | null;
  /** One sentence about the venue, from its description; optional. */
  venueIntro?: string | null;
  city: string;
  address: string;
  /** "Een paar minuten lopen van ...", in the mail's language; optional. */
  transit?: string | null;
  mapsUrl: string;
  /** Their personal questions page (one-click, signed link). */
  introUrl: string;
  /** True when the open questions are already filled in. */
  answered: boolean;
  /** "MT-…": the form behind introUrl asks for it, with the booking email. */
  bookingCode?: string;
  /** Booked after the location mail went out: this is their confirmation. */
  booked?: boolean;
  email?: string;
};

/** LocationRow with the address as a Google Maps link. */
function AddressRow({ label, address, href }: { label: string; address: string; href: string }) {
  return (
    <Row style={{ marginBottom: "14px" }}>
      <Column style={{ width: "24px", verticalAlign: "top", paddingTop: "1px" }}>
        <EmailIcon name="pin" size={17} alt={label} inline />
      </Column>
      <Column style={{ verticalAlign: "top" }}>
        <Text style={emailType.label}>{label}</Text>
        <Text style={emailType.value}>
          <Link href={href} style={{ color: emailBrand.burgundy, textDecoration: "underline" }}>
            {address}
          </Link>
        </Text>
      </Column>
    </Row>
  );
}

const stepNumber = {
  display: "inline-block",
  width: "26px",
  height: "26px",
  lineHeight: "26px",
  borderRadius: "50%",
  backgroundColor: emailBrand.iconCircle,
  color: emailBrand.burgundy,
  fontFamily: emailFonts.sans,
  fontSize: "13px",
  fontWeight: 600,
  textAlign: "center" as const,
};

function Step({ n, title, body, last }: { n: number; title: string; body: string; last?: boolean }) {
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ margin: last ? 0 : "0 0 16px" }}>
      <tbody>
        <tr>
          <td width="40" valign="top">
            <span style={stepNumber}>{n}</span>
          </td>
          <td valign="top">
            <Text style={{ ...emailType.body, margin: "0 0 2px", fontWeight: 600, color: emailBrand.burgundy }}>{title}</Text>
            <Text style={{ ...emailType.body, margin: 0 }}>{body}</Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function SundayLocationEmail(p: SundayLocationEmailProps) {
  const nl = p.locale !== "en";
  const greeting = nl
    ? `Hoi${p.firstName ? ` ${p.firstName}` : ""},`
    : `Hi${p.firstName ? ` ${p.firstName}` : ""},`;
  const withPlusOne = Boolean(p.plusOneName);

  return (
    <EmailLayout
      preview={
        nl
          ? p.booked
            ? `Je plek staat: ${p.dateLabel} om ${p.time} bij ${p.venueName}${p.area ? ` in ${p.area}` : ""}.`
            : `Volgende week zondag om ${p.time}: je Sunday Social is bij ${p.venueName}${p.area ? ` in ${p.area}` : ""}.`
          : p.booked
            ? `You're booked: ${p.dateLabel} at ${p.time} at ${p.venueName}${p.area ? ` in ${p.area}` : ""}.`
            : `Next Sunday at ${p.time}: your Sunday Social is at ${p.venueName}${p.area ? ` in ${p.area}` : ""}.`
      }
    >
      <EmailHero
        greeting={greeting}
        headline={
          p.booked
            ? nl
              ? `Je plek staat, tot zondag bij ${p.venueName}`
              : `You're booked, see you Sunday at ${p.venueName}`
            : nl
              ? `Volgende week zondag bij ${p.venueName}`
              : `Next Sunday at ${p.venueName}`
        }
        body={
          nl
            ? `We hebben er zin in. Je Sunday Social is bij ${p.venueName}${p.area ? ` in ${p.area}` : ""}.${p.venueIntro ? ` ${p.venueIntro}` : ""} Hieronder lees je waar je moet zijn en hoe de middag gaat.`
            : `We're looking forward to it. Your Sunday Social is at ${p.venueName}${p.area ? ` in ${p.area}` : ""}.${p.venueIntro ? ` ${p.venueIntro}` : ""} Below you'll find where to go and how the afternoon works.`
        }
      />

      <EmailCard>
        <Text style={emailType.sectionLabel}>{nl ? "Waar en wanneer" : "Where and when"}</Text>
        <Text
          style={{
            fontFamily: emailFonts.serif,
            fontSize: "22px",
            lineHeight: "28px",
            color: emailBrand.burgundy,
            margin: "0 0 6px",
          }}
        >
          {p.venueName}
        </Text>
        <CityRow city={p.city} />
        <EmailDivider spacing="18px" />
        <LocationRow icon="calendar" label={nl ? "Datum" : "Date"} value={`${p.dateLabel} · ${p.time}`} />
        <AddressRow label={nl ? "Adres" : "Address"} address={p.address} href={p.mapsUrl} />
        {p.transit ? <LocationRow icon="flag" label={nl ? "Bereikbaarheid" : "Getting there"} value={p.transit} /> : null}
        <LocationRow
          icon="people"
          label={nl ? "Je ticket" : "Your ticket"}
          value={
            withPlusOne
              ? nl
                ? `2 plekken, voor jou en ${p.plusOneName}`
                : `2 seats, for you and ${p.plusOneName}`
              : nl
                ? "1 plek aan tafel"
                : "1 seat at the table"
          }
          isLast
        />
      </EmailCard>

      <EmailCard>
        <Text style={emailType.sectionLabel}>{nl ? "Je hoort nog van ons" : "You'll hear from us again"}</Text>
        <Text style={{ ...emailType.body, margin: "0 0 12px" }}>
          {nl ? "Zaterdag, de dag ervoor, krijg je nog een mail met:" : "On Saturday, the day before, you'll get one more email with:"}
        </Text>
        <Text style={{ ...emailType.body, margin: "0 0 16px" }}>
          {nl ? "· je groepsnummer, dat je bij binnenkomst zegt" : "· your group number, which you give when you arrive"}
          <br />
          {nl ? "· wie er bij je aan tafel zitten, met wat ze over zichzelf vertellen" : "· who's at your table, with what they shared about themselves"}
          <br />
          {nl ? `· onze aanraders van de kaart van ${p.venueName}` : `· our picks from the ${p.venueName} menu`}
        </Text>
        {!p.answered ? (
          <>
            <EmailDivider spacing="16px" />
            <Text style={{ ...emailType.body, margin: "0 0 14px" }}>
              {nl
                ? "Jij hebt de vragen over jezelf nog niet ingevuld. Doe je dat voor die mail, dan lezen je tafelgenoten ook iets over jou, en houden we bij het indelen rekening met je antwoorden. Het kost je een minuut."
                : "You haven't answered the questions about yourself yet. If you do before that email, your tablemates get to read about you too, and we take your answers into account when we seat everyone. It takes a minute."}
            </Text>
            {p.bookingCode ? (
              <Text style={{ ...emailType.body, margin: "0 0 18px" }}>
                {nl ? "Je hebt hiervoor nodig:" : "You'll need:"}
                <br />
                {nl ? "Boekingsnummer: " : "Booking number: "}
                <strong>{p.bookingCode}</strong>
                {p.email ? (
                  <>
                    <br />
                    {nl ? "E-mailadres: " : "Email: "}
                    <strong>{p.email}</strong>
                  </>
                ) : null}
              </Text>
            ) : null}
            <Section>
              <Link
                href={p.introUrl}
                style={{
                  display: "inline-block",
                  padding: "13px 22px",
                  borderRadius: emailRadii.pill,
                  backgroundColor: emailBrand.burgundy,
                  color: "#ffffff",
                  fontFamily: emailFonts.sans,
                  fontSize: "15px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {nl ? "Vul je vragen in →" : "Answer the questions →"}
              </Link>
            </Section>
          </>
        ) : (
          <>
            <EmailDivider spacing="16px" />
            <Text style={{ ...emailType.body, margin: "0 0 18px" }}>
              {nl
                ? "Je hebt de vragen over jezelf al ingevuld, dus je tafelgenoten lezen in die mail ook iets over jou. Wil je nog iets aanpassen? Dat kan tot die mail."
                : "You've already answered the questions about yourself, so your tablemates will read about you in that email too. Want to change something? You can until then."}
            </Text>
            <Section>
              <Link
                href={p.introUrl}
                style={{
                  display: "inline-block",
                  padding: "12px 20px",
                  borderRadius: emailRadii.pill,
                  border: `1px solid ${emailBrand.burgundy}`,
                  color: emailBrand.burgundy,
                  fontFamily: emailFonts.sans,
                  fontSize: "15px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {nl ? "Bekijk je antwoorden →" : "See your answers →"}
              </Link>
            </Section>
          </>
        )}
      </EmailCard>

      <EmailCard>
        <Text style={emailType.sectionLabel}>{nl ? "Zo ziet je middag eruit" : "How the afternoon goes"}</Text>
        <Step
          n={1}
          title={nl ? `Kom om ${p.time} binnen` : `Arrive at ${p.time}`}
          body={
            nl
              ? `Zeg bij binnenkomst je groepsnummer. Het team van ${p.venueName} wijst je je tafel.`
              : `Give your group number when you arrive. The ${p.venueName} team will show you to your table.`
          }
        />
        <Step
          n={2}
          title={nl ? "Schuif aan bij je tafel" : "Join your table"}
          body={
            nl
              ? "Je zit met vier tot zes mensen van je leeftijd. We hebben meerdere tafels gereserveerd en delen iedereen zelf in."
              : "You'll sit with four to six people your age. We've reserved several tables and put everyone together ourselves."
          }
        />
        <Step
          n={3}
          title={nl ? "Kies een glas van de kaart" : "Pick a glass from the menu"}
          body={
            nl
              ? `Kies uit onze aanraders, of laat het team van ${p.venueName} je helpen. Je bestelt en betaalt zelf.`
              : `Choose from our picks, or let the ${p.venueName} team help you. You order and pay yourself.`
          }
        />
        <Step
          n={4}
          title={nl ? "Blijf zo lang je wilt" : "Stay as long as you like"}
          body={nl ? "Reken op twee tot drie uur. Of langer, als het klikt." : "Count on two to three hours. Or longer, if it clicks."}
          last
        />
      </EmailCard>

      <Text style={{ ...emailType.body, margin: "8px 0 0" }}>
        {nl ? "Tot zondag," : "See you Sunday,"}
        <br />
        MyTable
      </Text>
    </EmailLayout>
  );
}

export default SundayLocationEmail;

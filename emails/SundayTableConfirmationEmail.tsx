import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { EmailCard } from "./components/EmailCard";
import { EmailDivider } from "./components/EmailDivider";
import { CityRow, InfoGrid4 } from "./components/InfoGrid4";
import { InfoList } from "./components/InfoList";
import { CTASection } from "./components/CTASection";
import { Text } from "@react-email/components";
import { emailBrand, emailFonts, emailType } from "./brand";

export type SundayTableConfirmationEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
  date: string;
  time: string;
  tableType: "girls_only" | "mixed";
  plusOne?: boolean;
  clubmemberUrl: string;
  /** Download .ics / add to calendar */
  calendarUrl: string;
};

export function SundayTableConfirmationEmail({
  locale,
  firstName,
  city,
  date,
  time,
  tableType,
  plusOne = false,
  calendarUrl,
}: SundayTableConfirmationEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName
    ? nl
      ? `Hoi ${firstName},`
      : `Hi ${firstName},`
    : nl
      ? "Hoi,"
      : "Hi,";

  const tableLabel =
    tableType === "girls_only"
      ? "Girls only"
      : nl
        ? "Gemengd"
        : "Mixed";

  const seatsLabel = plusOne
    ? nl
      ? "Jij + 1"
      : "You + 1"
    : nl
      ? "1 plek"
      : "1 seat";

  return (
    <EmailLayout
      preview={
        nl
          ? `Je Sunday Table in ${city} staat klaar.`
          : `Your Sunday Table in ${city} is confirmed.`
      }
    >
      <EmailHero
        greeting={greeting}
        headline={nl ? "Je plek is van jou" : "Your seat is secured"}
        body={
          nl
            ? "Je Sunday Table staat bevestigd. Zet hem meteen in je agenda. Wij zorgen voor de tafel, jij komt opdagen."
            : "Your Sunday Table is confirmed. Add it to your calendar now. We set the table. You show up."
        }
        warmLine={
          nl
            ? "Goede smaak. Goed gezelschap."
            : "Good taste. Good company."
        }
      />

      <EmailCard>
        <Text style={emailType.sectionLabel}>
          {nl ? "Jouw Sunday Table" : "Your Sunday Table"}
        </Text>
        <Text
          style={{
            fontFamily: emailFonts.serif,
            fontSize: "22px",
            lineHeight: "28px",
            color: emailBrand.burgundy,
            margin: "0 0 6px",
          }}
        >
          Sunday Table
        </Text>
        <CityRow city={city} />

        <EmailDivider spacing="18px" />

        <InfoGrid4
          items={[
            {
              icon: "calendar",
              label: nl ? "Datum" : "Date",
              value: date,
            },
            {
              icon: "clock",
              label: nl ? "Tijd" : "Time",
              value: time,
            },
            {
              icon: "people",
              label: nl ? "Tafel" : "Table",
              value: tableLabel,
            },
            {
              icon: "card",
              label: nl ? "Plekken" : "Seats",
              value: seatsLabel,
            },
          ]}
        />
      </EmailCard>

      <InfoList
        heading={nl ? "Zo werkt het" : "How it works"}
        items={[
          {
            icon: "people",
            title: nl ? "Nieuwe mensen" : "New people",
            description: nl
              ? "Je schuift aan met mensen die je nog niet kent. De host houdt het gesprek licht."
              : "You sit with people you don’t know yet. The host keeps conversation easy.",
          },
          {
            icon: "utensils",
            title: nl ? "Exacte locatie" : "Exact location",
            description: nl
              ? "De exacte locatie krijg je 24 uur van tevoren. Drankjes en hapjes betaal je op locatie."
              : "You’ll get the exact location 24 hours beforehand. Drinks and bites are paid on location.",
          },
          {
            icon: "mail",
            title: nl ? "24 uur van tevoren" : "24 hours before",
            description: nl
              ? "We mailen je het adres en praktische tips. Tot die tijd staat je plek al vast."
              : "We’ll email you the address and practical tips. Until then, your seat is already secured.",
          },
        ]}
      />

      <CTASection
        helperText={
          nl
            ? "Zet Sunday Table meteen in je agenda."
            : "Add Sunday Table to your calendar now."
        }
        href={calendarUrl}
        label={nl ? "Zet in je agenda →" : "Add to calendar →"}
      />
    </EmailLayout>
  );
}

export default SundayTableConfirmationEmail;

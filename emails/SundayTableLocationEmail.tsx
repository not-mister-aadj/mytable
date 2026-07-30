import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { EmailCard } from "./components/EmailCard";
import { EmailDivider } from "./components/EmailDivider";
import { CityRow, LocationRow } from "./components/InfoGrid4";
import { CTASection } from "./components/CTASection";
import { Text } from "@react-email/components";
import { emailBrand, emailFonts, emailType } from "./brand";

export type SundayTableLocationEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
  date: string;
  time: string;
  tableType: "girls_only" | "mixed";
  venueName: string;
  address: string;
  notes?: string | null;
  calendarUrl: string;
};

export function SundayTableLocationEmail({
  locale,
  firstName,
  city,
  date,
  time,
  tableType,
  venueName,
  address,
  notes,
  calendarUrl,
}: SundayTableLocationEmailProps) {
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

  return (
    <EmailLayout
      preview={
        nl
          ? `Je locatie voor Sunday Table in ${city}`
          : `Your Sunday Table location in ${city}`
      }
    >
      <EmailHero
        greeting={greeting}
        headline={nl ? "Morgen zien we je" : "See you tomorrow"}
        body={
          nl
            ? "Hier is de exacte locatie voor je Sunday Table. Zet hem in je agenda als je dat nog niet deed."
            : "Here’s the exact location for your Sunday Table. Add it to your calendar if you haven’t already."
        }
        warmLine={
          nl
            ? "Kom op tijd. De rest regelen wij."
            : "Arrive on time. We’ll handle the rest."
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
          {venueName}
        </Text>
        <CityRow city={city} />

        <EmailDivider spacing="18px" />

        <LocationRow
          icon="calendar"
          label={nl ? "Datum" : "Date"}
          value={`${date} · ${time}`}
        />
        <LocationRow
          icon="people"
          label={nl ? "Tafel" : "Table"}
          value={tableLabel}
        />
        <LocationRow
          icon="pin"
          label={nl ? "Adres" : "Address"}
          value={address}
          isLast={!notes?.trim()}
        />
        {notes?.trim() ? (
          <LocationRow
            icon="mail"
            label={nl ? "Tip" : "Note"}
            value={notes.trim()}
            isLast
          />
        ) : null}
      </EmailCard>

      <CTASection
        helperText={
          nl
            ? "Handig voor onderweg: zet Sunday Table in je agenda."
            : "Handy on the go: add Sunday Table to your calendar."
        }
        href={calendarUrl}
        label={nl ? "Zet in je agenda →" : "Add to calendar →"}
      />
    </EmailLayout>
  );
}

export default SundayTableLocationEmail;

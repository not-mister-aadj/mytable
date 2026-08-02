import { Text } from "@react-email/components";
import { BookingSummaryCard } from "./components/BookingSummaryCard";
import { CTASection } from "./components/CTASection";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { emailType } from "./brand";

export type SundayTablePlusOneEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
  date: string;
  time: string;
  tableType: "girls_only" | "mixed";
  /** Whether the +1 was just added or removed. */
  action: "added" | "removed";
  clubmemberUrl: string;
};

export function SundayTablePlusOneEmail({
  locale,
  firstName,
  city,
  date,
  time,
  tableType,
  action,
  clubmemberUrl,
}: SundayTablePlusOneEmailProps) {
  const nl = locale !== "en";
  const added = action === "added";
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

  const seatsLabel = added
    ? nl
      ? "Jij + 1"
      : "You + 1"
    : nl
      ? "1 plek"
      : "1 seat";

  return (
    <EmailLayout
      preview={
        added
          ? nl
            ? `+1 toegevoegd voor Sunday Table in ${city}.`
            : `+1 added for Sunday Table in ${city}.`
          : nl
            ? `+1 verwijderd voor Sunday Table in ${city}.`
            : `+1 removed for Sunday Table in ${city}.`
      }
      showTagline={false}
    >
      <EmailHero
        greeting={greeting}
        headline={
          added
            ? nl
              ? "+1 toegevoegd"
              : "+1 added"
            : nl
              ? "+1 verwijderd"
              : "+1 removed"
        }
        body={
          added
            ? nl
              ? "Je neemt iemand mee. Die tweede plek telt mee aan tafel, zonder extra kosten. Kan diegene toch niet? Meld de +1 dan op tijd af, zodat iemand anders die stoel kan claimen."
              : "You are bringing someone. That second seat counts at the table, at no extra cost. If they cannot make it after all, please remove the +1 in time so someone else can take that seat."
            : nl
              ? "Je +1 is verwijderd. Je Sunday Table-RSVP blijft staan voor jou alleen."
              : "Your +1 was removed. Your Sunday Table RSVP stays for you alone."
        }
      />

      <BookingSummaryCard
        title={nl ? "Jouw Sunday Table" : "Your Sunday Table"}
        eventName="Sunday Table"
        city={city}
        rows={[
          { label: nl ? "Datum" : "Date", value: date },
          { label: nl ? "Tijd" : "Time", value: time },
          { label: nl ? "Tafel" : "Table", value: tableLabel },
          { label: nl ? "Plekken" : "Seats", value: seatsLabel },
        ]}
      />

      <Text
        style={{
          ...emailType.bodySmall,
          margin: "0 0 8px",
          textAlign: "center",
        }}
      >
        {added
          ? nl
            ? "Afmelden kan tot de RSVP-sluiting in je Clubmember-hub."
            : "You can remove the +1 until RSVP closes in your Clubmember hub."
          : nl
            ? "Wil je later toch iemand meenemen? Voeg opnieuw een +1 toe in je Clubmember-hub."
            : "Want to bring someone later? Add a +1 again in your Clubmember hub."}
      </Text>

      <CTASection
        helperText={
          nl
            ? "Beheer je RSVP en +1 in Clubmember."
            : "Manage your RSVP and +1 in Clubmember."
        }
        href={clubmemberUrl}
        label={nl ? "Naar Clubmember →" : "Open Clubmember →"}
      />
    </EmailLayout>
  );
}

export default SundayTablePlusOneEmail;

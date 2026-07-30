import { Text } from "@react-email/components";
import { BookingSummaryCard } from "./components/BookingSummaryCard";
import { CTASection } from "./components/CTASection";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { emailType } from "./brand";

export type SundayTableCancelEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
  date: string;
  time: string;
  tableType: "girls_only" | "mixed";
  clubmemberUrl: string;
};

export function SundayTableCancelEmail({
  locale,
  firstName,
  city,
  date,
  time,
  tableType,
  clubmemberUrl,
}: SundayTableCancelEmailProps) {
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
          ? `Je Sunday Table in ${city} is geannuleerd.`
          : `Your Sunday Table in ${city} was cancelled.`
      }
      showTagline={false}
    >
      <EmailHero
        greeting={greeting}
        headline={nl ? "Plek vrijgegeven" : "Seat released"}
        body={
          nl
            ? "Je RSVP voor Sunday Table is geannuleerd. Je plek is weer vrij voor iemand anders."
            : "Your Sunday Table RSVP was cancelled. Your seat is free again for someone else."
        }
      />

      <BookingSummaryCard
        title={nl ? "Geannuleerde tafel" : "Cancelled table"}
        muted
        eventName="Sunday Table"
        city={city}
        rows={[
          { label: nl ? "Datum" : "Date", value: date },
          { label: nl ? "Tijd" : "Time", value: time },
          { label: nl ? "Tafel" : "Table", value: tableLabel },
        ]}
      />

      <Text
        style={{
          ...emailType.bodySmall,
          margin: "0 0 8px",
          textAlign: "center",
        }}
      >
        {nl
          ? "Van gedachten veranderd? Zolang er plek is, kun je opnieuw reserveren."
          : "Changed your mind? While seats remain, you can reserve again."}
      </Text>

      <CTASection
        helperText={
          nl
            ? "Bekijk open Sunday Tables in je Clubmember-hub."
            : "See open Sunday Tables in your Clubmember hub."
        }
        href={clubmemberUrl}
        label={nl ? "Naar Clubmember →" : "Open Clubmember →"}
      />
    </EmailLayout>
  );
}

export default SundayTableCancelEmail;

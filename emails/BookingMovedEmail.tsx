import { Text } from "@react-email/components";
import { BookingSummaryCard } from "./components/BookingSummaryCard";
import { CTASection } from "./components/CTASection";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { emailType } from "./brand";

export type BookingMovedEmailProps = {
  locale?: "nl" | "en";
  customerName?: string;
  customerEmail: string;
  oldEventName: string;
  oldCity: string;
  oldDate: string;
  oldTime: string;
  newEventName: string;
  newCity: string;
  newDate: string;
  newTime: string;
  seats: number;
  bookingCode: string;
  eventUrl: string;
};

export function BookingMovedEmail({
  locale = "nl",
  customerName,
  oldEventName,
  oldCity,
  oldDate,
  oldTime,
  newEventName,
  newCity,
  newDate,
  newTime,
  seats,
  bookingCode,
  eventUrl,
}: BookingMovedEmailProps) {
  const en = locale === "en";
  const greeting = customerName
    ? en
      ? `Hi ${customerName},`
      : `Hoi ${customerName},`
    : en
      ? "Hi,"
      : "Hoi,";
  const seatsLabel = en
    ? seats === 1
      ? "1 seat"
      : `${seats} seats`
    : seats === 1
      ? "1 plek"
      : `${seats} plekken`;

  return (
    <EmailLayout
      preview={
        en
          ? "Your new table details are below."
          : "Je nieuwe tafelgegevens staan hieronder."
      }
      showTagline={false}
    >
      <EmailHero
        greeting={greeting}
        headline={en ? "Your booking was moved" : "Je boeking is verplaatst"}
        body={
          en
            ? "We updated your booking. Your new table details are below."
            : "We hebben je boeking aangepast. Hieronder vind je je nieuwe tafelgegevens."
        }
      />

      <BookingSummaryCard
        title={en ? "Previous table" : "Vorige tafel"}
        muted
        eventName={oldEventName}
        city={oldCity}
        rows={[
          { label: en ? "Date" : "Datum", value: oldDate },
          { label: en ? "Time" : "Tijd", value: oldTime },
        ]}
      />

      <BookingSummaryCard
        title={en ? "New table" : "Nieuwe tafel"}
        eventName={newEventName}
        city={newCity}
        rows={[
          { label: en ? "Date" : "Datum", value: newDate },
          { label: en ? "Time" : "Tijd", value: newTime },
          { label: en ? "Seats" : "Plekken", value: seatsLabel },
          { label: en ? "Booking code" : "Boekingscode", value: bookingCode },
        ]}
      />

      <Text
        style={{
          ...emailType.bodySmall,
          margin: "0 0 24px",
          textAlign: "center",
        }}
      >
        {en
          ? "You do not need to do anything else. Your seat moved with you to the new table."
          : "Je hoeft verder niets te doen. Je plek is automatisch meegenomen naar de nieuwe tafel."}
      </Text>

      <CTASection
        helperText={
          en
            ? "See your new table details."
            : "Bekijk je nieuwe tafelgegevens."
        }
        href={eventUrl}
        label={en ? "View your new table" : "Bekijk je nieuwe tafel"}
      />
    </EmailLayout>
  );
}

export default BookingMovedEmail;

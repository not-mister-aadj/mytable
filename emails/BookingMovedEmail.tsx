import { Text } from "@react-email/components";
import { BookingSummaryCard } from "./components/BookingSummaryCard";
import { CTASection } from "./components/CTASection";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { emailBrand, emailType } from "./brand";

export type BookingMovedEmailProps = {
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
  const greeting = customerName ? `Hoi ${customerName},` : "Hoi,";
  const seatsLabel = seats === 1 ? "1 plek" : `${seats} plekken`;

  return (
    <EmailLayout preview="Je nieuwe tafelgegevens staan hieronder." showTagline={false}>
      <EmailHero
        greeting={greeting}
        headline="Je boeking is verplaatst"
        body="We hebben je boeking aangepast. Hieronder vind je je nieuwe tafelgegevens."
      />

      <BookingSummaryCard
        title="Vorige tafel"
        muted
        eventName={oldEventName}
        city={oldCity}
        rows={[
          { label: "Datum", value: oldDate },
          { label: "Tijd", value: oldTime },
        ]}
      />

      <BookingSummaryCard
        title="Nieuwe tafel"
        eventName={newEventName}
        city={newCity}
        rows={[
          { label: "Datum", value: newDate },
          { label: "Tijd", value: newTime },
          { label: "Plekken", value: seatsLabel },
          { label: "Boekingscode", value: bookingCode },
        ]}
      />

      <Text
        style={{
          ...emailType.bodySmall,
          margin: "0 0 24px",
          textAlign: "center",
        }}
      >
        Je hoeft verder niets te doen. Je plek is automatisch meegenomen naar de
        nieuwe tafel.
      </Text>

      <CTASection
        helperText="Bekijk je nieuwe tafelgegevens."
        href={eventUrl}
        label="Bekijk je nieuwe tafel"
      />
    </EmailLayout>
  );
}

export default BookingMovedEmail;

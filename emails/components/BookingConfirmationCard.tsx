import { Section, Text } from "@react-email/components";
import { emailBrand, emailFonts, emailType } from "../brand";
import { BookingCode } from "./BookingCode";
import { EmailCard } from "./EmailCard";
import { EmailDivider } from "./EmailDivider";
import { CityRow, InfoGrid4, LocationRow } from "./InfoGrid4";

export type BookingConfirmationCardProps = {
  locale?: "nl" | "en";
  eventName: string;
  city: string;
  date: string;
  time: string;
  seatsLabel: string;
  totalPaid: string;
  bookingCode: string;
  venueName?: string;
  startLocation?: string;
  dietaryNotes?: string;
};

export function BookingConfirmationCard({
  locale = "nl",
  eventName,
  city,
  date,
  time,
  seatsLabel,
  totalPaid,
  bookingCode,
  venueName,
  startLocation,
  dietaryNotes,
}: BookingConfirmationCardProps) {
  const en = locale === "en";
  const trimmedDietary = dietaryNotes?.trim();
  const hasLocation = Boolean(venueName || startLocation);
  const hasDetails = hasLocation || trimmedDietary;

  return (
    <EmailCard>
      <Text style={emailType.sectionLabel}>
        {en ? "Your table" : "Jouw tafel"}
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
        {eventName}
      </Text>
      <CityRow city={city} />

      <EmailDivider spacing="18px" />

      <InfoGrid4
        items={[
          { icon: "calendar", label: en ? "Date" : "Datum", value: date },
          { icon: "clock", label: en ? "Time" : "Tijd", value: time },
          { icon: "people", label: en ? "Seats" : "Plekken", value: seatsLabel },
          { icon: "card", label: en ? "Paid" : "Betaald", value: totalPaid },
        ]}
      />

      {hasDetails ? (
        <>
          <EmailDivider spacing="18px" />
          <Section>
            {venueName ? (
              <LocationRow
                icon="utensils"
                label={en ? "Location" : "Locatie"}
                value={venueName}
                isLast={!startLocation && !trimmedDietary}
              />
            ) : null}
            {startLocation ? (
              <LocationRow
                icon="flag"
                label={en ? "Meeting point" : "Startpunt"}
                value={startLocation}
                isLast={!trimmedDietary}
              />
            ) : null}
            {trimmedDietary ? (
              <LocationRow
                icon="leaf"
                label={en ? "Dietary notes" : "Dieetwensen"}
                value={trimmedDietary}
                isLast
              />
            ) : null}
          </Section>
        </>
      ) : null}

      <EmailDivider spacing="18px" />
      <BookingCode code={bookingCode} locale={locale} />
    </EmailCard>
  );
}

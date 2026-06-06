import { Section, Text } from "@react-email/components";
import { emailBrand, emailFonts, emailType } from "../brand";
import { BookingCode } from "./BookingCode";
import { EmailCard } from "./EmailCard";
import { EmailDivider } from "./EmailDivider";
import { CityRow, InfoGrid4, LocationRow } from "./InfoGrid4";

export type BookingConfirmationCardProps = {
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
  const trimmedDietary = dietaryNotes?.trim();
  const hasLocation = Boolean(venueName || startLocation);
  const hasDetails = hasLocation || trimmedDietary;

  return (
    <EmailCard>
      <Text style={emailType.sectionLabel}>Jouw tafel</Text>
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
          { icon: "calendar", label: "Datum", value: date },
          { icon: "clock", label: "Tijd", value: time },
          { icon: "people", label: "Plekken", value: seatsLabel },
          { icon: "card", label: "Betaald", value: totalPaid },
        ]}
      />

      {hasDetails ? (
        <>
          <EmailDivider spacing="18px" />
          <Section>
            {venueName ? (
              <LocationRow icon="utensils" label="Locatie" value={venueName} isLast={!startLocation && !trimmedDietary} />
            ) : null}
            {startLocation ? (
              <LocationRow icon="flag" label="Startpunt" value={startLocation} isLast={!trimmedDietary} />
            ) : null}
            {trimmedDietary ? (
              <LocationRow icon="leaf" label="Dieetwensen" value={trimmedDietary} isLast />
            ) : null}
          </Section>
        </>
      ) : null}

      <EmailDivider spacing="18px" />
      <BookingCode code={bookingCode} />
    </EmailCard>
  );
}

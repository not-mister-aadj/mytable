import { BookingConfirmationCard } from "./components/BookingConfirmationCard";
import { CTASection } from "./components/CTASection";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { InfoList } from "./components/InfoList";

export type BookingConfirmationEmailProps = {
  customerName?: string;
  customerEmail: string;
  eventName: string;
  city: string;
  date: string;
  time: string;
  seats: number;
  totalPaid: string;
  bookingCode: string;
  eventUrl: string;
  ticketUrl?: string;
  venueName?: string;
  startLocation?: string;
  dietaryNotes?: string;
};

export function BookingConfirmationEmail({
  customerName,
  eventName,
  city,
  date,
  time,
  seats,
  totalPaid,
  bookingCode,
  eventUrl,
  ticketUrl,
  venueName,
  startLocation,
  dietaryNotes,
}: BookingConfirmationEmailProps) {
  const greeting = customerName ? `Hoi ${customerName},` : "Hoi,";
  const seatsLabel = seats === 1 ? "1 plek" : seats + " plekken";
  const trimmedDietary = dietaryNotes?.trim();

  const aloneOrTogether =
    seats === 1
      ? "Je hebt één plek gereserveerd. Kom gerust alleen. Aan tafel ontmoet je nieuwe mensen."
      : "Je boekt voor " + seats + " personen. Zorg dat iedereen op tijd aanwezig is.";

  return (
    <EmailLayout preview="Je reservering bij MyTable staat klaar.">
      <EmailHero
        greeting={greeting}
        headline="Je tafel staat klaar"
        body="Je boeking is bevestigd. We sturen je alle praktische informatie 24 uur van tevoren toe."
        warmLine="We kijken ernaar uit je aan tafel te verwelkomen."
      />

      <BookingConfirmationCard
        eventName={eventName}
        city={city}
        date={date}
        time={time}
        seatsLabel={seatsLabel}
        totalPaid={totalPaid}
        bookingCode={bookingCode}
        venueName={venueName}
        startLocation={startLocation}
        dietaryNotes={trimmedDietary}
      />

      <InfoList
        items={[
          { icon: "people", title: "Kom alleen of samen", description: aloneOrTogether },
          {
            icon: "mail",
            title: "24 uur van tevoren",
            description:
              "Het restaurant, starttijd en praktische tips sturen we je per mail.",
          },
          ...(trimmedDietary
            ? [
                {
                  icon: "leaf" as const,
                  title: "Jouw dieetwensen",
                  description: "We nemen je doorgegeven wensen mee naar het restaurant.",
                },
              ]
            : [
                {
                  icon: "leaf" as const,
                  title: "Dieetwensen?",
                  description:
                    "Laat het ons weten via info@mytable.club, dan nemen we het mee.",
                },
              ]),
        ]}
      />

      <CTASection
        helperText="Bekijk alle details van je tafel en restaurants."
        href={eventUrl}
        label="Bekijk je tafel →"
      />

      {ticketUrl ? (
        <CTASection
          helperText="Download je ticket voor onderweg."
          href={ticketUrl}
          label="Download ticket →"
          variant="secondary"
        />
      ) : null}
    </EmailLayout>
  );
}

export default BookingConfirmationEmail;

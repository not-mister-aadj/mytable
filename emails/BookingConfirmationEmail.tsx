import { BookingConfirmationCard } from "./components/BookingConfirmationCard";
import { CTASection } from "./components/CTASection";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { InfoList } from "./components/InfoList";

export type BookingConfirmationEmailProps = {
  locale?: "nl" | "en";
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
  locale = "nl",
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
  const trimmedDietary = dietaryNotes?.trim();

  const aloneOrTogether = en
    ? seats === 1
      ? "You reserved one seat. Coming alone is perfect. At the table you will meet new people."
      : `You booked for ${seats} people. Make sure everyone arrives on time.`
    : seats === 1
      ? "Je hebt één plek gereserveerd. Kom gerust alleen. Aan tafel ontmoet je nieuwe mensen."
      : `Je boekt voor ${seats} personen. Zorg dat iedereen op tijd aanwezig is.`;

  return (
    <EmailLayout
      preview={
        en
          ? "Your MyTable reservation is ready."
          : "Je reservering bij MyTable staat klaar."
      }
    >
      <EmailHero
        greeting={greeting}
        headline={en ? "Your table is ready" : "Je tafel staat klaar"}
        body={
          en
            ? "Your booking is confirmed. We will send all practical details 24 hours beforehand."
            : "Je boeking is bevestigd. We sturen je alle praktische informatie 24 uur van tevoren toe."
        }
        warmLine={
          en
            ? "We look forward to welcoming you at the table."
            : "We kijken ernaar uit je aan tafel te verwelkomen."
        }
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
        locale={locale}
      />

      <InfoList
        items={[
          {
            icon: "people",
            title: en ? "Come alone or together" : "Kom alleen of samen",
            description: aloneOrTogether,
          },
          {
            icon: "mail",
            title: en ? "24 hours beforehand" : "24 uur van tevoren",
            description: en
              ? "We will email the restaurant, start time and practical tips."
              : "Het restaurant, starttijd en praktische tips sturen we je per mail.",
          },
          ...(trimmedDietary
            ? [
                {
                  icon: "leaf" as const,
                  title: en ? "Your dietary notes" : "Jouw dieetwensen",
                  description: en
                    ? "We will share your notes with the restaurant."
                    : "We nemen je doorgegeven wensen mee naar het restaurant.",
                },
              ]
            : [
                {
                  icon: "leaf" as const,
                  title: en ? "Dietary needs?" : "Dieetwensen?",
                  description: en
                    ? "Let us know via info@mytable.club and we will pass it on."
                    : "Laat het ons weten via info@mytable.club, dan nemen we het mee.",
                },
              ]),
        ]}
      />

      <CTASection
        helperText={
          en
            ? "See all details for your table and restaurants."
            : "Bekijk alle details van je tafel en restaurants."
        }
        href={eventUrl}
        label={en ? "View your table →" : "Bekijk je tafel →"}
      />

      {ticketUrl ? (
        <CTASection
          helperText={
            en
              ? "Download your ticket for the road."
              : "Download je ticket voor onderweg."
          }
          href={ticketUrl}
          label={en ? "Download ticket →" : "Download ticket →"}
          variant="secondary"
        />
      ) : null}
    </EmailLayout>
  );
}

export default BookingConfirmationEmail;

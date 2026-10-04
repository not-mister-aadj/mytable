import { BookingConfirmationCard } from "./components/BookingConfirmationCard";
import { CTASection } from "./components/CTASection";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { InfoList } from "./components/InfoList";
import { EmailCard } from "./components/EmailCard";
import { Text } from "@react-email/components";
import { emailBrand, emailType } from "./brand";

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
  /** Sunday Social already reveals its venue at booking time, unlike other
   * formats, so several copy blocks below read differently because of that. */
  isSundayTable?: boolean;
  /** A member's booking: the own seat is included in the membership. */
  memberIncluded?: boolean;
  /** The guest's member price against the normal seat price. */
  memberGuest?: { was: string; now: string };
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
  isSundayTable = false,
  memberIncluded = false,
  memberGuest,
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

  const aloneOrTogetherTitle = isSundayTable
    ? en
      ? "Solo is completely normal"
      : "Alleen komen is heel normaal"
    : en
      ? "Come alone or together"
      : "Kom alleen of samen";
  const aloneOrTogether = isSundayTable
    ? en
      ? seats === 1
        ? "Your seat is booked. Most guests come alone, so you'll fit right in."
        : `You booked ${seats} seats. Make sure you both arrive on time.`
      : seats === 1
        ? "Je plek staat vast. De meeste gasten komen alleen, dus je bent in goed gezelschap."
        : `Je hebt ${seats} tickets geboekt. Zorg dat jullie samen op tijd zijn.`
    : en
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
          isSundayTable
            ? en
              ? "Your booking is confirmed. The venue is already set, you'll find it below."
              : "Je boeking is bevestigd. De locatie staat al vast, je vindt hem hieronder."
            : en
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

      {memberIncluded ? (
        <EmailCard>
          <Text style={emailType.sectionLabel}>{en ? "Your membership" : "Je lidmaatschap"}</Text>
          <Text style={{ ...emailType.value, fontSize: "15px", margin: "0 0 6px" }}>
            {en ? "Included in your membership" : "Inbegrepen in je lidmaatschap"}
          </Text>
          {memberGuest ? (
            <Text style={{ ...emailType.body, margin: 0 }}>
              {en ? "Guest: " : "Gast: "}
              <span style={{ textDecoration: "line-through", color: emailBrand.mutedText }}>{memberGuest.was}</span>{" "}
              <strong style={{ color: emailBrand.burgundy }}>{memberGuest.now}</strong>{" "}
              {en ? "(member price)" : "(ledenprijs)"}
            </Text>
          ) : null}
          <Text style={{ ...emailType.bodySmall, margin: "8px 0 0" }}>
            {en
              ? "Can't make it? Cancel your seat in your settings up to 48 hours before."
              : "Kun je toch niet? Zeg je plek uiterlijk 48 uur van tevoren af in je instellingen."}
            {memberGuest
              ? en
                ? " Your guest's seat is cancelled with it and is not refunded."
                : " De plek van je gast vervalt dan ook en wordt niet terugbetaald."
              : ""}
          </Text>
        </EmailCard>
      ) : null}

      <InfoList
        items={[
          {
            icon: "people",
            title: aloneOrTogetherTitle,
            description: aloneOrTogether,
          },
          isSundayTable
            ? {
                icon: "mail" as const,
                title: en ? "The day before" : "Een dag van tevoren",
                description: en
                  ? "We'll email our own wine and food pairing picks for this menu."
                  : "We mailen je onze eigen wijnspijs-aanraders voor deze kaart.",
              }
            : {
                icon: "mail" as const,
                title: en ? "24 hours beforehand" : "24 uur van tevoren",
                description: en
                  ? "We will email the restaurant, start time and practical tips."
                  : "Het restaurant, starttijd en praktische tips sturen we je per mail.",
              },
          ...(isSundayTable
            ? [
                {
                  icon: "leaf" as const,
                  title: en ? "Allergies or dietary needs?" : "Allergieën of dieetwensen?",
                  description: en
                    ? "No need to tell us in advance. You order your own dishes from the menu."
                    : "Niet nodig om vooraf door te geven. Je bestelt zelf je gerechten van de kaart.",
                },
              ]
            : trimmedDietary
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
          isSundayTable
            ? en
              ? "See the venue and everything else about your table."
              : "Bekijk de locatie en alles over je tafel."
            : en
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

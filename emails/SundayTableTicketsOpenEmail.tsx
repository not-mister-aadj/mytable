import { EmailLayout } from "./components/EmailLayout";
import { Button } from "./components/Button";

export type SundayTableTicketsOpenEmailProps = {
  locale: "nl" | "en";
  city: string;
  dateLabel: string;
  timeLabel: string;
  venueName: string;
  ticketUrl: string;
};

export function SundayTableTicketsOpenEmail({
  locale,
  city,
  dateLabel,
  timeLabel,
  venueName,
  ticketUrl,
}: SundayTableTicketsOpenEmailProps) {
  const nl = locale !== "en";

  return (
    <EmailLayout
      preview={
        nl
          ? `Aanmelden is open: Sunday Table ${city}`
          : `Registration is open: Sunday Table ${city}`
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {nl ? "Hoi," : "Hi,"}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 16, color: "#2b0d12" }}>
        {nl
          ? `De locatie voor Sunday Table in ${city} op ${dateLabel} staat vast: ${venueName}. Je kan nu een plek boeken.`
          : `The venue for Sunday Table in ${city} on ${dateLabel} is confirmed: ${venueName}. You can book a seat now.`}
      </p>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 15,
          color: "#5c3a42",
          lineHeight: 1.5,
        }}
      >
        {nl
          ? `${dateLabel} · ${timeLabel} bij ${venueName}.`
          : `${dateLabel} · ${timeLabel} at ${venueName}.`}
      </p>
      <Button href={ticketUrl}>{nl ? "Boek je plek" : "Book your seat"}</Button>
    </EmailLayout>
  );
}

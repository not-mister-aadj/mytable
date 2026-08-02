import { EmailLayout } from "./components/EmailLayout";
import { Button } from "./components/Button";

export type SundayTableReviewEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
  reviewUrl: string;
};

export function SundayTableReviewEmail({
  locale,
  firstName,
  city,
  reviewUrl,
}: SundayTableReviewEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName
    ? nl
      ? `Hoi ${firstName},`
      : `Hi ${firstName},`
    : nl
      ? "Hoi,"
      : "Hi,";

  return (
    <EmailLayout
      preview={
        nl
          ? `Hoe was Sunday Table in ${city}?`
          : `How was Sunday Table in ${city}?`
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {greeting}
      </p>
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 16,
          color: "#2b0d12",
          lineHeight: 1.5,
        }}
      >
        {nl
          ? `Je Sunday Table in ${city} was gisteren. Nog nagenietend? Wij ook, en we zijn benieuwd hoe het voelde.`
          : `Your Sunday Table in ${city} was yesterday. Still glowing from it? So are we, and we would love to know how it felt.`}
      </p>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: 15,
          color: "#5c3a42",
          lineHeight: 1.55,
        }}
      >
        {nl
          ? "Eén korte vraag. Jouw antwoord helpt ons de tafels nog warmer te maken."
          : "One short question. Your answer helps us make the tables even warmer."}
      </p>
      <Button href={reviewUrl}>
        {nl ? "Deel je ervaring" : "Share your experience"}
      </Button>
    </EmailLayout>
  );
}

import { Section, Text } from "@react-email/components";
import { emailBrand, emailFonts, emailType } from "../brand";
import { BookingCode } from "./BookingCode";
import { EmailCard } from "./EmailCard";
import { EmailDivider } from "./EmailDivider";
import { InfoGrid4 } from "./InfoGrid4";

export type BookingSummaryRow = { label: string; value: string };

const iconMap: Record<string, "calendar" | "clock" | "people" | "card"> = {
  Datum: "calendar",
  Tijd: "clock",
  Plekken: "people",
  Betaald: "card",
};

export function BookingSummaryCard({
  title,
  rows,
  muted = false,
  eventName,
  city,
}: {
  title?: string;
  rows: BookingSummaryRow[];
  muted?: boolean;
  eventName?: string;
  city?: string;
}) {
  const codeRow = rows.find((r) => r.label === "Boekingscode");
  const gridRows = rows.filter((r) => !["Tafel", "Stad", "Boekingscode"].includes(r.label));
  const displayEvent = eventName ?? rows.find((r) => r.label === "Tafel")?.value;
  const displayCity = city ?? rows.find((r) => r.label === "Stad")?.value;

  return (
    <EmailCard style={{ backgroundColor: muted ? emailBrand.cream : emailBrand.card, opacity: muted ? 0.95 : 1 }}>
      {title ? <Text style={emailType.sectionLabel}>{title}</Text> : null}
      {displayEvent ? (
        <>
          <Text style={{ fontFamily: emailFonts.serif, fontSize: "22px", color: emailBrand.burgundy, margin: "0 0 4px" }}>
            {displayEvent}
          </Text>
          {displayCity ? <Text style={{ ...emailType.body, margin: 0 }}>{displayCity}</Text> : null}
        </>
      ) : null}
      {gridRows.length > 0 ? (
        <>
          <EmailDivider spacing="18px" />
          <InfoGrid4 items={gridRows.map((r) => ({ icon: iconMap[r.label] ?? "calendar", label: r.label, value: r.value }))} />
        </>
      ) : null}
      {codeRow ? (
        <>
          <EmailDivider spacing="18px" />
          <BookingCode code={codeRow.value} />
        </>
      ) : null}
    </EmailCard>
  );
}

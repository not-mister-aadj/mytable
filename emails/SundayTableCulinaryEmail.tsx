import { EmailLayout } from "./components/EmailLayout";
import { Button } from "./components/Button";

export type SundayTableCulinaryEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
  agendaUrl: string;
};

export function SundayTableCulinaryEmail({
  locale,
  firstName,
  city,
  agendaUrl,
}: SundayTableCulinaryEmailProps) {
  const nl = locale !== "en";
  const greeting = firstName
    ? nl
      ? `Hoi ${firstName},`
      : `Hi ${firstName},`
    : nl
      ? "Hoi,"
      : "Hi,";

  return (
    <EmailLayout preview={nl ? "Plan iets culinairs" : "Book something culinary"}>
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {greeting}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 16, color: "#2b0d12" }}>
        {nl
          ? `Na je Sunday Table in ${city}: plan een Wine Walk of Food Walk met mensen van je tafel.`
          : `After your Sunday Table in ${city}: book a Wine Walk or Food Walk with people from your table.`}
      </p>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: 15,
          color: "#5c3a42",
          lineHeight: 1.5,
        }}
      >
        {nl
          ? "Clubmembers krijgen 10% korting. Culinaire tickets zijn all-in."
          : "Clubmembers get 10% off. Culinary tickets are all-in."}
      </p>
      <Button href={agendaUrl}>
        {nl ? "Bekijk de agenda" : "See the agenda"}
      </Button>
    </EmailLayout>
  );
}

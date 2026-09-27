import { EmailLayout } from "./components/EmailLayout";
import { Button } from "./components/Button";
import { emailBrand, emailFonts, emailRadii } from "./brand";

export type SundayTableIntroRequestEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  city: string;
  dateLabel: string;
  /** The intro page for this booking, with its signed token. */
  introUrl: string;
};

const wineOptions = [
  { value: "red", nl: "🍷 Rood", en: "🍷 Red" },
  { value: "white", nl: "🥂 Wit", en: "🥂 White" },
  { value: "bubbles", nl: "🍾 Bubbels", en: "🍾 Bubbles" },
] as const;

/** Sent once, about 15 minutes after a Sunday Table booking, to guests who
 * skipped the "meet your table" questions on the confirmation page. One
 * wine click already counts as an answer and opens the other questions. */
export function SundayTableIntroRequestEmail({
  locale,
  firstName,
  city,
  dateLabel,
  introUrl,
}: SundayTableIntroRequestEmailProps) {
  const nl = locale !== "en";
  const withWine = (wine: string) =>
    `${introUrl}${introUrl.includes("?") ? "&" : "?"}wine=${wine}`;

  return (
    <EmailLayout
      preview={
        nl
          ? "Twee dagen van tevoren stellen we je tafel aan elkaar voor."
          : "Two days before, we introduce your table to each other."
      }
    >
      <p style={{ margin: "0 0 16px", fontSize: 16, color: "#2b0d12" }}>
        {nl ? `Hoi${firstName ? ` ${firstName}` : ""},` : `Hi${firstName ? ` ${firstName}` : ""},`}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 16, color: "#2b0d12", lineHeight: 1.5 }}>
        {nl
          ? `Leuk dat je aanschuift bij Sunday Table in ${city} op ${dateLabel}. Twee dagen van tevoren stellen we iedereen aan tafel aan elkaar voor, zodat je niet als vreemde binnenloopt.`
          : `Great to have you at Sunday Table in ${city} on ${dateLabel}. Two days before, we introduce everyone at the table to each other, so you don't walk in as a stranger.`}
      </p>
      <p style={{ margin: "0 0 20px", fontSize: 16, color: "#2b0d12", lineHeight: 1.5 }}>
        {nl ? "Om te beginnen: rood, wit of bubbels?" : "To start: red, white or bubbles?"}
      </p>

      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ borderCollapse: "separate", borderSpacing: "8px 0", margin: "0 -8px 24px" }}
      >
        <tbody>
          <tr>
            {wineOptions.map((option) => (
              <td key={option.value} align="center" width="33%">
                <a
                  href={withWine(option.value)}
                  style={{
                    display: "block",
                    padding: "14px 6px",
                    borderRadius: emailRadii.pill,
                    border: `1px solid ${emailBrand.divider}`,
                    backgroundColor: emailBrand.card,
                    color: emailBrand.burgundy,
                    fontFamily: emailFonts.sans,
                    fontSize: "15px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {nl ? option.nl : option.en}
                </a>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <p style={{ margin: "0 0 20px", fontSize: 15, color: "#5c3a42", lineHeight: 1.5 }}>
        {nl
          ? "Daarna nog drie korte vragen: waar mensen je naar mogen vragen, je favoriete plek in de stad en waar je nu helemaal into bent. Alles is optioneel en we delen het alleen met je tafelgenoten."
          : "Then three quick questions: what people can ask you about, your favourite spot in the city and what you're into right now. Everything is optional and we only share it with your tablemates."}
      </p>
      <Button href={introUrl}>{nl ? "Stel jezelf voor" : "Introduce yourself"}</Button>
    </EmailLayout>
  );
}

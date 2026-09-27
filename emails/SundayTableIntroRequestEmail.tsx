import { EmailLayout } from "./components/EmailLayout";
import { emailBrand, emailFonts, emailRadii } from "./brand";

export type SundayTableIntroRequestEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  dateLabel: string;
  /** The intro page for this booking, with its signed token. */
  introUrl: string;
};

const styleOptions = [
  { value: "talker", nl: "🗣️ De prater", en: "🗣️ The talker" },
  { value: "listener", nl: "👂 De luisteraar", en: "👂 The listener" },
  { value: "both", nl: "⚖️ Allebei", en: "⚖️ Both" },
] as const;

const textStyle = { margin: "0 0 14px", fontSize: 16, color: "#2b0d12", lineHeight: 1.5 };

/** Sent once, about 15 minutes after a Sunday Table booking, to guests who
 * skipped the questions on the confirmation page. The reason to answer: the
 * answers decide who they are seated with. One click on a button already
 * counts as an answer and opens the rest of the questions. */
export function SundayTableIntroRequestEmail({
  locale,
  firstName,
  dateLabel,
  introUrl,
}: SundayTableIntroRequestEmailProps) {
  const nl = locale !== "en";
  const withStyle = (style: string) =>
    `${introUrl}${introUrl.includes("?") ? "&" : "?"}style=${style}`;

  return (
    <EmailLayout
      preview={
        nl
          ? "Met één klik zetten we je bij mensen die bij je passen."
          : "One click and we seat you with people who suit you."
      }
    >
      <p style={{ ...textStyle, margin: "0 0 16px" }}>
        {nl ? `Hoi${firstName ? ` ${firstName}` : ""},` : `Hi${firstName ? ` ${firstName}` : ""},`}
      </p>
      <p style={textStyle}>
        {nl
          ? `Op ${dateLabel} verdelen we iedereen over tafels van 4 tot 6. Met een paar antwoorden zetten we je bij mensen die bij je passen. Zonder antwoorden delen we je willekeurig in.`
          : `On ${dateLabel} we split everyone into tables of 4 to 6. A few answers help us seat you with people who suit you. Without them, we seat you at random.`}
      </p>
      <p style={{ ...textStyle, margin: "0 0 20px" }}>
        {nl ? "Om te beginnen, aan tafel ben jij meer:" : "To start, at the table you are more:"}
      </p>

      <table
        role="presentation"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ borderCollapse: "separate", borderSpacing: "8px 0", margin: "0 -8px 28px" }}
      >
        <tbody>
          <tr>
            {styleOptions.map((option) => (
              <td key={option.value} align="center" width="33%">
                <a
                  href={withStyle(option.value)}
                  style={{
                    display: "block",
                    padding: "14px 4px",
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

      <p style={{ margin: 0, fontSize: 16, color: "#2b0d12", lineHeight: 1.5 }}>
        Cheers,
        <br />
        MyTable
      </p>
    </EmailLayout>
  );
}

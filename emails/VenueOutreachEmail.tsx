import { Body, Html, Preview, Text } from "@react-email/components";
import { emailBrand, emailFonts } from "./brand";

/**
 * Deliberately plain: cold outreach to a wine bar should read as a mail from a
 * person, not as a campaign. No hero, no logo bar, no buttons — those are the
 * visual tells that push a first-contact mail towards Promotions.
 */
export type VenueOutreachEmailProps = {
  preview: string;
  /** Blank-line separated blocks of the template body, already filled in. */
  paragraphs: string[];
  /** Small opt-out line under the signature. */
  footer?: string;
};

const paragraphStyle = {
  margin: "0 0 16px",
  fontFamily: emailFonts.sans,
  fontSize: "15px",
  lineHeight: "24px",
  color: emailBrand.darkText,
  whiteSpace: "pre-line" as const,
};

export function VenueOutreachEmail({
  preview,
  paragraphs,
  footer,
}: VenueOutreachEmailProps) {
  return (
    <Html lang="nl">
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#FFFFFF",
          margin: 0,
          padding: "24px",
          fontFamily: emailFonts.sans,
          color: emailBrand.darkText,
        }}
      >
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={paragraphStyle}>
              {paragraph}
            </Text>
          ))}
          {footer ? (
            <Text
              style={{
                ...paragraphStyle,
                margin: "28px 0 0",
                fontSize: "12px",
                lineHeight: "18px",
                color: emailBrand.mutedText,
              }}
            >
              {footer}
            </Text>
          ) : null}
        </div>
      </Body>
    </Html>
  );
}

export default VenueOutreachEmail;

import { Section, Text } from "@react-email/components";
import { emailBrand, emailFonts } from "../brand";

export function EmailHeader({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <Section style={{ textAlign: "center", paddingBottom: "24px" }}>
      <Text
        style={{
          fontFamily: emailFonts.serif,
          fontSize: "30px",
          fontWeight: 400,
          color: emailBrand.burgundy,
          margin: "0 0 6px",
        }}
      >
        MyTable
      </Text>
      {showTagline ? (
        <Text style={{ fontSize: "13px", lineHeight: "18px", color: emailBrand.mutedText, margin: 0 }}>
          {emailBrand.tagline}
        </Text>
      ) : null}
    </Section>
  );
}

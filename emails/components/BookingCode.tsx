import { Text } from "@react-email/components";
import { emailBrand, emailFonts, emailRadii, emailType } from "../brand";
import { EmailSection } from "./EmailSection";

export function BookingCode({ code }: { code: string }) {
  return (
    <EmailSection centered>
      <Text style={{ ...emailType.label, margin: "0 0 8px" }}>Boekingscode</Text>
      <Text
        style={{
          display: "inline-block",
          fontFamily: emailFonts.sans,
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: emailBrand.burgundy,
          backgroundColor: emailBrand.pillBg,
          borderRadius: emailRadii.pill,
          padding: "10px 24px",
          margin: "0 0 8px",
        }}
      >
        {code}
      </Text>
      <Text style={{ fontSize: "11px", lineHeight: "16px", color: emailBrand.mutedText, margin: 0 }}>
        Gebruik deze code als je contact met ons opneemt over je boeking.
      </Text>
    </EmailSection>
  );
}

import { Section, Text } from "@react-email/components";
import { emailSpacing, emailType } from "../brand";
import { Button } from "./Button";

type Props = {
  href: string;
  label: string;
  helperText: string;
  variant?: "primary" | "secondary";
};

export function CTASection({
  href,
  label,
  helperText,
  variant = "primary",
}: Props) {
  return (
    <Section
      className="email-cta-section"
      style={{
        marginTop: "6px",
        marginBottom: emailSpacing.cardGap,
      }}
    >
      <Text
        style={{
          ...emailType.bodySmall,
          textAlign: "center",
          margin: "0 0 16px",
        }}
      >
        {helperText}
      </Text>
      <Button href={href} variant={variant}>
        {label}
      </Button>
    </Section>
  );
}

/** @deprecated Use CTASection */
export const CtaSection = CTASection;

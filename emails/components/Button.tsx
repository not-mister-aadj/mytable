import { Button as EmailButton } from "@react-email/components";
import { emailBrand, emailFonts, emailRadii } from "../brand";

type Props = {
  href: string;
  children: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
};

export function Button({
  href,
  children,
  variant = "primary",
  fullWidth = true,
}: Props) {
  const isPrimary = variant === "primary";

  return (
    <EmailButton
      href={href}
      className={`email-cta-button ${isPrimary ? "email-cta-primary" : "email-cta-secondary"}`}
      style={{
        backgroundColor: isPrimary ? emailBrand.burgundy : emailBrand.card,
        color: isPrimary ? "#FFFFFF" : emailBrand.burgundy,
        fontFamily: emailFonts.sans,
        fontSize: "15px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        textDecoration: "none",
        borderRadius: emailRadii.pill,
        padding: "17px 40px",
        display: fullWidth ? "block" : "inline-block",
        width: fullWidth ? "100%" : "auto",
        maxWidth: fullWidth ? "100%" : "none",
        boxSizing: "border-box",
        textAlign: "center",
        border: isPrimary ? "none" : `1px solid ${emailBrand.divider}`,
        boxShadow: isPrimary ? "0 2px 12px rgba(90, 15, 27, 0.15)" : "none",
      }}
    >
      {children}
    </EmailButton>
  );
}

import { Section } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import { emailBrand, emailRadii, emailShadow, emailSpacing } from "../brand";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function EmailCard({ children, className = "email-card", style }: Props) {
  return (
    <Section
      className={className}
      style={{
        backgroundColor: emailBrand.card,
        borderRadius: emailRadii.card,
        boxShadow: emailShadow.card,
        marginBottom: emailSpacing.cardGap,
        overflow: "hidden",
        ...style,
      }}
    >
      <Section
        className="email-card-inner"
        style={{
          paddingTop: emailSpacing.cardPaddingTop,
          paddingRight: emailSpacing.cardPaddingRight,
          paddingBottom: emailSpacing.cardPaddingBottom,
          paddingLeft: emailSpacing.cardPaddingLeft,
        }}
      >
        {children}
      </Section>
    </Section>
  );
}

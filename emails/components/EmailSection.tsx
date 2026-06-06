import { Section } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  centered?: boolean;
  style?: CSSProperties;
};

export function EmailSection({ children, centered = false, style }: Props) {
  return (
    <Section
      style={{
        textAlign: centered ? "center" : "left",
        ...style,
      }}
    >
      {children}
    </Section>
  );
}

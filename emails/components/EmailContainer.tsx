import { Container } from "@react-email/components";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function EmailContainer({ children }: Props) {
  return (
    <Container className="email-container" style={{ maxWidth: "520px", margin: "0 auto" }}>
      {children}
    </Container>
  );
}

import { Body, Html, Preview } from "@react-email/components";
import type { ReactNode } from "react";
import { emailBrand, emailFonts } from "../brand";
import { EmailContainer } from "./EmailContainer";
import { EmailFooter } from "./EmailFooter";
import { EmailHeader } from "./EmailHeader";
import { EmailStyles } from "./EmailStyles";

type EmailLayoutProps = {
  preview: string;
  children: ReactNode;
  showTagline?: boolean;
};

export function EmailLayout({
  preview,
  children,
  showTagline = true,
}: EmailLayoutProps) {
  return (
    <Html lang="nl">
      <EmailStyles />
      <Preview>{preview}</Preview>
      <Body
        className="email-body"
        style={{
          backgroundColor: emailBrand.cream,
          margin: 0,
          padding: "40px 20px",
          fontFamily: emailFonts.sans,
          color: emailBrand.darkText,
        }}
      >
        <EmailContainer>
          <EmailHeader showTagline={showTagline} />
          {children}
          <EmailFooter />
        </EmailContainer>
      </Body>
    </Html>
  );
}

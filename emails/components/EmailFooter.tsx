import { Link, Section, Text } from "@react-email/components";
import { companyLegal } from "@/lib/company-legal";
import { emailBrand, emailFonts, emailSpacing, emailType } from "../brand";
import { EmailDivider } from "./EmailDivider";

const instagramUrl = "https://instagram.com/mytable.club";

export function EmailFooter() {
  return (
    <Section style={{ paddingTop: emailSpacing.footerTop }}>
      <EmailDivider spacing="0" />
      <Section
        className="email-footer"
        style={{
          maxWidth: "360px",
          margin: "28px auto 0",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            fontFamily: emailFonts.serif,
            fontSize: "16px",
            color: emailBrand.burgundy,
            margin: "0 0 12px",
          }}
        >
          MyTable
        </Text>
        <Text
          style={{
            ...emailType.bodySmall,
            margin: "0 0 8px",
          }}
        >
          Vragen?{" "}
          <Link
            href={`mailto:${companyLegal.email}`}
            style={{ color: emailBrand.burgundy, textDecoration: "none" }}
          >
            {companyLegal.email}
          </Link>
        </Text>
        <Text
          style={{
            fontSize: "14px",
            lineHeight: "22px",
            margin: "0 0 14px",
          }}
        >
          <Link
            href={instagramUrl}
            style={{ color: emailBrand.burgundy, textDecoration: "none" }}
          >
            Instagram
          </Link>
          {" · "}
          <Link
            href={companyLegal.websiteUrl}
            style={{ color: emailBrand.burgundy, textDecoration: "none" }}
          >
            mytable.club
          </Link>
        </Text>
        <Text
          style={{
            fontSize: "12px",
            lineHeight: "18px",
            color: emailBrand.mutedText,
            margin: 0,
          }}
        >
          Verzonden door MyTable
        </Text>
      </Section>
    </Section>
  );
}

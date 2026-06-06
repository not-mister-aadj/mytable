import { Column, Row, Section, Text } from "@react-email/components";
import { emailBrand, emailFonts, emailSpacing, emailType } from "../brand";
import type { EmailIconName } from "../icons";
import { EmailIconCircle } from "./EmailIcon";
import { EmailCard } from "./EmailCard";
import { EmailDivider } from "./EmailDivider";

export type InfoListItem = {
  icon: EmailIconName;
  title: string;
  description: string;
};

export function InfoList({
  heading = "Handig om te weten",
  items,
}: {
  heading?: string;
  items: InfoListItem[];
}) {
  return (
    <EmailCard>
      <Text
        style={{
          fontFamily: emailFonts.serif,
          fontSize: "20px",
          lineHeight: "28px",
          color: emailBrand.burgundy,
          margin: "0 0 18px",
        }}
      >
        {heading}
      </Text>
      {items.map((item, index) => (
        <Section key={item.title}>
          {index > 0 ? <EmailDivider spacing={emailSpacing.listGap} /> : null}
          <Row>
            <Column style={{ width: "42px", verticalAlign: "top" }}>
              <Section
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: emailBrand.iconCircle,
                }}
              >
                <EmailIconCircle name={item.icon} size={15} circleSize={34} alt={item.title} />
              </Section>
            </Column>
            <Column style={{ verticalAlign: "top" }}>
              <Text
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  lineHeight: "20px",
                  color: emailBrand.darkText,
                  margin: "0 0 3px",
                }}
              >
                {item.title}
              </Text>
              <Text style={{ ...emailType.bodySmall, margin: 0 }}>{item.description}</Text>
            </Column>
          </Row>
        </Section>
      ))}
    </EmailCard>
  );
}

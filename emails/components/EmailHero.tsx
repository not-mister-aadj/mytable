import { Column, Heading, Img, Row, Section, Text } from "@react-email/components";
import { emailBrand, emailFonts, emailType } from "../brand";
import { emailIcons } from "../icons";
import { EmailCard } from "./EmailCard";

type Props = {
  greeting: string;
  headline: string;
  body: string;
  warmLine?: string;
};

export function EmailHero({ greeting, headline, body, warmLine }: Props) {
  return (
    <EmailCard className="email-card email-hero">
      <Row>
        <Column className="email-hero-text" style={{ width: "60%", verticalAlign: "top" }}>
          <Text style={{ ...emailType.body, margin: "0 0 8px" }}>{greeting}</Text>
          <Heading
            as="h1"
            className="email-hero-headline"
            style={{
              fontFamily: emailFonts.serif,
              fontSize: "34px",
              fontWeight: 400,
              color: emailBrand.burgundy,
              margin: "0 0 12px",
              lineHeight: "1.12",
            }}
          >
            {headline}
          </Heading>
          <Text style={{ ...emailType.body, margin: warmLine ? "0 0 10px" : 0 }}>{body}</Text>
          {warmLine ? (
            <Text
              style={{
                fontFamily: emailFonts.serif,
                fontSize: "14px",
                lineHeight: "22px",
                fontStyle: "italic",
                color: emailBrand.burgundy,
                margin: 0,
              }}
            >
              {warmLine}
            </Text>
          ) : null}
        </Column>
        <Column className="email-hero-art" style={{ width: "40%", verticalAlign: "middle" }}>
          <Section
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              backgroundColor: emailBrand.iconCircle,
              margin: "0 0 0 auto",
            }}
          >
            <Img
              src={emailIcons.wineGlasses}
              width={48}
              height={48}
              alt=""
              style={{ display: "block", margin: "21px auto 0" }}
            />
          </Section>
        </Column>
      </Row>
    </EmailCard>
  );
}

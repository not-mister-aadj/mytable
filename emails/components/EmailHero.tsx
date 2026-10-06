import { Heading, Img, Section, Text } from "@react-email/components";
import { emailBrand, emailFonts, emailType } from "../brand";
import { emailIcons } from "../icons";
import { EmailCard } from "./EmailCard";

type Props = {
  greeting: string;
  headline: string;
  body: string;
  warmLine?: string;
};

/**
 * The opening card: the wine-glass icon on top, then greeting, headline and
 * text in one full-width column. One column on purpose: it needs no media
 * query, so it also reads well where a mail app drops our <style> (Gmail's
 * translated view, Gmail with a non-Google account).
 */
export function EmailHero({ greeting, headline, body, warmLine }: Props) {
  return (
    <EmailCard className="email-card email-hero">
      <Section
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: emailBrand.iconCircle,
          margin: "0 0 18px",
        }}
      >
        <Img
          src={emailIcons.wineGlasses}
          width={36}
          height={36}
          alt=""
          style={{ display: "block", margin: "14px auto 0" }}
        />
      </Section>
      <Section>
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
      </Section>
    </EmailCard>
  );
}

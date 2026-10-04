import { Text } from "@react-email/components";
import { CTASection } from "./components/CTASection";
import { EmailCard } from "./components/EmailCard";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { InfoList, type InfoListItem } from "./components/InfoList";
import { emailBrand, emailFonts, emailType } from "./brand";

/**
 * One layout for every membership mail (welcome, the reminder before the
 * first period ends, cancellation, no-show warning and pause, a table that
 * opens for everyone). The words come from src/lib/membership/mail-copy.ts.
 */
export type MembershipEmailProps = {
  locale: "nl" | "en";
  preview: string;
  greeting: string;
  headline: string;
  body: string;
  warmLine?: string;
  /** A card with a label and lines, e.g. the plan and its prices. */
  details?: { label: string; lines: string[] };
  infoHeading?: string;
  items?: InfoListItem[];
  /** Small text under everything (e.g. how to cancel). */
  note?: string;
  cta?: { href: string; label: string; helperText: string };
};

export function MembershipEmail({
  preview,
  greeting,
  headline,
  body,
  warmLine,
  details,
  infoHeading,
  items,
  note,
  cta,
}: MembershipEmailProps) {
  return (
    <EmailLayout preview={preview}>
      <EmailHero greeting={greeting} headline={headline} body={body} warmLine={warmLine} />

      {details ? (
        <EmailCard>
          <Text style={emailType.sectionLabel}>{details.label}</Text>
          {details.lines.map((line, i) => (
            <Text
              key={line}
              style={
                i === 0
                  ? {
                      fontFamily: emailFonts.serif,
                      fontSize: "20px",
                      lineHeight: "28px",
                      color: emailBrand.burgundy,
                      margin: "0 0 6px",
                    }
                  : { ...emailType.body, margin: "0 0 4px" }
              }
            >
              {line}
            </Text>
          ))}
        </EmailCard>
      ) : null}

      {items && items.length > 0 ? <InfoList heading={infoHeading} items={items} /> : null}

      {cta ? <CTASection href={cta.href} label={cta.label} helperText={cta.helperText} /> : null}

      {note ? (
        <Text style={{ ...emailType.bodySmall, textAlign: "center", margin: "0 0 8px" }}>{note}</Text>
      ) : null}
    </EmailLayout>
  );
}

export default MembershipEmail;

import { Link, Text } from "@react-email/components";
import { CTASection } from "./components/CTASection";
import { EmailHero } from "./components/EmailHero";
import { EmailLayout } from "./components/EmailLayout";
import { emailBrand, emailType } from "./brand";

/**
 * Welcome for "Jouw tafel" accounts (the account concept), sent once, 30
 * minutes after the quiz. Variant "open": tables are open in her cities;
 * variant "none": none yet. Never a WhatsApp group, never a venue.
 */
export type JouwTafelWelcomeEmailProps = {
  locale: "nl" | "en";
  firstName?: string;
  variant: "open" | "none";
  /** "Rotterdam en Den Haag": the cities with open tables (open), or her
   * chosen cities (none). */
  cities: string;
  kiesUrl: string;
  settingsUrl: string;
};

export function JouwTafelWelcomeEmail({ locale, firstName, variant, cities, kiesUrl, settingsUrl }: JouwTafelWelcomeEmailProps) {
  const en = locale === "en";
  const name = firstName?.trim();
  const greeting = en ? (name ? `Hi ${name},` : "Hi,") : name ? `Hoi ${name},` : "Hoi,";
  const intro = en
    ? "Lovely to have you. Your account is ready and we now know what you are in the mood for."
    : "Fijn dat je erbij bent. Je account staat klaar en we weten nu waar je zin in hebt.";
  const body =
    variant === "open"
      ? en
        ? `In ${cities} there are Sundays waiting for you. You join at 14:00 with 4 to 6 people in a good wine bar. Where exactly, you hear a week before.`
        : `In ${cities} staan zondagen voor je klaar. Je schuift om 14:00 aan bij 4 tot 6 mensen in een goede wijnbar. Waar precies, hoor je een week van tevoren.`
      : en
        ? `No Sunday is planned in ${cities} yet. As soon as there is one, you hear it first.`
        : `In ${cities} is nog geen zondag gepland. Zodra die er is, hoor je het als eerste.`;

  return (
    <EmailLayout preview={en ? "Your account is ready." : "Je account staat klaar."}>
      <EmailHero greeting={greeting} headline={en ? "Welcome to the table" : "Welkom aan tafel"} body={intro} warmLine={body} />

      {variant === "open" ? (
        <CTASection
          href={kiesUrl}
          label={en ? "Choose your Sunday →" : "Kies je zondag →"}
          helperText={en ? "Free to move up to 7 days before." : "Gratis verzetten tot 7 dagen vooraf."}
        />
      ) : (
        <CTASection
          href={settingsUrl}
          label={en ? "View your account →" : "Bekijk je account →"}
          helperText={en ? "Your cities and preferences, all in one place." : "Je steden en voorkeuren, alles op één plek."}
        />
      )}

      <Text style={{ ...emailType.bodySmall, textAlign: "center", margin: "0 0 8px" }}>
        {en ? "You can change your preferences any time in your " : "Je voorkeuren aanpassen kan altijd in je "}
        <Link href={settingsUrl} style={{ color: emailBrand.burgundy, textDecoration: "underline" }}>
          {en ? "settings" : "instellingen"}
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}

export default JouwTafelWelcomeEmail;

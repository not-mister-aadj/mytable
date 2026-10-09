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
  /** Email given, no account yet (that comes when they reserve): no
   * "account ready" and no settings link; every link opens their Sundays. */
  guest?: boolean;
};

export function JouwTafelWelcomeEmail({ locale, firstName, variant, cities, kiesUrl, settingsUrl, guest = false }: JouwTafelWelcomeEmailProps) {
  const en = locale === "en";
  const name = firstName?.trim();
  const greeting = en ? (name ? `Hi ${name},` : "Hi,") : name ? `Hoi ${name},` : "Hoi,";
  const intro = guest
    ? en
      ? "Lovely to have you. We now know what you are in the mood for."
      : "Fijn dat je erbij bent. We weten nu waar je zin in hebt."
    : en
      ? "Lovely to have you. Your account is ready and we now know what you are in the mood for."
      : "Fijn dat je erbij bent. Je account staat klaar en we weten nu waar je zin in hebt.";
  const preview = guest
    ? en
      ? "Your Sunday is waiting."
      : "Je zondag staat klaar."
    : en
      ? "Your account is ready."
      : "Je account staat klaar.";
  const body =
    variant === "open"
      ? en
        ? `In ${cities} there are Sundays waiting for you. You join at 14:00 with 4 to 6 people in a good wine bar. Where exactly, you hear a week before.`
        : `In ${cities} staan zondagen voor je klaar. Je schuift om 14:00 aan bij 4 tot 6 mensen in een goede wijnbar. Waar precies, hoor je een week van tevoren.`
      : en
        ? `No Sunday is planned in ${cities} yet. As soon as there is one, you hear it first.`
        : `In ${cities} is nog geen zondag gepland. Zodra die er is, hoor je het als eerste.`;

  return (
    <EmailLayout preview={preview}>
      <EmailHero greeting={greeting} headline={en ? "Welcome to the table" : "Welkom aan tafel"} body={intro} warmLine={body} />

      {variant === "open" ? (
        <CTASection
          href={kiesUrl}
          label={en ? "Choose your Sunday →" : "Kies je zondag →"}
          helperText={en ? "Free to move up to 7 days before." : "Gratis verzetten tot 7 dagen vooraf."}
        />
      ) : guest ? (
        <CTASection href={kiesUrl} label={en ? "View the Sundays →" : "Bekijk de zondagen →"} />
      ) : (
        <CTASection
          href={settingsUrl}
          label={en ? "View your account →" : "Bekijk je account →"}
        />
      )}

      {guest ? null : (
      <Text style={{ ...emailType.bodySmall, textAlign: "center", margin: "0 0 8px" }}>
        {en ? "You can change your preferences any time in your " : "Je voorkeuren aanpassen kan altijd in je "}
        <Link href={settingsUrl} style={{ color: emailBrand.burgundy, textDecoration: "underline" }}>
          {en ? "settings" : "instellingen"}
        </Link>
        .
      </Text>
      )}
    </EmailLayout>
  );
}

export default JouwTafelWelcomeEmail;

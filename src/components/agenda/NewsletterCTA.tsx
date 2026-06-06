import { NewsletterSignup } from "@/components/NewsletterSignup";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

interface NewsletterCTAProps {
  dict: Dictionary["newsletter"];
  locale: Locale;
}

export function NewsletterCTA({ dict, locale }: NewsletterCTAProps) {
  return (
    <div className="bg-cream">
      <NewsletterSignup dict={dict} locale={locale} />
    </div>
  );
}

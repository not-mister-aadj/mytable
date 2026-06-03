import { NewsletterSignup } from "@/components/NewsletterSignup";
import type { Dictionary } from "@/i18n/types";

interface NewsletterCTAProps {
  dict: Dictionary["newsletter"];
}

export function NewsletterCTA({ dict }: NewsletterCTAProps) {
  return (
    <div className="bg-cream">
      <NewsletterSignup dict={dict} />
    </div>
  );
}

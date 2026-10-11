import { Button } from "@/components/ui/Button";
import { jouwTafelKiesPath, jouwTafelLogInPath, type Locale } from "@/i18n/config";
import { getMemberWelcomeCopy } from "@/lib/membership/offer-copy";

/** On the confirmation page, right after becoming a member through the
 * offer: the membership runs, and where to choose the next Sunday. */
export function MemberWelcomeCard({ locale }: { locale: Locale }) {
  const copy = getMemberWelcomeCopy(locale === "en" ? "en" : "nl");
  const next = `${jouwTafelLogInPath(locale)}?naar=${encodeURIComponent(jouwTafelKiesPath(locale))}`;
  return (
    <section className="pb-12 sm:pb-16">
      <div className="relative overflow-hidden rounded-3xl bg-wine px-6 py-8 text-cream shadow-[0_24px_60px_rgba(43,13,18,0.18)] ring-1 ring-gold/30 sm:px-10 sm:py-10">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-gold">{copy.eyebrow}</p>
        <h2 className="relative mt-3 font-serif text-3xl font-medium leading-tight sm:text-4xl">{copy.title}</h2>
        <p className="relative mt-3 max-w-xl text-base leading-relaxed text-cream/80">{copy.body}</p>
        <Button
          href={next}
          className="relative mt-6 bg-gold px-7 text-wine hover:bg-[#d4ab6e] hover:text-wine"
        >
          {copy.cta}
        </Button>
      </div>
    </section>
  );
}

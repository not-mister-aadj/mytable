"use client";

import type { Locale } from "@/i18n/config";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import { GirlsOnlyCta } from "@/components/girls-only/GirlsOnlyCta";
import { Button } from "@/components/ui/Button";
import { trackSundayTableCtaClicked } from "@/lib/posthog/analytics";
import { GIRLS_ONLY_HERO_CTA_ID } from "@/components/girls-only/girls-only-ids";

export function GirlsOnlyHeroTrackedCta({
  href,
  label,
  locale,
}: {
  href: string;
  label: string;
  locale: Locale;
}) {
  return (
    <div
      id={GIRLS_ONLY_HERO_CTA_ID}
      className="mt-5 flex flex-col items-center gap-3 sm:mt-6 lg:items-start"
    >
      <GirlsOnlyCta
        href={href}
        className="w-full sm:w-auto"
        onClick={() =>
          trackSundayTableCtaClicked({
            cta: "hero_primary",
            source: "home_hero",
            locale,
          })
        }
      >
        {label}
      </GirlsOnlyCta>
    </div>
  );
}

export function GirlsOnlyPremiumJourneySection({
  labels,
  agendaHref,
  locale,
}: {
  labels: Pick<GirlsOnlyPageLabels, "sundayTable" | "premium">;
  agendaHref: string;
  locale: Locale;
}) {
  return (
    <section
      id="premium"
      className="scroll-mt-20 border-t border-wine/10 bg-cream py-8 sm:py-12 lg:py-16"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:px-10">
        <div className="rounded-3xl border border-wine/10 bg-beige p-7 sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            {labels.sundayTable.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
            {labels.sundayTable.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-wine/70 sm:text-base">
            {labels.sundayTable.body}
          </p>
        </div>
        <div className="rounded-3xl border border-wine/15 bg-wine p-7 text-cream sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cream/60">
            {labels.premium.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-cream sm:text-3xl">
            {labels.premium.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-cream/75 sm:text-base">
            {labels.premium.body}
          </p>
          <div className="mt-7">
            <Button
              href={agendaHref}
              onClick={() =>
                trackSundayTableCtaClicked({
                  cta: "plan_next_table",
                  source: "home_premium",
                  locale,
                })
              }
              className="w-full !bg-cream !text-wine hover:!bg-white sm:w-auto"
            >
              {labels.premium.cta}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

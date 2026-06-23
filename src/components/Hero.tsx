import Link from "next/link";
import type { Dictionary } from "@/i18n/types";
import type { EnrichedExperience } from "@/lib/experience-detail";
import { Button } from "./ui/Button";
import { HeroMontageVideo } from "./HeroMontageVideo";

export interface HeroNextEvent {
  experience: EnrichedExperience;
  time: string;
  included: string;
  statusLabel: string;
  href: string;
}

interface HeroProps {
  dict: Dictionary["hero"];
  agendaHref: string;
  nextEvent: HeroNextEvent | null;
}

export function Hero({ dict, agendaHref, nextEvent }: HeroProps) {
  return (
    <section
      id="banner"
      className="relative scroll-mt-20 overflow-hidden bg-cream pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-28"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10">
        <div className="max-w-xl">
          <h1 className="font-serif text-4xl font-medium leading-[1.1] tracking-tight text-wine sm:text-5xl lg:text-6xl xl:text-7xl">
            {dict.headlineLine1}
            <br />
            {dict.headlineLine2}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-wine/80 sm:text-lg">
            {dict.subheadline}
          </p>
          <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-wine/85 sm:text-[17px]">
            {dict.microcopy}
          </p>
          <div className="mt-8">
            <Button href={agendaHref} variant="primary">
              {dict.ctaPrimary}
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-[0_24px_60px_rgba(43,13,18,0.12)] sm:aspect-[5/6]">
            <HeroMontageVideo alt={dict.imageAlt} />
            <div className="absolute inset-0 bg-gradient-to-t from-wine/50 via-transparent to-transparent" />
          </div>

          {nextEvent ? (
            <div className="absolute -bottom-4 left-4 right-4 sm:-left-6 sm:bottom-8 sm:right-auto sm:max-w-xs lg:-left-10">
              <Link
                href={nextEvent.href}
                className="block rounded-2xl border border-border-subtle bg-beige/95 p-5 shadow-lg backdrop-blur-sm transition-shadow hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
                  {dict.nextTableLabel}
                </p>
                <h3 className="mt-1 font-serif text-xl font-medium text-wine">
                  {nextEvent.experience.experienceName}
                </h3>
                <p className="mt-1 text-sm text-wine/70">
                  {nextEvent.experience.city}
                </p>
                <p className="text-sm text-wine/70">{nextEvent.time}</p>
                <p className="mt-2 text-sm text-wine/80">{nextEvent.included}</p>
                <span className="mt-3 inline-block rounded-full bg-burgundy/10 px-3 py-1 text-xs font-medium text-burgundy">
                  {nextEvent.statusLabel}
                </span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

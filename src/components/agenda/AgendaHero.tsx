import Image from "next/image";
import { images } from "@/data/images";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/i18n/types";

interface AgendaHeroProps {
  hero: Dictionary["agenda"]["hero"];
}

export function AgendaHero({ hero }: AgendaHeroProps) {
  const ctaHref = hero.ctaHref ?? "#agenda-browse";
  const ctaLabel = hero.cta ?? "Bekijk de agenda";

  return (
    <section className="relative isolate min-h-[min(48vh,440px)] overflow-hidden bg-wine text-cream">
      <Image
        src={images.restaurantDining}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-[#14060a]/70 sm:bg-[#14060a]/58" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#14060a]/90 via-[#14060a]/55 to-[#14060a]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#14060a]/85 via-transparent to-[#14060a]/30" />

      <div className="relative mx-auto flex min-h-[min(48vh,440px)] max-w-lg flex-col justify-end px-5 pb-12 pt-24 sm:px-6 sm:pb-14 lg:max-w-5xl xl:max-w-6xl">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {hero.eyebrow ?? "MyTable"}
          </p>
          <h1 className="mt-3 font-serif text-[2.15rem] font-medium leading-[1.05] tracking-tight text-cream text-balance sm:text-[2.65rem] lg:text-[3rem]">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-cream/90 sm:text-lg">
            {hero.subtitle}
          </p>

          <div className="mt-7">
            <Button
              href={ctaHref}
              className="bg-gold px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-wine hover:bg-cream sm:text-sm"
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

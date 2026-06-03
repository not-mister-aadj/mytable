import Image from "next/image";
import { images } from "@/data/images";
import type { Dictionary } from "@/i18n/types";

interface AgendaHeroProps {
  hero: Dictionary["agenda"]["hero"];
}

export function AgendaHero({ hero }: AgendaHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle bg-cream">
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-beige/80 to-cream" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(197,154,91,0.12),transparent)]" />

      <div className="absolute inset-0 opacity-[0.22]">
        <Image
          src={images.heroMain}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/92 to-cream/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream via-transparent to-cream/40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          MyTable
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl font-medium leading-[1.08] tracking-tight text-wine sm:text-5xl lg:text-[3.25rem]">
          {hero.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-wine/75 sm:text-xl">
          {hero.subtitle}
        </p>
        {hero.supportLine ? (
          <p className="mt-4 max-w-xl text-base text-wine/55">{hero.supportLine}</p>
        ) : null}
      </div>
    </section>
  );
}

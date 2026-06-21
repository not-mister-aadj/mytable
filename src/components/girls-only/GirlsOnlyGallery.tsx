import type { GirlsOnlyGalleryItem } from "@/lib/girls-only-gallery";
import type { GirlsOnlyPageLabels } from "@/i18n/girls-only-page.types";
import { GirlsOnlyGalleryCarousel } from "@/components/girls-only/GirlsOnlyGalleryCarousel";

interface GirlsOnlyGalleryProps {
  labels: GirlsOnlyPageLabels["gallery"];
  items: GirlsOnlyGalleryItem[];
}

export function GirlsOnlyGallery({ labels, items }: GirlsOnlyGalleryProps) {
  return (
    <section className="border-y border-rose/15 bg-beige/50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-deep">
            {labels.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight text-wine sm:text-3xl">
            {labels.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-wine/65">
            {labels.subtitle}
          </p>
        </div>

        <GirlsOnlyGalleryCarousel labels={labels} items={items} />
      </div>
    </section>
  );
}

import Image from "next/image";
import type { Dictionary } from "@/i18n/types";
import { SectionHeading } from "./ui/SectionHeading";

interface VenueDiscoveryProps {
  dict: Dictionary["venueDiscovery"];
}

export function VenueDiscovery({ dict }: VenueDiscoveryProps) {
  return (
    <section className="bg-wine py-16 text-cream sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          title={dict.title}
          subtitle={dict.subtitle}
          className="[&_h2]:text-cream [&_p]:text-cream/75"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dict.categories.map((category) => (
            <div
              key={category.title}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl"
            >
              <Image
                src={category.image}
                alt={category.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wine/90 via-wine/20 to-transparent" />
              <h3 className="absolute bottom-5 left-5 font-serif text-xl font-medium">
                {category.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

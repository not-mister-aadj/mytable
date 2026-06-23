import Image from "next/image";
import type { Dictionary } from "@/i18n/types";
import { SectionHeading } from "./ui/SectionHeading";

interface VenueDiscoveryProps {
  dict: Dictionary["venueDiscovery"];
}

export function VenueDiscovery({ dict }: VenueDiscoveryProps) {
  return (
    <section className="hidden bg-wine py-10 text-cream md:block sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          title={dict.title}
          subtitle={dict.subtitle}
          className="[&_h2]:text-cream [&_p]:text-cream/75"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dict.places.map((place) => (
            <div
              key={`${place.name}-${place.city}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl"
            >
              <Image
                src={place.image}
                alt={`${place.name}, ${place.city}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-wine/90 via-wine/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <h3 className="font-serif text-xl font-medium leading-tight">
                  {place.name}
                </h3>
                <p className="mt-1 text-sm text-cream/75">{place.city}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

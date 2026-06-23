import Image from "next/image";

interface SocialAtmosphereProps {
  title: string;
  subtitle: string;
  paragraphs: string[];
  image: string;
  imageAlt: string;
}

export function SocialAtmosphere({
  title,
  subtitle,
  paragraphs,
  image,
  imageAlt,
}: SocialAtmosphereProps) {
  return (
    <section className="border-t border-border-subtle py-8 sm:py-14 lg:py-20">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-serif text-2xl font-medium leading-tight tracking-tight text-wine sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-wine/65 sm:mt-4 sm:text-lg">{subtitle}</p>
          {paragraphs.map((p) => (
            <p
              key={p.slice(0, 40)}
              className="mt-4 text-sm leading-relaxed text-wine/75 sm:mt-6 sm:text-base"
            >
              {p}
            </p>
          ))}
        </div>
        <div className="relative aspect-[5/4] overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(43,13,18,0.12)] sm:aspect-[4/5] sm:rounded-3xl">
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-wine/30 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
}

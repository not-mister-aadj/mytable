import Image from "next/image";

interface ExperienceGalleryProps {
  title: string;
  images: string[];
  experienceName: string;
}

export function ExperienceGallery({
  title,
  images: galleryImages,
  experienceName,
}: ExperienceGalleryProps) {
  return (
    <section className="border-t border-border-subtle py-14 sm:py-20">
      <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {galleryImages.map((src, index) => (
          <div
            key={src}
            className={`relative overflow-hidden rounded-2xl ${
              index === 0 ? "col-span-2 aspect-[16/9] lg:col-span-2" : "aspect-square"
            }`}
          >
            <Image
              src={src}
              alt={`${experienceName}, ${index + 1}`}
              fill
              className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

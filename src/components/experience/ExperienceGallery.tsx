import type { ImageSettings } from "@/lib/image-settings";
import { PositionedImage } from "@/components/ui/PositionedImage";
import { aspectRatioToCss } from "@/lib/image-settings";

interface ExperienceGalleryProps {
  title: string;
  images: string[];
  imageSettings?: ImageSettings[];
  experienceName: string;
}

export function ExperienceGallery({
  title,
  images: galleryImages,
  imageSettings,
  experienceName,
}: ExperienceGalleryProps) {
  return (
    <section className="border-t border-border-subtle py-14 sm:py-20">
      <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {galleryImages.map((src, index) => {
          const settings = imageSettings?.[index];
          const ratio = settings?.aspectRatio ?? (index === 0 ? "16:9" : "1:1");
          return (
            <div
              key={`${src}-${index}`}
              className={`relative overflow-hidden rounded-2xl ${
                index === 0 ? "col-span-2 lg:col-span-2" : ""
              }`}
              style={{ aspectRatio: aspectRatioToCss(ratio) }}
            >
              <PositionedImage
                src={src}
                alt={`${experienceName}, ${index + 1}`}
                settings={settings}
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.03]"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

import type { ImageSettings } from "@/lib/image-settings";
import { PositionedImage } from "@/components/ui/PositionedImage";
import { aspectRatioToCss } from "@/lib/image-settings";

interface ExperienceGalleryProps {
  title: string;
  images: string[];
  imageSettings?: ImageSettings[];
  experienceName: string;
}

function GalleryTile({
  src,
  index,
  settings,
  experienceName,
  className = "",
  defaultRatio = "4:3",
}: {
  src: string;
  index: number;
  settings?: ImageSettings;
  experienceName: string;
  className?: string;
  defaultRatio?: ImageSettings["aspectRatio"];
}) {
  const ratio = settings?.aspectRatio ?? defaultRatio;
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ aspectRatio: aspectRatioToCss(ratio) }}
    >
      <PositionedImage
        src={src}
        alt={`${experienceName}, ${index + 1}`}
        settings={settings}
        sizes="(max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 hover:scale-[1.03]"
      />
    </div>
  );
}

export function ExperienceGallery({
  title,
  images: galleryImages,
  imageSettings,
  experienceName,
}: ExperienceGalleryProps) {
  if (galleryImages.length === 0) return null;

  const [featured, ...rest] = galleryImages;
  const featuredSettings = imageSettings?.[0];

  return (
    <section className="border-t border-border-subtle py-14 sm:py-20">
      <h2 className="font-serif text-3xl font-medium tracking-tight text-wine sm:text-4xl">
        {title}
      </h2>

      <div className="mt-10 space-y-3 sm:space-y-4">
        <GalleryTile
          src={featured}
          index={0}
          settings={featuredSettings}
          experienceName={experienceName}
          className="w-full"
          defaultRatio="16:9"
        />

        {rest.length > 0 ? (
          <div
            className={`grid gap-3 sm:gap-4 ${
              rest.length === 1
                ? "grid-cols-1"
                : "grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {rest.map((src, i) => {
              const index = i + 1;
              const spanLastAlone =
                rest.length % 3 === 1 && i === rest.length - 1 && rest.length > 1;
              return (
                <GalleryTile
                  key={`${src}-${index}`}
                  src={src}
                  index={index}
                  settings={imageSettings?.[index]}
                  experienceName={experienceName}
                  className={spanLastAlone ? "lg:col-span-3" : ""}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";

/** Shared marquee photo strip used in the "proof" section of the landing
 * pages (Sunday Table and the format pages). */
export function ProofPhotoStrip({
  images,
  reduceMotion,
}: {
  images: Array<{ src: string; alt: string }>;
  reduceMotion: boolean | null;
}) {
  const track = [...images, ...images];
  return (
    <div className="mt-10">
      <div className="relative overflow-hidden">
        <div
          className={`flex w-max gap-3 pl-5 sm:gap-4 sm:pl-8 lg:gap-5 lg:pl-10 ${
            reduceMotion ? "" : "animate-photo-marquee-right"
          }`}
        >
          {track.map((image, index) => (
            <div
              key={`${image.src}-${index}`}
              className="relative h-56 w-44 shrink-0 overflow-hidden sm:h-64 sm:w-48 lg:h-[17.5rem] lg:w-[13.5rem]"
            >
              <Image
                src={image.src}
                alt={index < images.length ? image.alt : ""}
                fill
                sizes="(max-width: 640px) 176px, (max-width: 1024px) 240px, 360px"
                quality={90}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { GIRLS_ONLY_FINAL_CTA_ID } from "@/components/girls-only/girls-only-ids";

interface GirlsOnlyFinalCtaBannerProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageAlt: string;
}

export function GirlsOnlyFinalCtaBanner({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  imageAlt,
}: GirlsOnlyFinalCtaBannerProps) {
  return (
    <section
      id={GIRLS_ONLY_FINAL_CTA_ID}
      className="relative isolate overflow-hidden"
    >
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/girls-only/smiling-glasses.jpg"
            alt={imageAlt}
            fill
            sizes="100vw"
            className="object-cover object-[55%_30%] sm:object-[52%_28%]"
          />
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#1a080c]/88 via-[#1a080c]/55 to-[#1a080c]/15 sm:via-[#1a080c]/45 sm:to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#1a080c]/70 via-transparent to-[#1a080c]/25"
        />
      </div>

      <div className="relative mx-auto flex min-h-[min(78vh,620px)] max-w-7xl items-end px-5 py-16 sm:items-center sm:px-8 sm:py-24 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="font-serif text-5xl font-medium tracking-tight text-cream sm:text-6xl md:text-7xl">
            MyTable
          </p>
          <h2 className="mt-5 max-w-lg font-serif text-2xl font-medium leading-snug tracking-tight text-cream/95 text-balance sm:text-3xl md:text-[2.15rem] md:leading-snug">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/75 sm:text-base">
            {subtitle}
          </p>
          <div className="mt-8">
            <Button
              href={ctaHref}
              className="!bg-cream !text-wine px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] shadow-[0_14px_40px_rgba(0,0,0,0.28)] hover:!bg-white hover:!text-wine sm:text-sm"
            >
              <span aria-hidden className="mr-2 opacity-90">
                ›
              </span>
              {ctaLabel}
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

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
        {/* Stronger dark wash so copy stays readable on any photo */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[#14060a]/72 sm:bg-[#14060a]/55"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[#14060a]/90 via-[#14060a]/65 to-[#14060a]/35 sm:via-[#14060a]/50 sm:to-[#14060a]/20"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#14060a]/80 via-transparent to-[#14060a]/35"
        />
      </div>

      <div className="relative mx-auto flex min-h-[min(72vh,580px)] max-w-7xl items-end px-5 py-16 sm:items-center sm:px-8 sm:py-24 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl rounded-3xl border border-cream/15 bg-[#14060a]/45 p-6 backdrop-blur-[2px] sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            MyTable
          </p>
          <h2 className="mt-3 max-w-lg font-serif text-3xl font-medium leading-[1.12] tracking-tight text-cream text-balance sm:text-4xl md:text-[2.65rem] md:leading-[1.1]">
            {title}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-cream/90 sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-8">
            <Button
              href={ctaHref}
              className="!bg-cream !text-wine px-8 py-4 text-xs font-semibold uppercase tracking-[0.14em] shadow-[0_14px_40px_rgba(0,0,0,0.35)] hover:!bg-white hover:!text-wine sm:text-sm"
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

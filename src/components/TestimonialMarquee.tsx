import type { Testimonial, TestimonialAvatar } from "@/data/testimonials";

const avatarStyles: Record<TestimonialAvatar, string> = {
  burgundy: "bg-burgundy text-cream",
  gold: "bg-gold text-wine",
  rose: "bg-rose-deep text-cream",
  wine: "bg-wine text-cream",
};

function TestimonialCard({
  item,
  className = "",
}: {
  item: Testimonial;
  className?: string;
}) {
  return (
    <article
      className={`w-[min(100vw-2.5rem,22rem)] shrink-0 rounded-2xl border border-border-subtle bg-beige p-5 shadow-[0_8px_30px_rgba(43,13,18,0.06)] sm:w-[24rem] sm:p-6 ${className}`}
    >
      <header className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold tracking-tight ${avatarStyles[item.avatar]}`}
          aria-hidden
        >
          {item.initials}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-wine">{item.name}</p>
          <p className="truncate text-sm text-wine/55">{item.detail}</p>
        </div>
      </header>
      <p className="mt-4 text-[15px] leading-relaxed text-wine/80 sm:text-base">
        {item.quote}
      </p>
    </article>
  );
}

function MarqueeRow({
  items,
  direction,
  cardClassName,
}: {
  items: Testimonial[];
  direction: "left" | "right";
  cardClassName?: string;
}) {
  const track = [...items, ...items];

  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex w-max gap-4 py-1 ${
          direction === "left"
            ? "animate-marquee-left"
            : "animate-marquee-right"
        }`}
      >
        {track.map((item, index) => (
          <TestimonialCard
            key={`${item.name}-${index}`}
            item={item}
            className={cardClassName}
          />
        ))}
      </div>
    </div>
  );
}

interface TestimonialMarqueeProps {
  top: Testimonial[];
  bottom: Testimonial[];
  fadeFromClassName?: string;
  cardClassName?: string;
  /** Single marquee row instead of two (shorter on mobile landing pages). */
  singleRow?: boolean;
}

export function TestimonialMarquee({
  top,
  bottom,
  fadeFromClassName = "from-cream",
  cardClassName,
  singleRow = false,
}: TestimonialMarqueeProps) {
  return (
    <div className="relative mt-12 sm:mt-14">
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r ${fadeFromClassName} to-transparent sm:w-24`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l ${fadeFromClassName} to-transparent sm:w-24`}
        aria-hidden
      />
      <div className="space-y-4 sm:space-y-5">
        <MarqueeRow items={top} direction="left" cardClassName={cardClassName} />
        {!singleRow ? (
          <MarqueeRow
            items={bottom}
            direction="right"
            cardClassName={cardClassName}
          />
        ) : null}
      </div>
    </div>
  );
}

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { CelebrationSparkles } from "@/components/booking/CelebrationSparkles";
import { BookingStatusIcon } from "@/components/booking/BookingStatusIcon";
import { images } from "@/data/images";
import { agendaPath, type Locale } from "@/i18n/config";
import type { BookingOutcomeLabels } from "@/i18n/types";
import type { BookingOutcomeSummary } from "@/lib/booking-outcome-data";
import { formatGuestCount, formatMoney } from "@/lib/booking-display";

type Variant = "success" | "failed";

interface BookingOutcomeContentProps {
  variant: Variant;
  dict: BookingOutcomeLabels;
  locale: Locale;
  summary: BookingOutcomeSummary | null;
}

export function BookingOutcomeContent({
  variant,
  dict,
  locale,
  summary,
}: BookingOutcomeContentProps) {
  const copy = variant === "success" ? dict.success : dict.failed;
  const eventHref = summary
    ? `/${locale}/agenda/${summary.eventSlug}`
    : agendaPath(locale);
  const agendaHref = agendaPath(locale);

  return (
    <main className="bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={images.heroMain}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-wine/75 via-wine/55 to-cream" />
        </div>

        {variant === "success" ? <CelebrationSparkles /> : null}

        <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-28 text-center sm:px-8 sm:pb-20 sm:pt-32">
          <BookingStatusIcon variant={variant} />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight tracking-tight text-beige sm:text-5xl">
            {copy.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-beige/85 sm:text-lg">
            {copy.subtext}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href={eventHref} variant="primary" className="min-w-[200px]">
              {copy.primaryCta}
            </Button>
            <Button
              href={agendaHref}
              variant="outline"
              className="min-w-[200px] border-beige/40 text-beige hover:border-beige/60 hover:bg-beige/10 hover:text-beige"
            >
              {copy.secondaryCta}
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        {/* Summary card */}
        {summary ? (
          <section className="-mt-10 relative z-10 pb-12 sm:-mt-12 sm:pb-16">
            <div className="overflow-hidden rounded-3xl border border-border-subtle bg-beige shadow-[0_24px_60px_rgba(43,13,18,0.08)]">
              <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
                <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[280px]">
                  <Image
                    src={summary.imageUrl}
                    alt={summary.eventName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-wine/25 via-transparent to-transparent md:bg-gradient-to-r" />
                </div>
                <div className="p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold">
                    {dict.summary.title}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-medium text-wine sm:text-3xl">
                    {summary.eventName}
                  </h2>
                  <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    <SummaryItem label={dict.summary.date} value={summary.dateTime} />
                    <SummaryItem label={dict.summary.city} value={summary.city} />
                    {summary.seats != null ? (
                      <SummaryItem
                        label={dict.summary.guests}
                        value={formatGuestCount(
                          summary.seats,
                          dict.summary.guestLabel,
                          locale,
                        )}
                      />
                    ) : null}
                    {summary.amountCents != null && summary.currency ? (
                      <SummaryItem
                        label={dict.summary.amount}
                        value={formatMoney(
                          summary.amountCents,
                          summary.currency,
                          locale,
                        )}
                      />
                    ) : null}
                    {summary.reservationCode ? (
                      <SummaryItem
                        label={dict.summary.code}
                        value={summary.reservationCode}
                        className="sm:col-span-2"
                        mono
                      />
                    ) : null}
                  </dl>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Next steps — success only */}
        {variant === "success" ? (
          <section className="border-t border-border-subtle py-12 sm:py-16">
            <h2 className="text-center font-serif text-3xl font-medium text-wine sm:text-4xl">
              {dict.nextSteps.title}
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {dict.nextSteps.items.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border-subtle bg-beige/60 p-5 sm:p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-serif text-xl text-wine">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-wine/70">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Community */}
        <section className="border-t border-border-subtle py-12 sm:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <h2 className="font-serif text-3xl font-medium leading-tight text-wine sm:text-4xl">
                {dict.community.title}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-wine/75 sm:text-lg">
                {dict.community.body}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[images.cheers, images.wineGlasses, images.restaurantDining].map(
                (src) => (
                  <div
                    key={src}
                    className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_12px_32px_rgba(43,13,18,0.1)]"
                  >
                    <Image
                      src={src}
                      alt={dict.community.galleryAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 33vw, 200px"
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SummaryItem({
  label,
  value,
  className = "",
  mono = false,
}: {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-[0.1em] text-wine/50">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm text-wine ${mono ? "font-mono text-base tracking-wide" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

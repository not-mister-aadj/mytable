import type { Locale } from "@/i18n/config";
import type { Testimonial, TestimonialAvatar } from "@/data/testimonials";
import { getGirlsOnlyTestimonials } from "@/data/girls-only-testimonials";

export type GirlsOnlyToastItem =
  | {
      kind: "booking";
      name: string;
      detail: string;
      message: string;
      initials: string;
      avatar: TestimonialAvatar;
    }
  | {
      kind: "review";
      name: string;
      detail: string;
      quote: string;
      initials: string;
      avatar: TestimonialAvatar;
    };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function parseDetail(detail: string): { city: string; context: string } {
  const [city = "", context = ""] = detail.split(" · ").map((part) => part.trim());
  return { city, context };
}

function isGroupContext(context: string): boolean {
  const ctx = context.toLowerCase();
  return (
    ctx.includes("groep") ||
    ctx.includes("vriendin") ||
    ctx.includes("vriendinnen") ||
    ctx.includes("meiden") ||
    ctx.includes("group") ||
    ctx.includes("friend") ||
    ctx.includes("crew") ||
    ctx.includes("birthday")
  );
}

function parseGroupSize(context: string): number | null {
  const match = context.match(/(?:groep van|group of)\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function buildBookingMessage(testimonial: Testimonial, locale: Locale): string {
  const { city, context } = parseDetail(testimonial.detail);
  const ctx = context.toLowerCase();
  const { name } = testimonial;
  const groupSize = parseGroupSize(context);

  if (locale === "en") {
    if (groupSize) {
      return `${name} booked a table for ${groupSize} in ${city}`;
    }
    if (isGroupContext(context)) {
      return `${name} booked a table in ${city} · with friends`;
    }
    if (ctx.includes("new in town")) {
      return `${name} from ${city} is joining a table solo`;
    }
    return `${name} is joining a table in ${city}`;
  }

  if (groupSize) {
    return `${name} boekt een tafel voor ${groupSize} in ${city}`;
  }
  if (isGroupContext(context)) {
    return `${name} boekt een tafel in ${city} · met vriendinnen`;
  }
  if (ctx.includes("verhuisd")) {
    return `${name} uit ${city} schuift solo aan bij een tafel`;
  }
  return `${name} schuift aan bij een tafel in ${city}`;
}

function toBookingToast(testimonial: Testimonial, locale: Locale): GirlsOnlyToastItem {
  return {
    kind: "booking",
    name: testimonial.name,
    detail: testimonial.detail,
    message: buildBookingMessage(testimonial, locale),
    initials: testimonial.initials,
    avatar: testimonial.avatar,
  };
}

function toReviewToast(testimonial: Testimonial): GirlsOnlyToastItem {
  return {
    kind: "review",
    name: testimonial.name,
    detail: testimonial.detail,
    quote: testimonial.quote,
    initials: testimonial.initials,
    avatar: testimonial.avatar,
  };
}

export function getGirlsOnlyToastNotifications(locale: Locale): GirlsOnlyToastItem[] {
  const testimonials = getGirlsOnlyTestimonials(locale);
  const shuffled = shuffle(testimonials);

  const groupBookings = shuffled
    .filter((item) => isGroupContext(parseDetail(item.detail).context))
    .slice(0, 2)
    .map((item) => toBookingToast(item, locale));
  const soloBookings = shuffled
    .filter((item) => !isGroupContext(parseDetail(item.detail).context))
    .slice(0, 1)
    .map((item) => toBookingToast(item, locale));
  const reviewToasts = shuffled.slice(0, 3).map(toReviewToast);

  return shuffle([...groupBookings, ...soloBookings, ...reviewToasts]);
}

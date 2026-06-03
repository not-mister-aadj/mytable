import type { Locale } from "@/i18n/config";
import type { ExperienceItem, ExperienceStatusKey } from "@/i18n/types";
import type { Event } from "@/db/schema";
import { getExperienceSlug } from "@/data/experience-slugs";
import type { EnrichedExperience } from "./experience-detail";
import { parseEventExtras } from "@/lib/event-extras";

const WEEKDAYS_NL = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
] as const;

const WEEKDAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTHS_NL = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
] as const;

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function formatTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function formatDateTime(
  startsAt: Date,
  endsAt: Date | null,
  locale: Locale,
): string {
  const weekdays = locale === "nl" ? WEEKDAYS_NL : WEEKDAYS_EN;
  const months = locale === "nl" ? MONTHS_NL : MONTHS_EN;
  const dayName = weekdays[startsAt.getDay()];
  const day = startsAt.getDate();
  const month = months[startsAt.getMonth()];
  const startTime = formatTime(startsAt);
  const endTime = endsAt ? formatTime(endsAt) : null;
  const timePart = endTime ? `${startTime}–${endTime}` : startTime;
  return `${dayName} ${day} ${month} · ${timePart}`;
}

export function deriveDisplayStatus(
  capacity: number,
  spotsSold: number,
  publishedAt: Date | null,
): ExperienceStatusKey {
  const left = capacity - spotsSold;
  if (left <= 0) return "soldOut";
  if (left <= 4) return "almostFull";
  if (publishedAt) {
    const days =
      (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 14) return "new";
  }
  return "available";
}

export function mapDbEventToExperienceItem(
  row: Event,
  locale: Locale,
): ExperienceItem {
  const lang = locale === "nl" ? "nl" : "en";
  const startsAt = new Date(row.startsAt);
  const endsAt = row.endsAt ? new Date(row.endsAt) : null;
  const extras = parseEventExtras(row.extras);
  const customDescription =
    lang === "nl" ? extras.atmosphereTextNl : extras.atmosphereTextEn;
  const customFaq = lang === "nl" ? extras.faqNl : extras.faqEn;
  return {
    id: row.legacyId ?? row.id,
    slug: row.slug,
    city: row.city,
    experienceName: lang === "nl" ? row.nameNl : row.nameEn,
    category: lang === "nl" ? row.categoryNl : row.categoryEn,
    dateTime: formatDateTime(startsAt, endsAt, locale),
    price: Math.round(row.priceCents / 100),
    status: deriveDisplayStatus(
      row.capacity,
      row.spotsSold,
      row.publishedAt ? new Date(row.publishedAt) : null,
    ),
    mood: "tastings",
    image: row.imageUrl,
    femaleOnly: row.femaleOnly,
    tagline: lang === "nl" ? (row.taglineNl ?? undefined) : (row.taglineEn ?? undefined),
    capacity: row.capacity,
    spotsSold: row.spotsSold,
    eventDbId: row.id,
    atmosphereTags: extras.atmosphereTags,
    customDescription: customDescription || undefined,
    customFaq: customFaq?.length ? customFaq : undefined,
    galleryImages: extras.galleryImages?.length
      ? extras.galleryImages
      : undefined,
  };
}

export function enrichDbEvent(row: Event, locale: Locale): EnrichedExperience {
  const item = mapDbEventToExperienceItem(row, locale);
  return {
    ...item,
    slug: item.slug ?? getExperienceSlug(item.id),
  };
}

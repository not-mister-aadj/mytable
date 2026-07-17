const SLUG_MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export const MAX_SLUG_LENGTH = 120;

/** Lowercase URL segment: strips accents and special characters. */
export function slugifySegment(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDateForEventSlug(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  const day = pick("day");
  const month = pick("month");
  const year = pick("year");
  return `${day}-${SLUG_MONTHS[month - 1]}-${year}`;
}

/** Readable public URL slug from table name, city, and start date. */
export function generateEventSlug(input: {
  nameNl: string;
  city: string;
  startsAt: Date;
}): string {
  const name = slugifySegment(input.nameNl);
  const city = slugifySegment(input.city);
  const date = formatDateForEventSlug(input.startsAt);
  return [name, city, date].filter(Boolean).join("-").slice(0, MAX_SLUG_LENGTH);
}

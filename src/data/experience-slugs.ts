/** URL slug per experience id (canonical agenda items) */
export const experienceSlugById: Record<string, string> = {
  "women-wine-walk": "wijnwandeling-women-only-utrecht-22-juni",
  "sunday-wine-walk": "sunday-wine-walk-rotterdam-16-juni",
  "dinner-with-strangers": "diner-met-onbekenden-den-haag-20-juni",
  "wine-bites-tasting": "wijn-bites-proeverij-amsterdam-23-juni",
  "long-table-lunch": "long-table-lunch-rotterdam-30-juni",
  "mystery-restaurant": "mystery-restaurant-utrecht-5-juli",
  "social-brunch-club": "social-brunch-club-amsterdam-7-juli",
  "wine-walk-amsterdam": "sunday-wine-walk-amsterdam-9-juni",
  "dinner-rotterdam": "diner-met-onbekenden-rotterdam-14-juni",
  "tasting-den-haag": "wijn-bites-proeverij-den-haag-15-juni",
  "brunch-rotterdam": "social-brunch-club-rotterdam-9-juni",
  "long-table-amsterdam": "long-table-dinner-amsterdam-27-juni",
  "mystery-den-haag": "mystery-restaurant-den-haag-12-juli",
};

export function getExperienceSlug(id: string): string {
  return experienceSlugById[id] ?? id;
}

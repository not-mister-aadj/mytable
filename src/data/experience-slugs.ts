/** URL slug per experience id (canonical agenda items) */
export const experienceSlugById: Record<string, string> = {
  "wine-tasting-girls-amsterdam":
    "wijnproeverij-girls-only-amsterdam-23-juni",
  "wine-tasting-mixed-rotterdam":
    "wijnproeverij-gemengd-rotterdam-16-juni",
  "wine-tasting-girls-utrecht": "wijnproeverij-girls-only-utrecht-22-juni",
  "wine-tasting-mixed-den-haag":
    "wijnproeverij-gemengd-den-haag-20-juni",
  "wine-tasting-mixed-amsterdam":
    "wijnproeverij-gemengd-amsterdam-28-juni",
  "wine-tasting-girls-rotterdam":
    "wijnproeverij-girls-only-rotterdam-30-juni",
  "wine-tasting-mixed-utrecht": "wijnproeverij-gemengd-utrecht-5-juli",
  "wine-tasting-girls-den-haag":
    "wijnproeverij-girls-only-den-haag-7-juli",
};

export function getExperienceSlug(id: string): string {
  return experienceSlugById[id] ?? id;
}

import type { ExperienceItem, ExperienceStatusKey } from "@/i18n/types";

export function getSpotsLeft(status: ExperienceStatusKey): number | null {
  switch (status) {
    case "soldOut":
      return 0;
    case "almostFull":
      return 4;
    case "available":
      return 12;
    case "new":
      return 16;
    default:
      return null;
  }
}

export function getViewsThisWeek(experienceId: string): number {
  let hash = 0;
  for (let i = 0; i < experienceId.length; i++) {
    hash = (hash + experienceId.charCodeAt(i) * 7) % 100;
  }
  return 22 + (hash % 28);
}

export function formatPerPerson(price: number, label: string): string {
  return label.replace("{price}", String(price));
}

export function formatSpotsBadge(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function formatViewsLabel(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

export function canReserve(experience: ExperienceItem): boolean {
  return experience.status !== "soldOut";
}

import { emailIconUrl } from "./icon-urls";

export const emailIcons = {
  calendar: emailIconUrl("calendar"),
  clock: emailIconUrl("clock"),
  people: emailIconUrl("people"),
  card: emailIconUrl("card"),
  pin: emailIconUrl("pin"),
  utensils: emailIconUrl("utensils"),
  flag: emailIconUrl("flag"),
  mail: emailIconUrl("mail"),
  leaf: emailIconUrl("leaf"),
  wineGlasses: emailIconUrl("wineGlasses"),
} as const;

export type EmailIconName = keyof typeof emailIcons;

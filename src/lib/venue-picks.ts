/** Our picks from a venue's menu: a few wines and a bite to share. They
 * belong to the venue, so every Sunday there shows the same ones. Pure and
 * client-safe. */

export const PICK_KINDS = ["bubbles", "white", "red", "rose", "sweet", "food"] as const;
export type PickKind = (typeof PICK_KINDS)[number];

export const PICK_KIND_LABEL: Record<PickKind, string> = {
  bubbles: "Bubbels",
  white: "Wit",
  red: "Rood",
  rose: "Rosé",
  sweet: "Zoet",
  food: "Om te delen",
};

export type VenuePick = {
  kind: PickKind;
  /** "Om mee te beginnen". */
  moment: string;
  name: string;
  /** "Loire, Frankrijk · per glas". */
  tags: string;
  why: string;
  goesWith: string;
};

export const MAX_PICKS = 6;
const MAX_TEXT = { moment: 60, name: 80, tags: 80, why: 400, goesWith: 120 } as const;

export function emptyPick(kind: PickKind = "white"): VenuePick {
  return { kind, moment: "", name: "", tags: "", why: "", goesWith: "" };
}

/** Whatever is stored, as a clean list; picks without a name are dropped. */
export function parseVenuePicks(raw: unknown): VenuePick[] {
  if (!Array.isArray(raw)) return [];
  const out: VenuePick[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const text = (key: keyof typeof MAX_TEXT) =>
      typeof r[key] === "string" ? (r[key] as string).trim().slice(0, MAX_TEXT[key]) : "";
    const kind = PICK_KINDS.includes(r.kind as PickKind) ? (r.kind as PickKind) : "white";
    const pick = { kind, moment: text("moment"), name: text("name"), tags: text("tags"), why: text("why"), goesWith: text("goesWith") };
    if (pick.name) out.push(pick);
    if (out.length === MAX_PICKS) break;
  }
  return out;
}

/** "Crémant de Loire, bij olijven" for the plain lines in a mail. */
export function pickLine(p: VenuePick): string {
  return p.goesWith ? `${p.name}, bij ${p.goesWith.charAt(0).toLowerCase()}${p.goesWith.slice(1)}` : p.name;
}

/** The tags as separate chips: split on "·" or ",". */
export function pickTags(p: VenuePick): string[] {
  return p.tags
    .split(/[·,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Picks show from 08:00 on the day itself (Amsterdam), just before the
 * 08:30 morning mail, so that mail brings something new. */
export function picksVisible(startsAt: Date, now: number): boolean {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(startsAt);
  const nowDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam" }).format(new Date(now));
  if (nowDay > day) return true;
  if (nowDay < day) return false;
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", hourCycle: "h23" }).format(new Date(now)),
  );
  return hour >= 8;
}

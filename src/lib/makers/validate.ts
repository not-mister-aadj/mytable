import { MAKER_WORK_STYLES, type MakerWorkStyle } from "@/lib/makers/shared";

export type MakerInput = {
  name: string;
  email: string;
  instagram: string | null;
  tiktok: string | null;
  city: string;
  workStyle: MakerWorkStyle;
  portfolioUrl: string | null;
  note: string | null;
  locale: "nl" | "en";
};

export type MakerFormError = "name" | "email" | "city" | "handle" | "privacy";

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t ? t : null;
};

/** "@sanne.eet", "sanne.eet" or a profile link: kept as typed, trimmed. */
function handle(v: unknown): string | null {
  return text(v, 200);
}

export function parseMakerForm(raw: Record<string, unknown>): { ok: true; input: MakerInput } | { ok: false; error: MakerFormError } {
  const name = text(raw.name, 120);
  if (!name) return { ok: false, error: "name" };
  const email = text(raw.email, 200)?.toLowerCase() ?? null;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "email" };
  const city = text(raw.city, 80);
  if (!city) return { ok: false, error: "city" };
  const instagram = handle(raw.instagram);
  const tiktok = handle(raw.tiktok);
  if (!instagram && !tiktok) return { ok: false, error: "handle" };
  if (raw.privacy !== true) return { ok: false, error: "privacy" };
  const style = typeof raw.workStyle === "string" && (MAKER_WORK_STYLES as readonly string[]).includes(raw.workStyle)
    ? (raw.workStyle as MakerWorkStyle)
    : "either";
  const portfolio = text(raw.portfolioUrl, 300);
  return {
    ok: true,
    input: {
      name,
      email,
      instagram,
      tiktok,
      city,
      workStyle: style,
      portfolioUrl: portfolio,
      note: text(raw.note, 2000),
      locale: raw.locale === "en" ? "en" : "nl",
    },
  };
}

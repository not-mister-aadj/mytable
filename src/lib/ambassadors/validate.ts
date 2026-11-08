import { AMBASSADOR_CITIES, AMBASSADOR_ROLES, type AmbassadorRole } from "@/lib/ambassadors/copy";

/** Private Supabase Storage bucket (drizzle/0066): admin opens files via signed links. */
export const AMBASSADOR_BUCKET = "ambassador-applications";

export const MAX_MOTIVATION_BYTES = 5 * 1024 * 1024;

/** Extension and the content type we store it with. */
export const MOTIVATION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export type AmbassadorInput = {
  name: string;
  email: string;
  phone: string | null;
  city: string;
  study: string | null;
  institution: string | null;
  studyYear: string | null;
  roles: AmbassadorRole[];
  instagram: string | null;
  linkedin: string | null;
  motivationText: string | null;
  availability: string | null;
  heardFrom: string | null;
  locale: "nl" | "en";
};

export type ValidationError = "required" | "motivation" | "file" | "fileSize" | "adult";

const clean = (v: unknown, max = 300): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length > 0 ? t : null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The file's extension when it is one we accept, else null. */
export function motivationExtension(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return ext in MOTIVATION_TYPES ? ext : null;
}

/** Reads the form fields; an error key the form can show, or the clean input. */
export function parseAmbassadorForm(
  get: (key: string) => unknown,
  getAll: (key: string) => unknown[],
  file: { name: string; size: number } | null,
): { ok: true; input: AmbassadorInput } | { ok: false; error: ValidationError } {
  const name = clean(get("name"), 120);
  const email = clean(get("email"), 200)?.toLowerCase() ?? null;
  const cityRaw = clean(get("city"), 60);
  const city = AMBASSADOR_CITIES.find((c) => c === cityRaw) ?? null;
  if (!name || !email || !EMAIL.test(email) || !city) return { ok: false, error: "required" };
  if (get("adult") !== "on" && get("adult") !== "true") return { ok: false, error: "adult" };

  const motivationText = clean(get("motivationText"), 5000);
  if (file) {
    if (!motivationExtension(file.name)) return { ok: false, error: "file" };
    if (file.size > MAX_MOTIVATION_BYTES) return { ok: false, error: "fileSize" };
  }
  if (!file && !motivationText) return { ok: false, error: "motivation" };

  const roles = getAll("roles").filter((r): r is AmbassadorRole => AMBASSADOR_ROLES.includes(r as AmbassadorRole));
  return {
    ok: true,
    input: {
      name,
      email,
      phone: clean(get("phone"), 40),
      city,
      study: clean(get("study"), 120),
      institution: clean(get("institution"), 120),
      studyYear: clean(get("studyYear"), 40),
      roles: [...new Set(roles)],
      instagram: clean(get("instagram"), 120),
      linkedin: clean(get("linkedin"), 300),
      motivationText,
      availability: clean(get("availability"), 300),
      heardFrom: clean(get("heardFrom"), 200),
      locale: get("locale") === "en" ? "en" : "nl",
    },
  };
}

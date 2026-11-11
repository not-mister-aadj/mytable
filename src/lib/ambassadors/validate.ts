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
  phone: string;
  city: string;
  study: string;
  institution: string;
  studyYear: string;
  roles: AmbassadorRole[];
  instagram: string | null;
  linkedin: string | null;
  motivationText: string | null;
  availability: string | null;
  heardFrom: string | null;
  locale: "nl" | "en";
};

export type ValidationError = "required" | "study" | "roles" | "motivation" | "file" | "fileSize" | "adult";

const clean = (v: unknown, max = 300): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t.length > 0 ? t : null;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A wa.me link for a phone number as typed; Dutch numbers (06..., 0031...) get +31. Null when it can't be one. */
export function whatsappLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = `31${d.slice(1)}`;
  return d.length >= 10 && d.length <= 15 ? `https://wa.me/${d}` : null;
}

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
  const phone = clean(get("phone"), 40);
  const digits = phone?.replace(/\D/g, "") ?? "";
  const study = clean(get("study"), 120);
  const institution = clean(get("institution"), 120);
  const studyYear = clean(get("studyYear"), 40);
  if (!name || !email || !EMAIL.test(email) || !city || !phone || digits.length < 9 || digits.length > 15) return { ok: false, error: "required" };
  if (!study || !institution || !studyYear) return { ok: false, error: "study" };
  if (get("adult") !== "on" && get("adult") !== "true") return { ok: false, error: "adult" };
  const roles = [...new Set(getAll("roles").filter((r): r is AmbassadorRole => (AMBASSADOR_ROLES as readonly string[]).includes(String(r))))];
  if (roles.length === 0) return { ok: false, error: "roles" };

  const motivationText = clean(get("motivationText"), 5000);
  if (file) {
    if (!motivationExtension(file.name)) return { ok: false, error: "file" };
    if (file.size > MAX_MOTIVATION_BYTES) return { ok: false, error: "fileSize" };
  }
  if (!file && !motivationText) return { ok: false, error: "motivation" };

  return {
    ok: true,
    input: {
      name,
      email,
      phone,
      city,
      study,
      institution,
      studyYear,
      roles,
      instagram: clean(get("instagram"), 120),
      linkedin: clean(get("linkedin"), 300),
      motivationText,
      availability: clean(get("availability"), 300),
      heardFrom: clean(get("heardFrom"), 200),
      locale: get("locale") === "en" ? "en" : "nl",
    },
  };
}

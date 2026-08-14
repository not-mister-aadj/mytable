// Admin-only labels for waitlist preference data — plain NL, no need for
// the site's i18n content files. Shared between the Wachtlijst admin table
// (filters + expandable detail) and the Excel export, so both always agree.

export const FORMAT_LABELS: Record<string, string> = {
  sunday_table: "Sunday Table",
  wine_tasting: "Wijnproeverij",
  wine_walk: "Wijnwalk",
  chefs_special: "Chef's Table",
  food_walk: "Food Walk",
  aperitivo: "Aperitivo",
};

export const GENDER_LABELS: Record<string, string> = {
  female: "Vrouw",
  male: "Man",
  other: "Anders",
  unspecified: "Zeg niet",
};

export const AGE_LABELS: Record<string, string> = {
  "18_24": "18-24",
  "25_34": "25-34",
  "35_44": "35-44",
  "45_plus": "45+",
};

export const WHY_LABELS: Record<string, string> = {
  discover_wines: "Wijn ontdekken",
  discover_flavours: "Nieuwe smaken",
  discover_places: "Nieuwe plekken",
  no_organise: "Niet zelf regelen",
  treat: "Trakteren",
  new_city: "Nieuw in de stad",
  just_fun: "Gewoon leuk",
  other: "Anders",
};

export const COMPANY_LABELS: Record<string, string> = {
  meet_new: "Nieuwe mensen",
  bring_friends: "Vrienden",
  bring_partner: "Partner",
  solo: "Solo",
};

export const TABLE_TYPE_LABELS: Record<string, string> = {
  girls_only: "Girls only",
  mixed: "Gemengd",
  no_preference: "Geen voorkeur",
};

export const VIBE_LABELS: Record<string, string> = {
  people: "De mensen",
  experience: "Eten & wijn",
  both: "Allebei",
};

export const BUDGET_LABELS: Record<string, string> = {
  budget: "Budget",
  premium: "Premium",
  flexible: "Tussenin",
};

export const EXPERIENCE_LABELS: Record<string, string> = {
  curious: "Nieuwsgierig",
  experienced: "Ervaren",
};

export function labelList(ids: string[], labels: Record<string, string>): string[] {
  return ids.map((id) => labels[id] ?? id);
}

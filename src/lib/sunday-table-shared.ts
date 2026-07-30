export type SundayTableType = "girls_only" | "mixed";

export type SundayTableKey = {
  city: string;
  tableDate: string;
  tableType: SundayTableType;
};

export type SundayTableAdminRow = SundayTableKey & {
  signupCount: number;
  seatCount: number;
  planBreakdown: Record<string, number>;
  latestSignupAt: string | null;
};

export type SundayTableSignupProfile = {
  gender?: string | null;
  personality?: string | null;
  birthDate?: string | null;
  joinIntent?: string | null;
  company?: string | null;
  cities?: string[];
  cityFlexible?: boolean;
  preferredTableType?: string | null;
  interests?: string[];
};

export type SundayTableMemberRow = {
  id: string;
  email: string;
  name: string | null;
  planId: string;
  locale: string;
  status: string;
  plusOne: boolean;
  profile: SundayTableSignupProfile | null;
  customerId: string | null;
  createdAt: string;
};

export function encodeSundayTableSlug(key: SundayTableKey): string {
  return [key.city, key.tableDate, key.tableType]
    .map((part) => encodeURIComponent(part))
    .join("__");
}

export function decodeSundayTableSlug(slug: string): SundayTableKey | null {
  const parts = slug.split("__");
  if (parts.length !== 3) return null;
  const [cityEnc, dateEnc, typeEnc] = parts;
  if (!cityEnc || !dateEnc || !typeEnc) return null;
  const city = decodeURIComponent(cityEnc);
  const tableDate = decodeURIComponent(dateEnc);
  const tableType = decodeURIComponent(typeEnc);
  if (tableType !== "girls_only" && tableType !== "mixed") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tableDate)) return null;
  return { city, tableDate, tableType };
}

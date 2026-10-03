import { headers } from "next/headers";
import { cityFromGeo, type QuizCity } from "@/lib/jouw-tafel/logic";

export type JouwTafelSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | null {
  return (Array.isArray(value) ? value[0] : value)?.trim() || null;
}

/**
 * The visitor's city for the "Jouw tafel" pages, from Vercel's IP geo
 * headers: only when it is one of our cities (any spelling), never a town
 * near one. Reading the headers makes the page render per request; the table
 * data itself stays cached (see getJouwTafelData).
 *
 * Overrides, for checking the page without being in that city:
 * - `?voorbeeld=1&stad=Rotterdam` (preview mode, any environment);
 * - `?geo=Den Haag`, everywhere except production, as if Vercel had sent it.
 */
export async function requestCity(searchParams: JouwTafelSearchParams): Promise<QuizCity | null> {
  if (firstParam(searchParams.voorbeeld) === "1") {
    const stad = firstParam(searchParams.stad);
    if (stad) return cityFromGeo(stad, "NL");
  }
  if (process.env.VERCEL_ENV !== "production") {
    const geo = firstParam(searchParams.geo);
    if (geo) return cityFromGeo(geo, "NL");
  }
  const list = await headers();
  return cityFromGeo(list.get("x-vercel-ip-city"), list.get("x-vercel-ip-country"));
}

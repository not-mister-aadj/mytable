// Amsterdam is one city with five parts: a guest says where they would
// join a table, and a Sunday whose venue is known stands under "their"
// tables only when it is in one of those parts. A Sunday without a venue yet
// is for everyone who chose Amsterdam. Client-safe.

export const AMSTERDAM_DISTRICTS = ["centrum", "zuid", "oost", "west", "noord"] as const;
export type AmsterdamDistrict = (typeof AMSTERDAM_DISTRICTS)[number];

/** The parts keep their Dutch names in English too: that is how the city
 * itself names them. */
export const DISTRICT_LABELS: Record<AmsterdamDistrict, string> = {
  centrum: "Centrum",
  zuid: "Zuid",
  oost: "Oost",
  west: "West",
  noord: "Noord",
};

export function isAmsterdam(city: string): boolean {
  return city.trim().toLowerCase() === "amsterdam";
}

/** The first two digits after "10" of an Amsterdam postcode decide. */
function districtFromPostcode(address: string): AmsterdamDistrict | null {
  const match = /\b(1[01]\d{2})\s?[A-Za-z]{2}\b/.exec(address);
  if (!match) return null;
  const code = Number(match[1]);
  if (code >= 1011 && code <= 1018) return "centrum";
  if (code === 1019) return "oost";
  if (code >= 1020 && code <= 1039) return "noord";
  if (code >= 1040 && code <= 1069) return "west";
  if (code >= 1070 && code <= 1083) return "zuid";
  if ((code >= 1086 && code <= 1087) || (code >= 1090 && code <= 1099)) return "oost";
  return null;
}

/** Neighbourhood names as typed in admin, most specific first. */
const AREA_WORDS: [string, AmsterdamDistrict | null][] = [
  ["zuidoost", null],
  ["bijlmer", null],
  ["oud-west", "west"],
  ["oud west", "west"],
  ["nieuw-west", "west"],
  ["nieuw west", "west"],
  ["westerpark", "west"],
  ["baarsjes", "west"],
  ["bos en lommer", "west"],
  ["houthaven", "west"],
  ["pijp", "zuid"],
  ["oud-zuid", "zuid"],
  ["oud zuid", "zuid"],
  ["rivierenbuurt", "zuid"],
  ["zuidas", "zuid"],
  ["buitenveldert", "zuid"],
  ["jordaan", "centrum"],
  ["grachtengordel", "centrum"],
  ["wallen", "centrum"],
  ["nieuwmarkt", "centrum"],
  ["plantage", "centrum"],
  ["ndsm", "noord"],
  ["indische buurt", "oost"],
  ["watergraafsmeer", "oost"],
  ["ijburg", "oost"],
  ["zeeburg", "oost"],
  ["oostelijk", "oost"],
  ["centrum", "centrum"],
  ["noord", "noord"],
  ["oost", "oost"],
  ["west", "west"],
  ["zuid", "zuid"],
];

/** The part of Amsterdam a venue is in: its postcode first, else the
 * neighbourhood typed in admin. Null when neither says (the Sunday is then
 * shown to everyone, like one without a venue). */
export function amsterdamDistrict(venue: { address?: string | null; area?: string | null }): AmsterdamDistrict | null {
  const byPostcode = venue.address ? districtFromPostcode(venue.address) : null;
  if (byPostcode) return byPostcode;
  const area = venue.area?.trim().toLowerCase();
  if (!area) return null;
  for (const [word, district] of AREA_WORDS) {
    if (area.includes(word)) return district;
  }
  return null;
}

/** A stored or posted choice: known parts only, and none or all of them is
 * "everywhere" (undefined). */
export function cleanDistricts(value: unknown): AmsterdamDistrict[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out = AMSTERDAM_DISTRICTS.filter((d) => value.includes(d));
  return out.length === 0 || out.length === AMSTERDAM_DISTRICTS.length ? undefined : out;
}

/** In Amsterdam, with a venue in a part they did not pick. */
export function outsideDistricts(
  event: { city: string; district?: string | null },
  chosen: readonly string[] | undefined,
): boolean {
  if (!chosen || chosen.length === 0 || !event.district) return false;
  return isAmsterdam(event.city) && !chosen.includes(event.district);
}

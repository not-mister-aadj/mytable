/** The minimum line from the founder's doc "Sunday Table naar €10k/maand"
 * (monthly progress check), in cents per month. Revenue is counted by the
 * month the Sunday takes place. */
const TARGETS_EUR: Record<string, number> = {
  "2026-10": 80,
  "2026-11": 530,
  "2026-12": 100,
  "2027-01": 1060,
  "2027-02": 1770,
  "2027-03": 2100,
  "2027-04": 2530,
  "2027-05": 3010,
  "2027-06": 3620,
  "2027-07": 4350,
  "2027-08": 5240,
  "2027-09": 6270,
  "2027-10": 7470,
  "2027-11": 8600,
  "2027-12": 9800,
};

export function monthlyTargetCents(monthKey: string): number | null {
  const eur = TARGETS_EUR[monthKey];
  return eur === undefined ? null : eur * 100;
}

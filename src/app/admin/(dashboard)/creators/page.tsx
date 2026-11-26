import { desc, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { makers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { makerCodeFromName, makerLink } from "@/lib/makers/shared";
import { approveMakerAction, markMakerPaidOutAction, rejectMakerAction } from "./actions";

export const dynamic = "force-dynamic";

const dash = (v: string | null | undefined) => (v && v.trim() ? v : "-");
const euro = (cents: number) => `€${(cents / 100).toFixed(2).replace(".", ",").replace(/,00$/, "")}`;
const dateLabel = (d: Date) =>
  new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "Europe/Amsterdam" }).format(d);

const STYLE: Record<string, string> = { self: "Post zelf", us: "Wij posten", either: "Maakt niet uit" };

function profileHref(value: string, site: "instagram" | "tiktok"): string {
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "").trim();
  return site === "instagram" ? `https://www.instagram.com/${handle}/` : `https://www.tiktok.com/@${handle}`;
}

type Totals = {
  maker_id: string;
  customers: number;
  seats: number;
  earned: number;
  upcoming: number;
  paid_out: number;
};

/** Makers: applications to approve, and per maker what they brought in and what we owe. */
export default async function AdminMakersPage() {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;
  const db = getDb();
  const rows = await db.select().from(makers).orderBy(desc(makers.createdAt)).limit(500);
  const totals = (await db.execute(sql`
    select m.id as maker_id,
      (select count(*) from maker_referrals r where r.maker_id = m.id and r.first_paid_at is not null)::int as customers,
      coalesce(sum(c.seats) filter (where c.booking_id is not null and ok.paid), 0)::int as seats,
      coalesce(sum(c.amount_cents) filter (where c.paid_out_at is null and ok.paid and (c.event_starts_at is null or c.event_starts_at < now())), 0)::int as earned,
      coalesce(sum(c.amount_cents) filter (where c.paid_out_at is null and ok.paid and c.event_starts_at >= now()), 0)::int as upcoming,
      coalesce(sum(c.amount_cents) filter (where c.paid_out_at is not null), 0)::int as paid_out
    from makers m
    left join maker_commissions c on c.maker_id = m.id
    left join lateral (
      select c.booking_id is null or exists (select 1 from bookings b where b.id = c.booking_id and b.payment_status = 'paid') as paid
    ) ok on true
    where m.status = 'approved'
    group by m.id
  `)) as unknown as Totals[];
  const byMaker = new Map(totals.map((t) => [t.maker_id, t]));

  const fresh = rows.filter((r) => r.status === "new");
  const approved = rows.filter((r) => r.status === "approved");

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-3xl text-burgundy">Creators</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-wine/55">Aanmeldingen · {fresh.length}</h2>
        {fresh.length === 0 ? (
          <p className="text-wine/55">-</p>
        ) : (
          <ul className="space-y-3">
            {fresh.map((r) => (
              <li key={r.id} className="rounded-xl border border-wine/10 bg-white px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-semibold text-wine">
                    {r.name} <span className="font-normal text-wine/55">· {r.city}</span>
                  </div>
                  <div className="text-xs text-wine/45">{dateLabel(r.createdAt)}</div>
                </div>
                <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                  <Row label="E-mail">
                    <a href={`mailto:${r.email}`} className="text-burgundy hover:underline">
                      {r.email}
                    </a>
                  </Row>
                  <Row label="Hoe">{STYLE[r.workStyle] ?? r.workStyle}</Row>
                  <Row label="Instagram">
                    {r.instagram ? (
                      <a href={profileHref(r.instagram, "instagram")} target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline">
                        {r.instagram}
                      </a>
                    ) : (
                      "-"
                    )}
                  </Row>
                  <Row label="TikTok">
                    {r.tiktok ? (
                      <a href={profileHref(r.tiktok, "tiktok")} target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline">
                        {r.tiktok}
                      </a>
                    ) : (
                      "-"
                    )}
                  </Row>
                  <Row label="Werk">
                    {r.portfolioUrl ? (
                      <a href={r.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline">
                        {r.portfolioUrl}
                      </a>
                    ) : (
                      "-"
                    )}
                  </Row>
                  <Row label="Bericht">{dash(r.note)}</Row>
                </dl>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <form action={approveMakerAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      name="code"
                      defaultValue={makerCodeFromName(r.name)}
                      aria-label="Code"
                      className="w-36 rounded-lg border border-wine/15 px-3 py-1.5 text-sm uppercase text-wine"
                    />
                    <button type="submit" className="rounded-full bg-burgundy px-4 py-1.5 text-sm font-semibold text-white hover:bg-burgundy/90">
                      Goedkeuren
                    </button>
                  </form>
                  <form action={rejectMakerAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="rounded-full border border-wine/20 px-4 py-1.5 text-sm text-wine/70 hover:bg-wine/5">
                      Afwijzen
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-wine/55">Creators · {approved.length}</h2>
        {approved.length === 0 ? (
          <p className="text-wine/55">-</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-wine/10 bg-white">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-wine/50">
                <tr>
                  <th className="px-4 py-3">Maker</th>
                  <th className="px-4 py-3">Link</th>
                  <th className="px-4 py-3 text-right">Klanten</th>
                  <th className="px-4 py-3 text-right">Plekken</th>
                  <th className="px-4 py-3 text-right">Te betalen</th>
                  <th className="px-4 py-3 text-right">Nog te gaan</th>
                  <th className="px-4 py-3 text-right">Uitbetaald</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-wine/10">
                {approved.map((m) => {
                  const t = byMaker.get(m.id);
                  return (
                    <tr key={m.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-wine">{m.name}</div>
                        <div className="text-xs text-wine/50">
                          {m.city} · {m.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-wine/70">{m.code ? makerLink(m.code).replace("https://www.", "") : "-"}</td>
                      <td className="px-4 py-3 text-right">{t?.customers ?? 0}</td>
                      <td className="px-4 py-3 text-right">{t?.seats ?? 0}</td>
                      <td className="px-4 py-3 text-right font-semibold text-wine">{t?.earned ? euro(t.earned) : "-"}</td>
                      <td className="px-4 py-3 text-right text-wine/60">{t?.upcoming ? euro(t.upcoming) : "-"}</td>
                      <td className="px-4 py-3 text-right text-wine/60">{t?.paid_out ? euro(t.paid_out) : "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {t?.earned ? (
                          <form action={markMakerPaidOutAction}>
                            <input type="hidden" name="id" value={m.id} />
                            <button type="submit" className="rounded-full border border-burgundy px-3 py-1 text-xs font-semibold text-burgundy hover:bg-burgundy/5">
                              Uitbetaald
                            </button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-wine/50">{label}</dt>
      <dd className="min-w-0 break-words text-wine">{children}</dd>
    </div>
  );
}

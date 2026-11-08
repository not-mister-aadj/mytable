import { desc } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/db/index";
import { ambassadorApplications } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { ambassadorCopy } from "@/lib/ambassadors/copy";
import { AMBASSADOR_BUCKET, whatsappLink } from "@/lib/ambassadors/validate";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const dash = (v: string | null | undefined) => (v && v.trim() ? v : "-");

const dateLabel = (d: Date) =>
  new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(d);

/** Applications from /ambassadors, newest first; documents open through a signed link. */
export default async function AdminAmbassadorsPage() {
  await requireAdmin();
  if (!isDbConfigured()) return <p>Database niet geconfigureerd.</p>;
  const rows = await getDb().select().from(ambassadorApplications).orderBy(desc(ambassadorApplications.createdAt)).limit(200);

  const paths = rows.map((r) => r.motivationPath).filter((p): p is string => Boolean(p));
  const links = new Map<string, string>();
  if (paths.length > 0) {
    const { data } = await createSupabaseAdminClient().storage.from(AMBASSADOR_BUCKET).createSignedUrls(paths, 60 * 60);
    for (const s of data ?? []) if (s.path && s.signedUrl) links.set(s.path, s.signedUrl);
  }
  const roles = ambassadorCopy("nl").roles;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-3xl text-burgundy">Ambassadors</h1>
        <span className="text-sm text-wine/55">{rows.length}</span>
      </header>

      {rows.length === 0 ? (
        <p className="text-wine/55">-</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
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
                <Row label="Telefoon">
                  {r.phone ? (
                    <span className="flex flex-wrap items-center gap-2">
                      {r.phone}
                      {whatsappLink(r.phone) ? (
                        <a
                          href={whatsappLink(r.phone)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-[#25D366]/15 px-2.5 py-0.5 text-xs font-semibold text-[#128C7E] hover:bg-[#25D366]/25"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                    </span>
                  ) : (
                    "-"
                  )}
                </Row>
                <Row label="Studie">{dash([r.study, r.institution, r.studyYear].filter(Boolean).join(", "))}</Row>
                <Row label="Rollen">{r.roles.length > 0 ? r.roles.map((id) => roles[id as keyof typeof roles]?.title ?? id).join(", ") : "-"}</Row>
                <Row label="Instagram">{dash(r.instagram)}</Row>
                <Row label="LinkedIn">
                  {r.linkedin ? (
                    <a href={r.linkedin} target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline">
                      Profiel
                    </a>
                  ) : (
                    "-"
                  )}
                </Row>
                <Row label="Gevonden via">{dash(r.heardFrom)}</Row>
                <Row label="Taal">{r.locale === "en" ? "Engels" : "Nederlands"}</Row>
                <Row label="Document">
                  {r.motivationPath && links.get(r.motivationPath) ? (
                    <a href={links.get(r.motivationPath)} target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline">
                      {r.motivationName ?? "Openen"}
                    </a>
                  ) : (
                    "-"
                  )}
                </Row>
              </dl>
              {r.motivationText ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-wine/70">Motivatie</summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-wine/80">{r.motivationText}</p>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-wine/50">{label}</dt>
      <dd className="min-w-0 break-words text-wine">{children}</dd>
    </div>
  );
}

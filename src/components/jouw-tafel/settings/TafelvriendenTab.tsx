"use client";

import { useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { OpenReport, RecentSunday, TafelVriend, Tafelvrienden } from "@/lib/tafelvrienden/server";

const COPY = {
  nl: {
    recentTitle: (label: string, venue: string | null) => `Zondag ${label}${venue ? ` · ${venue}` : ""}`,
    recentNote: (until: string) => `Kies wie je graag terugziet. Dit kan tot ${until}.`,
    like: "Wil ik terugzien",
    report: "Melden",
    friendsTitle: "Wie je graag terugziet",
    friendsNote: "Alleen jij ziet deze lijst.",
    friendsEmpty: "Nog niemand. Na een zondag kies je hier wie je graag terugziet.",
    met: (date: string, venue: string | null) => `${venue ? `${venue}, ` : ""}${date}`,
    remove: "Weghalen",
    removeConfirm: (name: string) => `${name} weghalen uit je lijst? Je kunt diegene daarna niet meer terugzetten.`,
    reportsTitle: "Gemeld",
    reportsNote: "Wat je hebt gemeld, blijft bij ons bekend. Trek je het in, dan houden we er bij de tafelindeling geen rekening meer mee.",
    withdraw: "Intrekken",
    withdrawConfirm: "Deze melding intrekken?",
    failed: "Dat lukte niet. Probeer het later opnieuw.",
    removed: "Weggehaald",
    withdrawn: "Ingetrokken",
  },
  en: {
    recentTitle: (label: string, venue: string | null) => `Sunday ${label}${venue ? ` · ${venue}` : ""}`,
    recentNote: (until: string) => `Pick who you'd like to see again. You can do this until ${until}.`,
    like: "I'd like to see them again",
    report: "Report",
    friendsTitle: "Who you'd like to see again",
    friendsNote: "Only you can see this list.",
    friendsEmpty: "No one yet. After a Sunday, you pick here who you'd like to see again.",
    met: (date: string, venue: string | null) => `${venue ? `${venue}, ` : ""}${date}`,
    remove: "Remove",
    removeConfirm: (name: string) => `Remove ${name} from your list? You can't add them back afterwards.`,
    reportsTitle: "Reported",
    reportsNote: "What you reported stays known to us. If you withdraw it, we no longer take it into account when seating.",
    withdraw: "Withdraw",
    withdrawConfirm: "Withdraw this report?",
    failed: "That didn't work. Please try again later.",
    removed: "Removed",
    withdrawn: "Withdrawn",
  },
} as const;

function Section({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-burgundy/80">{title}</h2>
      {note ? <p className="mt-1.5 px-1 text-[0.82rem] leading-snug text-wine/55">{note}</p> : null}
      <div className="mt-2.5 overflow-hidden rounded-2xl border border-wine/[0.07] bg-white shadow-[0_1px_2px_rgba(43,13,18,0.04),0_6px_18px_rgba(43,13,18,0.04)]">
        <ul className="divide-y divide-wine/[0.07]">{children}</ul>
      </div>
    </section>
  );
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-wine/10" />
  ) : (
    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy/[0.08] font-serif text-[1.1rem] text-burgundy">
      {name.charAt(0).toLocaleUpperCase()}
    </span>
  );
}

function HeartIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" strokeLinejoin="round" />
    </svg>
  );
}

async function post(body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/member/tafelvrienden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function untilLabel(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(iso));
}

/** "Vrienden" on the settings page: pick tablemates for a week, then a list of who they picked. */
export function TafelvriendenTab({
  locale,
  initial,
  onToast,
}: {
  locale: Locale;
  initial: Tafelvrienden;
  onToast: (message: string) => void;
}) {
  const t = COPY[locale === "en" ? "en" : "nl"];
  const [recent, setRecent] = useState<RecentSunday[]>(initial.recent);
  const [friends, setFriends] = useState<TafelVriend[]>(initial.friends);
  const [reports, setReports] = useState<OpenReport[]>(initial.reports);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggleLike(sunday: RecentSunday, mateBookingId: string, on: boolean) {
    setBusy(mateBookingId);
    const update = (value: boolean) =>
      setRecent((all) =>
        all.map((s) =>
          s.bookingId === sunday.bookingId ? { ...s, mates: s.mates.map((m) => (m.bookingId === mateBookingId ? { ...m, liked: value } : m)) } : s,
        ),
      );
    update(on);
    const ok = await post({ action: "like", bookingId: sunday.bookingId, mateBookingId, on });
    if (!ok) {
      update(!on);
      onToast(t.failed);
    }
    setBusy(null);
  }

  async function remove(friend: TafelVriend) {
    if (!window.confirm(t.removeConfirm(friend.firstName))) return;
    setBusy(friend.email);
    const ok = await post({ action: "remove", email: friend.email });
    if (ok) {
      setFriends((all) => all.filter((f) => f.email !== friend.email));
      onToast(t.removed);
    } else onToast(t.failed);
    setBusy(null);
  }

  async function withdraw(report: OpenReport) {
    if (!window.confirm(t.withdrawConfirm)) return;
    setBusy(report.id);
    const ok = await post({ action: "withdraw", reportId: report.id });
    if (ok) {
      setReports((all) => all.filter((r) => r.id !== report.id));
      onToast(t.withdrawn);
    } else onToast(t.failed);
    setBusy(null);
  }

  return (
    <>
      {recent.map((sunday) => (
        <Section key={sunday.bookingId} title={t.recentTitle(sunday.label, sunday.venue)} note={t.recentNote(untilLabel(sunday.closesAt, locale))}>
          {sunday.mates.map((m) => (
            <li key={m.bookingId} className="flex min-h-[3.6rem] items-center gap-3 px-4 py-2.5">
              <Avatar name={m.firstName} photoUrl={m.photoUrl} />
              <span className="min-w-0 flex-1 truncate text-[0.98rem] font-medium text-wine">{m.firstName}</span>
              <button
                type="button"
                aria-pressed={m.liked}
                aria-label={`${t.like}: ${m.firstName}`}
                disabled={busy === m.bookingId}
                onClick={() => void toggleLike(sunday, m.bookingId, !m.liked)}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${m.liked ? "text-burgundy" : "text-wine/35 hover:text-burgundy/70"}`}
              >
                <HeartIcon on={m.liked} />
              </button>
            </li>
          ))}
          <li className="px-4 py-3 text-right">
            <a href={sunday.reportUrl} className="text-[0.85rem] font-medium text-wine/55 underline-offset-2 hover:text-burgundy hover:underline">
              {t.report}
            </a>
          </li>
        </Section>
      ))}

      <Section title={t.friendsTitle} note={t.friendsNote}>
        {friends.length === 0 ? (
          <li className="px-4 py-4 text-[0.92rem] text-wine/55">{t.friendsEmpty}</li>
        ) : (
          friends.map((f) => (
            <li key={f.email} className="flex min-h-[3.6rem] items-center gap-3 px-4 py-2.5">
              <Avatar name={f.firstName} photoUrl={f.photoUrl} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.98rem] font-medium text-wine">{f.firstName}</span>
                <span className="block truncate text-[0.82rem] text-wine/50">{t.met(f.metAt, f.venue)}</span>
              </span>
              <button
                type="button"
                disabled={busy === f.email}
                onClick={() => void remove(f)}
                className="min-h-9 rounded-full px-3 text-[0.85rem] font-semibold text-wine/55 transition hover:bg-wine/[0.05] hover:text-burgundy"
              >
                {t.remove}
              </button>
            </li>
          ))
        )}
      </Section>

      {reports.length > 0 ? (
        <Section title={t.reportsTitle} note={t.reportsNote}>
          {reports.map((r) => (
            <li key={r.id} className="flex min-h-[3.4rem] items-center gap-3 px-4 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.98rem] font-medium text-wine">{r.about}</span>
                <span className="block truncate text-[0.82rem] text-wine/50">{r.metAt}</span>
              </span>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => void withdraw(r)}
                className="min-h-9 rounded-full px-3 text-[0.85rem] font-semibold text-wine/55 transition hover:bg-wine/[0.05] hover:text-burgundy"
              >
                {t.withdraw}
              </button>
            </li>
          ))}
        </Section>
      ) : null}
    </>
  );
}

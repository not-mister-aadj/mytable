import Link from "next/link";
import type {
  CustomerSentEmail,
  CustomerTablemate,
  CustomerWaitlistAnswers,
} from "@/lib/admin-customer-profile-extras";
import { adminPath } from "@/lib/admin-url";
import { WAITLIST_QUESTIONS, answerLabel } from "@/lib/waitlist-answers";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-wine/45">
      {children}
    </h2>
  );
}

export function WaitlistAnswersSection({
  data,
}: {
  data: CustomerWaitlistAnswers;
}) {
  const { signups, answers } = data;
  const cities = [...new Set(signups.map((s) => s.city))];

  return (
    <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <SectionTitle>Wachtlijstantwoorden</SectionTitle>
        <Link
          href={adminPath("/customers/antwoorden")}
          className="text-xs text-wine/55 transition hover:text-burgundy hover:underline"
        >
          Overzicht van alle antwoorden →
        </Link>
      </div>
      {signups.length === 0 ? (
        <p className="mt-4 text-sm text-wine/60">Niet op de wachtlijst.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-wine/65">
            {signups.length === 1
              ? `Aangemeld op ${formatDate(signups[0]!.createdAt)}`
              : `${signups.length} aanmeldingen, eerste op ${formatDate(signups[0]!.createdAt)}, laatste op ${formatDate(signups[signups.length - 1]!.createdAt)}`}
            {" · "}
            {cities.join(", ")}
          </p>
          {answers === null ? (
            <p className="mt-4 text-sm text-wine/60">
              Vragenlijst niet ingevuld.
            </p>
          ) : (
            <>
              {data.answeredAt ? (
                <p className="mt-1 text-xs text-wine/45">
                  Antwoorden van {formatDate(data.answeredAt)}
                </p>
              ) : null}
              <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                {WAITLIST_QUESTIONS.map((question) => {
                  const ids = answers[question.key];
                  const isWhy = question.key === "why";
                  const values = ids.map((id) => answerLabel(question, id));
                  return (
                    <div key={question.key} className="flex justify-between gap-4">
                      <dt className="shrink-0 text-wine/55">{question.label}</dt>
                      <dd className="text-right font-medium text-wine">
                        {values.length > 0 ? (
                          values.join(", ")
                        ) : (
                          <span className="font-normal text-wine/40">
                            Niet ingevuld
                          </span>
                        )}
                        {isWhy && answers.whyOther ? (
                          <span className="mt-0.5 block font-normal italic text-wine/65">
                            &ldquo;{answers.whyOther}&rdquo;
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </>
          )}
        </>
      )}
    </section>
  );
}

export function SentEmailsSection({ emails }: { emails: CustomerSentEmail[] }) {
  return (
    <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
      <SectionTitle>Verstuurde mails ({emails.length})</SectionTitle>
      {emails.length === 0 ? (
        <p className="mt-4 text-sm text-wine/60">Nog geen mails verstuurd.</p>
      ) : (
        <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
          {emails.map((email) => (
            <li
              key={email.id}
              className="border-b border-border-subtle/40 pb-3 last:border-0 last:pb-0"
            >
              <p className="text-xs text-wine/45">
                {formatDateTime(email.createdAt)}
              </p>
              <p className="mt-0.5 font-medium text-wine">{email.subject}</p>
              {email.campaign ? (
                <p className="mt-0.5 text-xs text-wine/55">
                  Campagne: {email.campaign}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function TablematesSection({ mates }: { mates: CustomerTablemate[] }) {
  return (
    <section className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5">
      <SectionTitle>Ook aan tafel bij</SectionTitle>
      <p className="mt-2 text-xs text-wine/50">
        Zelfde event; tafelindeling wordt nog niet bijgehouden.
      </p>
      {mates.length === 0 ? (
        <p className="mt-4 text-sm text-wine/60">
          Nog niemand anders bij dezelfde events.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-subtle/80 text-xs uppercase tracking-[0.06em] text-wine/50">
                <th className="py-2 pr-4">Naam</th>
                <th className="py-2 pr-4">Samen</th>
                <th className="py-2 pr-4">Laatste event</th>
                <th className="py-2">Datum</th>
              </tr>
            </thead>
            <tbody>
              {mates.map((mate) => (
                <tr
                  key={mate.customerId ?? mate.email}
                  className="border-b border-border-subtle/40 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-wine">
                    {mate.customerId ? (
                      <Link
                        href={adminPath(`/customers/${mate.customerId}`)}
                        className="hover:text-burgundy hover:underline"
                      >
                        {mate.name}
                      </Link>
                    ) : (
                      mate.name
                    )}
                    <span className="block text-xs font-normal text-wine/50">
                      {mate.email}
                    </span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums">{mate.timesTogether}x</td>
                  <td className="py-3 pr-4 text-wine/70">{mate.lastEventName}</td>
                  <td className="py-3 text-wine/70">
                    {formatDate(mate.lastEventAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

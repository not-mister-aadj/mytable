"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { adminPath } from "@/lib/admin-url";
import {
  OUTREACH_SENTIMENTS,
  OUTREACH_SENTIMENT_LABELS,
  OUTREACH_STATUSES,
  OUTREACH_STATUS_LABELS,
  type OutreachSentiment,
  type OutreachStatus,
} from "@/lib/outreach/constants";
import type { OutreachProspectDetail } from "@/lib/outreach/prospects-data";
import type { OutreachTemplateRow } from "@/lib/outreach/templates-data";
import {
  addActivityAction,
  deleteProspectAction,
  logReplyAction,
  previewTemplateAction,
  sendTemplateAction,
  setStatusAction,
  updateProspectAction,
} from "@/app/admin/(dashboard)/outreach/actions";
import { OutreachStatusPill } from "@/components/admin/outreach/OutreachStatusPill";

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

type TimelineItem =
  | { kind: "message"; at: string; message: OutreachProspectDetail["messages"][number] }
  | { kind: "activity"; at: string; activity: OutreachProspectDetail["activities"][number] };

const ACTIVITY_LABELS: Record<string, string> = {
  reply: "Antwoord",
  note: "Notitie",
  call: "Telefoon",
  meeting: "Afspraak",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
      />
    </label>
  );
}

export function OutreachProspectView({
  prospect,
  templates,
  nextTemplateId,
}: {
  prospect: OutreachProspectDetail;
  templates: OutreachTemplateRow[];
  /** The sequence step that is due for this prospect, if any. */
  nextTemplateId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState(prospect.name);
  const [contactName, setContactName] = useState(prospect.contactName ?? "");
  const [email, setEmail] = useState(prospect.email ?? "");
  const [phone, setPhone] = useState(prospect.phone ?? "");
  const [website, setWebsite] = useState(prospect.website ?? "");
  const [notes, setNotes] = useState(prospect.notes ?? "");

  const [templateId, setTemplateId] = useState(
    nextTemplateId ?? templates[0]?.id ?? "",
  );
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(
    null,
  );

  const [replyBody, setReplyBody] = useState("");
  const [sentiment, setSentiment] = useState<OutreachSentiment>("positive");
  const [noteBody, setNoteBody] = useState("");

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...prospect.messages.map((entry) => ({
        kind: "message" as const,
        at: entry.sentAt,
        message: entry,
      })),
      ...prospect.activities.map((entry) => ({
        kind: "activity" as const,
        at: entry.occurredAt,
        activity: entry,
      })),
    ];
    return items.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [prospect.messages, prospect.activities]);

  function run(action: () => Promise<{ error: string | null }>, success: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(result.error ?? success);
      if (!result.error) router.refresh();
    });
  }

  function handlePreview() {
    if (!templateId) return;
    setMessage(null);
    startTransition(async () => {
      const result = await previewTemplateAction(prospect.id, templateId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setPreview({ subject: result.subject, body: result.body });
    });
  }

  function handleSend() {
    const template = templates.find((row) => row.id === templateId);
    if (!template) return;
    if (!email.trim()) {
      setMessage("Vul eerst een e-mailadres in.");
      return;
    }
    if (
      !confirm(
        `"${template.name}" versturen naar ${email}?\n\nOnderwerp: ${template.subject}`,
      )
    ) {
      return;
    }
    run(
      () => sendTemplateAction(prospect.id, templateId),
      "Mail verstuurd.",
    );
  }

  function handleDelete() {
    if (!confirm(`${prospect.name} definitief verwijderen uit de outreachlijst?`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteProspectAction(prospect.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.push(adminPath("/outreach"));
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={adminPath("/outreach")}
          className="text-sm text-wine/60 transition hover:text-burgundy"
        >
          ← Outreach
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl text-burgundy sm:text-4xl">
              {prospect.name}
            </h1>
            <p className="mt-2 text-sm text-wine/65">
              {[prospect.category, prospect.address].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <OutreachStatusPill status={prospect.status} />
              {prospect.website ? (
                <a
                  href={prospect.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine/60 underline-offset-2 hover:text-burgundy hover:underline"
                >
                  Website ↗
                </a>
              ) : null}
              {prospect.mapsUrl ? (
                <a
                  href={prospect.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wine/60 underline-offset-2 hover:text-burgundy hover:underline"
                >
                  Google Maps ↗
                </a>
              ) : null}
              {prospect.phone ? (
                <a
                  href={`tel:${prospect.phone.replace(/\s/g, "")}`}
                  className="text-wine/60 underline-offset-2 hover:text-burgundy hover:underline"
                >
                  {prospect.phone}
                </a>
              ) : null}
              {prospect.rating ? (
                <span className="text-wine/50">
                  {prospect.rating} ★ ({prospect.reviewsCount ?? 0})
                </span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="self-start rounded-full border border-border-subtle px-4 py-2 text-sm text-wine/60 transition hover:border-red-400 hover:text-red-700"
          >
            Verwijderen
          </button>
        </div>
      </div>

      {message ? (
        <p className="rounded-2xl border border-burgundy/20 bg-burgundy/[0.05] px-5 py-4 text-sm text-burgundy">
          {message}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
            <h2 className="font-serif text-xl text-burgundy">Mail versturen</h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={templateId}
                onChange={(event) => {
                  setTemplateId(event.target.value);
                  setPreview(null);
                }}
                className="w-full rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40 sm:max-w-xs"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {template.id === nextTemplateId ? " — nu aan de beurt" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handlePreview}
                disabled={pending || !templateId}
                className="rounded-full border border-burgundy/25 bg-cream px-4 py-2 text-sm font-medium text-burgundy transition hover:border-burgundy/50 disabled:opacity-40"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={pending || !templateId}
                className="rounded-full bg-burgundy px-5 py-2 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-40"
              >
                {pending ? "Bezig…" : "Verstuur"}
              </button>
            </div>
            {preview ? (
              <div className="rounded-xl border border-border-subtle bg-cream p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
                  Onderwerp
                </p>
                <p className="mt-1 text-sm font-medium text-burgundy">
                  {preview.subject}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-wine/80">
                  {preview.body}
                </p>
              </div>
            ) : null}
          </section>

          <section className="space-y-4 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
            <h2 className="font-serif text-xl text-burgundy">Antwoord loggen</h2>
            <p className="text-sm text-wine/60">
              Plak hun reply hierin. De sequence stopt automatisch zodra er een
              antwoord staat.
            </p>
            <textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={4}
              placeholder="Wat schreven ze terug?"
              className="w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
            />
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={sentiment}
                onChange={(event) =>
                  setSentiment(event.target.value as OutreachSentiment)
                }
                className="rounded-full border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              >
                {OUTREACH_SENTIMENTS.map((value) => (
                  <option key={value} value={value}>
                    {OUTREACH_SENTIMENT_LABELS[value]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  run(() => {
                    const body = replyBody;
                    setReplyBody("");
                    return logReplyAction({
                      prospectId: prospect.id,
                      body,
                      sentiment,
                    });
                  }, "Antwoord opgeslagen.")
                }
                disabled={pending || !replyBody.trim()}
                className="rounded-full bg-burgundy px-5 py-2 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-40"
              >
                Opslaan
              </button>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
            <h2 className="font-serif text-xl text-burgundy">Tijdlijn</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-wine/55">Nog niets gebeurd.</p>
            ) : (
              <ol className="space-y-3">
                {timeline.map((item) => {
                  if (item.kind === "message") {
                    const mail = item.message;
                    return (
                      <li
                        key={`m-${mail.id}`}
                        className="rounded-xl border border-border-subtle bg-cream p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-burgundy">
                            {mail.subject}
                          </p>
                          <span className="text-xs text-wine/50">
                            {formatDateTime(mail.sentAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-wine/55">
                          {[
                            mail.step ? `Stap ${mail.step}` : mail.templateKey,
                            mail.attachmentName ? `📎 ${mail.attachmentName}` : null,
                            mail.deliveredAt ? "afgeleverd" : null,
                            mail.openCount > 0
                              ? `${mail.openCount}× geopend`
                              : "nog niet geopend",
                            mail.clickCount > 0 ? `${mail.clickCount}× geklikt` : null,
                            mail.bouncedAt ? "bounce" : null,
                            mail.error,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-wine/50 hover:text-burgundy">
                            Toon tekst
                          </summary>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-wine/75">
                            {mail.bodySnapshot}
                          </p>
                        </details>
                      </li>
                    );
                  }

                  const activity = item.activity;
                  return (
                    <li
                      key={`a-${activity.id}`}
                      className="rounded-xl border border-gold/40 bg-gold/[0.08] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[#7A5A2B]">
                          {ACTIVITY_LABELS[activity.type] ?? activity.type}
                          {activity.sentiment
                            ? ` · ${OUTREACH_SENTIMENT_LABELS[activity.sentiment as OutreachSentiment] ?? activity.sentiment}`
                            : ""}
                        </p>
                        <span className="text-xs text-wine/50">
                          {formatDateTime(activity.occurredAt)}
                        </span>
                      </div>
                      {activity.body ? (
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-wine/80">
                          {activity.body}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="space-y-3 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
            <h2 className="font-serif text-xl text-burgundy">Status</h2>
            <select
              value={prospect.status}
              onChange={(event) =>
                run(
                  () => setStatusAction(prospect.id, event.target.value),
                  "Status bijgewerkt.",
                )
              }
              className="w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
            >
              {OUTREACH_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {OUTREACH_STATUS_LABELS[status as OutreachStatus]}
                </option>
              ))}
            </select>
            <dl className="space-y-1 text-xs text-wine/55">
              <div className="flex justify-between gap-2">
                <dt>Sequence</dt>
                <dd>Stap {prospect.sequenceStep}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Laatste mail</dt>
                <dd>
                  {prospect.lastSentAt ? formatDateTime(prospect.lastSentAt) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Opvolgen op</dt>
                <dd>
                  {prospect.nextFollowUpAt
                    ? formatDateTime(prospect.nextFollowUpAt)
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
            <h2 className="font-serif text-xl text-burgundy">Contact</h2>
            <Field
              label="Naam in de mail"
              value={name}
              onChange={setName}
              placeholder="LE NORD"
            />
            <Field
              label="Contactpersoon"
              value={contactName}
              onChange={setContactName}
              placeholder="Voornaam"
            />
            <Field label="E-mail" value={email} onChange={setEmail} />
            <Field label="Telefoon" value={phone} onChange={setPhone} />
            <Field label="Website" value={website} onChange={setWebsite} />
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
                Notities
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              />
            </label>
            <button
              type="button"
              onClick={() =>
                run(
                  () =>
                    updateProspectAction(prospect.id, {
                      name,
                      contactName,
                      email,
                      phone,
                      website,
                      notes,
                    }),
                  "Opgeslagen.",
                )
              }
              disabled={pending}
              className="w-full rounded-full bg-burgundy px-5 py-2 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-40"
            >
              Opslaan
            </button>
          </section>

          <section className="space-y-3 rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)]">
            <h2 className="font-serif text-xl text-burgundy">Notitie of belletje</h2>
            <textarea
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              rows={3}
              placeholder="Gebeld, ze denken erover na…"
              className="w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
            />
            <div className="flex gap-2">
              {(["note", "call", "meeting"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    run(() => {
                      const body = noteBody;
                      setNoteBody("");
                      return addActivityAction({
                        prospectId: prospect.id,
                        type,
                        body,
                      });
                    }, "Toegevoegd.")
                  }
                  disabled={pending || !noteBody.trim()}
                  className="flex-1 rounded-full border border-burgundy/25 bg-cream px-3 py-2 text-xs font-medium text-burgundy transition hover:border-burgundy/50 disabled:opacity-40"
                >
                  {ACTIVITY_LABELS[type]}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

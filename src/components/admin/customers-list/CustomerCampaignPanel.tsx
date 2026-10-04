"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { AdminCustomerListRow } from "@/lib/admin-customers-data";
import {
  CAMPAIGN_EXCLUSION_LABELS,
  CAMPAIGN_MAX_RECIPIENTS,
  buildCampaignMail,
  campaignExclusionReason,
  isValidCampaignSlug,
  isValidCampaignUrl,
  type CampaignExclusionReason,
} from "@/lib/email/campaign-mail";
import {
  sendCustomerCampaignAction,
  sendCustomerCampaignTestAction,
  type CustomerCampaignInput,
  type CustomerCampaignSendResult,
} from "@/app/admin/(dashboard)/customers/campaign-actions";

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-cream px-3.5 py-2 text-sm text-wine outline-none transition focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10";
const labelClass =
  "text-xs font-semibold uppercase tracking-[0.08em] text-wine/50";

const EMPTY_CONTENT: CustomerCampaignInput = {
  campaign: "",
  subject: "",
  previewText: "",
  greeting: "Hoi",
  body: "",
  linkText: "",
  linkUrl: "",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? <span className="block text-xs text-wine/50">{hint}</span> : null}
    </label>
  );
}

function validationError(content: CustomerCampaignInput): string | null {
  if (!isValidCampaignSlug(content.campaign.trim().toLowerCase())) {
    return "Vul een campagnenaam in (kleine letters, cijfers en - of _).";
  }
  if (!content.subject.trim()) return "Vul een onderwerp in.";
  if (!content.body.trim()) return "Vul de tekst van de mail in.";
  if (content.linkUrl.trim() && !isValidCampaignUrl(content.linkUrl.trim())) {
    return "De link-URL is geen geldige http(s)-link.";
  }
  if (content.linkUrl.trim() && !content.linkText.trim()) {
    return "Vul ook een linktekst in.";
  }
  return null;
}

export function CustomerCampaignPanel({
  open,
  rows,
  onClose,
}: {
  open: boolean;
  rows: AdminCustomerListRow[];
  onClose: () => void;
}) {
  const [content, setContent] = useState<CustomerCampaignInput>(EMPTY_CONTENT);
  const [testState, setTestState] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "sent"; to: string }
    | { kind: "error"; error: string }
  >({ kind: "idle" });
  const [confirmText, setConfirmText] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<CustomerCampaignSendResult | null>(null);

  const { recipients, excluded } = useMemo(() => {
    const counts: Record<CampaignExclusionReason, number> = {
      unsubscribed: 0,
      no_email: 0,
    };
    const seen = new Set<string>();
    const list: AdminCustomerListRow[] = [];
    for (const row of rows) {
      const reason = campaignExclusionReason(row);
      if (reason) {
        counts[reason] += 1;
        continue;
      }
      const key = row.email.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(row);
    }
    return { recipients: list, excluded: counts };
  }, [rows]);

  const n = recipients.length;
  const sampleFirstName = recipients[0]?.firstName ?? null;
  const error = validationError(content);
  const overCap = n > CAMPAIGN_MAX_RECIPIENTS;
  const testSent = testState.kind === "sent";
  const canSend =
    !error &&
    !overCap &&
    n > 0 &&
    testSent &&
    confirmText.trim() === String(n) &&
    !sending;

  const preview = useMemo(
    () =>
      buildCampaignMail({
        content,
        firstName: sampleFirstName,
        resolvedLinkUrl: content.linkUrl.trim() || null,
      }),
    [content, sampleFirstName],
  );

  function update<K extends keyof CustomerCampaignInput>(
    key: K,
    value: CustomerCampaignInput[K],
  ) {
    setContent((prev) => ({ ...prev, [key]: value }));
    // Any change needs a fresh test mail before the real send.
    setTestState({ kind: "idle" });
    setConfirmText("");
    setResult(null);
  }

  async function handleTest() {
    if (error) return;
    setTestState({ kind: "sending" });
    const res = await sendCustomerCampaignTestAction({
      content,
      sampleFirstName,
    });
    setTestState(
      res.ok ? { kind: "sent", to: res.to } : { kind: "error", error: res.error },
    );
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendCustomerCampaignAction({
        content,
        customerIds: recipients.map((r) => r.id),
        confirmCount: Number(confirmText.trim()),
      });
      setResult(res);
      if (res.ok) {
        setConfirmText("");
        setTestState({ kind: "idle" });
      }
    } catch (err) {
      setResult({
        ok: false,
        error: err instanceof Error ? err.message : "Versturen mislukt.",
      });
    } finally {
      setSending(false);
    }
  }

  const excludedTotal = excluded.unsubscribed + excluded.no_email;
  const estimatedMinutes = Math.max(1, Math.ceil((n * 1.2) / 60));

  return (
    <div
      className={open ? "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-wine/40 p-4 sm:p-8" : "hidden"}
      role="dialog"
      aria-modal="true"
      aria-label="Mail deze selectie"
    >
      <div className="w-full max-w-6xl rounded-2xl border border-border-subtle/80 bg-cream p-5 shadow-[0_20px_60px_rgba(43,13,18,0.2)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wine/45">
              Campagne
            </p>
            <h2 className="mt-1 font-serif text-2xl text-burgundy">
              Mail deze selectie
            </h2>
            <p className="mt-1 text-sm text-wine/65">
              {n} ontvanger{n === 1 ? "" : "s"} van de {rows.length} in de
              huidige selectie.
              {excludedTotal > 0 ? (
                <>
                  {" "}
                  Uitgesloten: {excludedTotal} (
                  {(Object.keys(excluded) as CampaignExclusionReason[])
                    .filter((key) => excluded[key] > 0)
                    .map((key) => `${excluded[key]} ${CAMPAIGN_EXCLUSION_LABELS[key]}`)
                    .join(", ")}
                  ).
                </>
              ) : null}
            </p>
            {overCap ? (
              <p className="mt-1 text-sm font-medium text-rose-deep">
                Maximaal {CAMPAIGN_MAX_RECIPIENTS} ontvangers per verzending.
                Maak de selectie kleiner met de filters.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-full border border-border-subtle px-3.5 py-1.5 text-sm text-wine/70 transition hover:border-burgundy/40 hover:text-burgundy disabled:opacity-50"
          >
            Sluiten
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Field
              label="Campagnenaam"
              hint="Verplicht. Komt in utm_campaign en de r-code van elke link, bijv. sunday-social-oktober."
            >
              <input
                value={content.campaign}
                onChange={(e) => update("campaign", e.target.value)}
                className={inputClass}
                placeholder="sunday-social-oktober"
              />
            </Field>
            <Field label="Onderwerp">
              <input
                value={content.subject}
                onChange={(e) => update("subject", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Previewtekst"
              hint="Het grijze zinnetje dat na het onderwerp in de inbox staat."
            >
              <input
                value={content.previewText}
                onChange={(e) => update("previewText", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label="Aanhef"
              hint="Gevolgd door de voornaam, bijv. Hoi Sara. Zonder voornaam: Hoi,"
            >
              <input
                value={content.greeting}
                onChange={(e) => update("greeting", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Tekst" hint="Een lege regel begint een nieuwe alinea.">
              <textarea
                value={content.body}
                onChange={(e) => update("body", e.target.value)}
                rows={10}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Linktekst (optioneel)">
                <input
                  value={content.linkText}
                  onChange={(e) => update("linkText", e.target.value)}
                  className={inputClass}
                  placeholder="Bekijk de data"
                />
              </Field>
              <Field label="Link-URL (optioneel)">
                <input
                  value={content.linkUrl}
                  onChange={(e) => update("linkUrl", e.target.value)}
                  className={inputClass}
                  placeholder="https://mytable.club/..."
                />
              </Field>
            </div>
          </div>

          <div className="space-y-3">
            <p className={labelClass}>Voorbeeld</p>
            <div className="rounded-xl border border-border-subtle bg-white p-3 text-sm">
              <p className="text-wine">
                <span className="text-wine/50">Onderwerp: </span>
                {content.subject || "-"}
              </p>
              <p className="text-wine/60">
                <span className="text-wine/50">Preview: </span>
                {content.previewText || "-"}
              </p>
            </div>
            <iframe
              title="Voorbeeld van de mail"
              srcDoc={preview.html}
              sandbox=""
              className="h-[420px] w-full rounded-xl border border-border-subtle bg-white"
            />
            <p className="text-xs text-wine/50">
              Voorbeeld met de voornaam van de eerste ontvanger. In de echte
              mail krijgt de link UTM-tags en een persoonlijke r-code.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4 border-t border-border-subtle/80 pt-5">
          {error ? <p className="text-sm text-wine/60">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTest}
              disabled={Boolean(error) || testState.kind === "sending" || sending}
              className="rounded-full border border-burgundy/40 px-4 py-2 text-sm font-medium text-burgundy transition hover:bg-burgundy/5 disabled:opacity-50"
            >
              {testState.kind === "sending"
                ? "Testmail versturen..."
                : "Stuur testmail naar mij"}
            </button>
            {testState.kind === "sent" ? (
              <span className="text-sm text-wine/70">
                Testmail verstuurd naar {testState.to}. Check hem in je inbox.
              </span>
            ) : null}
            {testState.kind === "error" ? (
              <span className="text-sm text-rose-deep">{testState.error}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={!testSent || overCap || n === 0 || sending}
              inputMode="numeric"
              placeholder={`Typ ${n} om te bevestigen`}
              className="w-56 rounded-full border border-border-subtle bg-cream px-4 py-2 text-sm text-wine outline-none focus:border-burgundy/40 disabled:opacity-50"
              aria-label="Aantal ontvangers ter bevestiging"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="rounded-full bg-burgundy px-5 py-2 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-40"
            >
              {sending ? "Bezig met versturen..." : `Verstuur naar ${n} mensen`}
            </button>
            {!testSent ? (
              <span className="text-xs text-wine/50">
                Stuur eerst een testmail naar jezelf.
              </span>
            ) : null}
          </div>

          {sending ? (
            <p className="text-sm text-wine/65">
              De mails gaan een voor een de deur uit. Dat duurt ongeveer{" "}
              {estimatedMinutes} minuut{estimatedMinutes === 1 ? "" : "en"}. Laat
              dit venster open.
            </p>
          ) : null}

          {result ? (
            result.ok ? (
              <div className="rounded-xl border border-border-subtle bg-white p-4 text-sm text-wine">
                <p className="font-medium">
                  {result.sent} verstuurd, {result.failed} mislukt.
                </p>
                {result.failures.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-wine/70">
                    {result.failures.map((f) => (
                      <li key={f.email}>
                        {f.email}: {f.error}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-rose-deep">{result.error}</p>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}

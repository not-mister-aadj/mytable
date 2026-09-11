"use client";

import { OUTREACH_PLACEHOLDERS } from "@/lib/outreach/constants";
import {
  fillOutreachTemplate,
  unknownPlaceholders,
  type OutreachTemplateContext,
} from "@/lib/outreach/render-template";

/**
 * Subject and body for a mail written by hand, with a live preview filled in
 * for one real venue. Placeholders work exactly as they do in templates, so one
 * text can go to a whole selection with each venue's own name in it.
 */
export function CustomMailFields({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  previewProspect,
  disabled,
}: {
  subject: string;
  body: string;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  /** The venue the preview is filled in for; null hides the preview. */
  previewProspect: OutreachTemplateContext | null;
  disabled?: boolean;
}) {
  const unknown = unknownPlaceholders(`${subject}\n${body}`);
  const showPreview = Boolean(previewProspect && (subject.trim() || body.trim()));

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
          Onderwerp
        </span>
        <input
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          disabled={disabled}
          placeholder="Re: tafel reserveren op zondagmiddag"
          className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
          Tekst
        </span>
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          disabled={disabled}
          rows={10}
          className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm leading-relaxed text-wine outline-none focus:border-burgundy/40"
        />
      </label>

      <p className="text-xs text-wine/55">
        Placeholders:{" "}
        {OUTREACH_PLACEHOLDERS.map((placeholder) => (
          <span key={placeholder.token} className="mr-3 whitespace-nowrap">
            <code className="rounded bg-wine/[0.06] px-1 py-0.5 font-mono">
              {placeholder.token}
            </code>{" "}
            {placeholder.description}
          </span>
        ))}
      </p>

      {unknown.length > 0 ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-xs text-red-800">
          Onbekende placeholder: {unknown.join(", ")} — die blijft letterlijk zo in
          de mail staan.
        </p>
      ) : null}

      {showPreview && previewProspect ? (
        <div className="rounded-xl border border-border-subtle bg-cream p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
            Voorbeeld voor {previewProspect.name}
          </p>
          <p className="mt-1 text-sm font-medium text-burgundy">
            {fillOutreachTemplate(subject, previewProspect)}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-wine/80">
            {fillOutreachTemplate(body, previewProspect)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

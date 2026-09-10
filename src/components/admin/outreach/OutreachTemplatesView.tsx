"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminPath } from "@/lib/admin-url";
import {
  OUTREACH_PLACEHOLDERS,
  OUTREACH_TEMPLATE_KINDS,
  OUTREACH_TEMPLATE_KIND_LABELS,
  type OutreachTemplateKind,
} from "@/lib/outreach/constants";
import type { OutreachTemplateRow } from "@/lib/outreach/templates-data";
import {
  deleteTemplateAction,
  saveTemplateAction,
} from "@/app/admin/(dashboard)/outreach/actions";

type Draft = {
  id?: string;
  key: string;
  name: string;
  kind: OutreachTemplateKind;
  step: number | null;
  delayDays: number;
  subject: string;
  body: string;
  attachmentPath: string | null;
  attachmentName: string | null;
  isActive: boolean;
};

function toDraft(template: OutreachTemplateRow): Draft {
  return {
    id: template.id,
    key: template.key,
    name: template.name,
    kind: (template.kind as OutreachTemplateKind) ?? "sequence",
    step: template.step,
    delayDays: template.delayDays,
    subject: template.subject,
    body: template.body,
    attachmentPath: template.attachmentPath,
    attachmentName: template.attachmentName,
    isActive: template.isActive,
  };
}

function emptyDraft(nextStep: number): Draft {
  return {
    key: `venue-step-${nextStep}`,
    name: `${nextStep}. Nieuwe mail`,
    kind: "sequence",
    step: nextStep,
    delayDays: 4,
    subject: "",
    body: "",
    attachmentPath: null,
    attachmentName: null,
    isActive: true,
  };
}

function TemplateEditor({
  draft,
  onChange,
  onSave,
  onCancel,
  onDelete,
  pending,
}: {
  draft: Draft;
  onChange: (draft: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  pending: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/outreach/attachment", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        path?: string;
        name?: string;
        error?: string;
      };
      if (!response.ok || !data.path) {
        setUploadError(data.error ?? "Upload mislukt.");
        return;
      }
      onChange({
        ...draft,
        attachmentPath: data.path,
        attachmentName: data.name ?? file.name,
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-burgundy/25 bg-cream p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
            Naam
          </span>
          <input
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
            Sleutel
          </span>
          <input
            value={draft.key}
            onChange={(event) => onChange({ ...draft, key: event.target.value })}
            className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 font-mono text-xs text-wine outline-none focus:border-burgundy/40"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
            Soort
          </span>
          <select
            value={draft.kind}
            onChange={(event) =>
              onChange({
                ...draft,
                kind: event.target.value as OutreachTemplateKind,
              })
            }
            className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
          >
            {OUTREACH_TEMPLATE_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {OUTREACH_TEMPLATE_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </label>
        {draft.kind === "sequence" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
                Stap
              </span>
              <input
                type="number"
                min={1}
                value={draft.step ?? 1}
                onChange={(event) =>
                  onChange({ ...draft, step: Number(event.target.value) || 1 })
                }
                className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
                Wacht (dagen)
              </span>
              <input
                type="number"
                min={0}
                value={draft.delayDays}
                onChange={(event) =>
                  onChange({ ...draft, delayDays: Number(event.target.value) || 0 })
                }
                className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
              />
            </label>
          </div>
        ) : null}
      </div>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
          Onderwerp
        </span>
        <input
          value={draft.subject}
          onChange={(event) => onChange({ ...draft, subject: event.target.value })}
          className="mt-1 w-full rounded-xl border border-border-subtle bg-cream px-3 py-2 text-sm text-wine outline-none focus:border-burgundy/40"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-wine/45">
          Tekst
        </span>
        <textarea
          value={draft.body}
          onChange={(event) => onChange({ ...draft, body: event.target.value })}
          rows={14}
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

      <div className="flex flex-wrap items-center gap-3 border-t border-border-subtle/60 pt-4">
        <label className="text-sm text-wine/70">
          <span className="mr-2">PDF-bijlage</span>
          <input
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
            }}
            className="text-xs"
          />
        </label>
        {draft.attachmentName ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-cream px-3 py-1 text-xs text-wine/70">
            📎 {draft.attachmentName}
            <button
              type="button"
              onClick={() =>
                onChange({ ...draft, attachmentPath: null, attachmentName: null })
              }
              className="text-wine/45 hover:text-red-700"
            >
              ×
            </button>
          </span>
        ) : null}
        {uploading ? <span className="text-xs text-wine/50">Uploaden…</span> : null}
        {uploadError ? (
          <span className="text-xs text-red-700">{uploadError}</span>
        ) : null}
        <label className="ml-auto flex items-center gap-2 text-sm text-wine/70">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) =>
              onChange({ ...draft, isActive: event.target.checked })
            }
            className="h-4 w-4 accent-[#600D1E]"
          />
          Actief
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="rounded-full bg-burgundy px-5 py-2 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-40"
        >
          {pending ? "Bezig…" : "Opslaan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border-subtle px-4 py-2 text-sm text-wine/70 transition hover:border-burgundy/40"
        >
          Annuleer
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="ml-auto rounded-full border border-border-subtle px-4 py-2 text-sm text-wine/60 transition hover:border-red-400 hover:text-red-700"
          >
            Verwijderen
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function OutreachTemplatesView({
  templates,
}: {
  templates: OutreachTemplateRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const nextStep =
    templates.filter((template) => template.kind === "sequence").length + 1;

  function save(current: Draft) {
    setMessage(null);
    startTransition(async () => {
      const result = await saveTemplateAction(current);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setDraft(null);
      setMessage("Template opgeslagen.");
      router.refresh();
    });
  }

  function remove(template: OutreachTemplateRow) {
    if (!confirm(`"${template.name}" verwijderen?`)) return;
    startTransition(async () => {
      const result = await deleteTemplateAction(template.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setDraft(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={adminPath("/outreach")}
            className="text-sm text-wine/60 transition hover:text-burgundy"
          >
            ← Outreach
          </Link>
          <h1 className="mt-3 font-serif text-3xl text-burgundy sm:text-4xl">
            Templates
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            De sequence loopt op stap: stap 1 gaat direct, elke volgende stap wordt
            pas klaargezet na het aantal dagen dat je hier instelt. Antwoordt een
            zaak, dan stopt de sequence en gebruik je het antwoord-template.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft(emptyDraft(nextStep))}
          className="shrink-0 rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-burgundy/90"
        >
          Nieuw template
        </button>
      </div>

      {message ? (
        <p className="rounded-2xl border border-burgundy/20 bg-burgundy/[0.05] px-5 py-4 text-sm text-burgundy">
          {message}
        </p>
      ) : null}

      {draft && !draft.id ? (
        <TemplateEditor
          draft={draft}
          onChange={setDraft}
          onSave={() => save(draft)}
          onCancel={() => setDraft(null)}
          pending={pending}
        />
      ) : null}

      <div className="space-y-4">
        {templates.map((template) =>
          draft?.id === template.id ? (
            <TemplateEditor
              key={template.id}
              draft={draft}
              onChange={setDraft}
              onSave={() => save(draft)}
              onCancel={() => setDraft(null)}
              onDelete={() => remove(template)}
              pending={pending}
            />
          ) : (
            <button
              key={template.id}
              type="button"
              onClick={() => setDraft(toDraft(template))}
              className="block w-full rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 text-left transition hover:border-burgundy/40"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-burgundy">
                  {template.name}
                </span>
                <span className="rounded-full border border-border-subtle px-2.5 py-0.5 text-xs text-wine/60">
                  {OUTREACH_TEMPLATE_KIND_LABELS[
                    template.kind as OutreachTemplateKind
                  ] ?? template.kind}
                  {template.kind === "sequence" && template.step
                    ? ` ${template.step} · na ${template.delayDays} dagen`
                    : ""}
                </span>
                {template.attachmentName ? (
                  <span className="text-xs text-wine/55">
                    📎 {template.attachmentName}
                  </span>
                ) : null}
                {!template.isActive ? (
                  <span className="text-xs text-wine/45">inactief</span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-wine/75">{template.subject}</p>
              <p className="mt-1 line-clamp-2 text-xs text-wine/50">
                {template.body.slice(0, 180)}…
              </p>
            </button>
          ),
        )}
      </div>
    </div>
  );
}

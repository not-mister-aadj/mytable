"use client";

import { useState, useTransition } from "react";
import { saveWaitlistWhatsappLinksAction } from "@/app/admin/(dashboard)/waitlist/actions";
import type { WaitlistWhatsappLinks } from "@/lib/waitlist-whatsapp";
import {
  WAITLIST_WHATSAPP_INTERESTS,
  WAITLIST_WHATSAPP_LABELS,
} from "@/lib/waitlist-whatsapp";

export function WaitlistWhatsappLinksForm({
  initialLinks,
}: {
  initialLinks: WaitlistWhatsappLinks;
}) {
  const [links, setLinks] = useState(initialLinks);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveWaitlistWhatsappLinksAction(formData);
      if (result.ok) {
        setMessage("WhatsApp-links opgeslagen.");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border-subtle/80 bg-cream/60 p-5 shadow-[0_8px_30px_rgba(43,13,18,0.03)] sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-xl text-burgundy">WhatsApp-groepen</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-wine/65">
            Plak hier de invite-link per ervaring. Op het bedankscherm krijgt
            iemand alleen de link die bij hun eerste keuze past. Leeg = geen
            WhatsApp-knop tonen.
          </p>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-burgundy px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-burgundy/90 disabled:opacity-60"
        >
          {pending ? "Opslaan…" : "Opslaan"}
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {WAITLIST_WHATSAPP_INTERESTS.map((id) => (
          <label key={id} className="block">
            <span className="text-sm font-medium text-wine">
              {WAITLIST_WHATSAPP_LABELS[id]}
            </span>
            <input
              type="url"
              name={id}
              value={links[id]}
              onChange={(event) =>
                setLinks((current) => ({
                  ...current,
                  [id]: event.target.value,
                }))
              }
              placeholder="https://chat.whatsapp.com/…"
              className="mt-2 w-full rounded-xl border border-border-subtle bg-cream px-3.5 py-2.5 text-sm text-wine outline-none transition placeholder:text-wine/30 focus:border-burgundy/40 focus:ring-2 focus:ring-burgundy/10"
            />
          </label>
        ))}
      </div>

      {message ? (
        <p className="mt-4 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-rose-deep">{error}</p> : null}
    </form>
  );
}

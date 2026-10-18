"use client";

import { useEffect, useState } from "react";
import type { CustomerSentEmail } from "@/lib/admin-customer-profile-extras";

const longDateTime = new Intl.DateTimeFormat("nl-NL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Amsterdam",
});

/** An email exactly as it was sent (from email_log), in a sandboxed frame. */
export function EmailPreviewDialog({
  logId,
  subject,
  sentAt,
  to,
  onClose,
}: {
  logId: string;
  subject: string;
  sentAt: string;
  to: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={subject}
      className="fixed inset-0 z-50 flex items-center justify-center bg-wine/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-beige shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
          <div className="min-w-0">
            <p className="truncate font-medium text-wine">{subject}</p>
            <p className="mt-0.5 text-xs text-wine/55">
              Aan {to} · {longDateTime.format(new Date(sentAt))}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="rounded-full border border-border-subtle bg-cream px-3 py-1.5 text-sm text-wine transition hover:border-burgundy/30"
          >
            Sluiten
          </button>
        </div>
        <iframe title={subject} src={`/api/admin/email-log/${logId}`} sandbox="" className="w-full flex-1 bg-white" />
      </div>
    </div>
  );
}

/** The customer profile's list of sent mails; logged ones open in a preview. */
export function SentEmailsList({ emails, to }: { emails: CustomerSentEmail[]; to: string }) {
  const [open, setOpen] = useState<CustomerSentEmail | null>(null);
  return (
    <>
      <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1">
        {emails.map((email) => (
          <li key={email.id} className="border-b border-border-subtle/40 pb-3 last:border-0 last:pb-0">
            <p className="text-xs text-wine/45">
              {longDateTime.format(new Date(email.createdAt))}
              {email.kind ? <span className="ml-2 text-wine/60">{email.kind}</span> : null}
            </p>
            {email.logId ? (
              <button
                type="button"
                onClick={() => setOpen(email)}
                className="mt-0.5 text-left font-medium text-wine underline decoration-wine/25 underline-offset-2 transition hover:text-burgundy"
              >
                {email.subject}
              </button>
            ) : (
              <p className="mt-0.5 font-medium text-wine">{email.subject}</p>
            )}
            {email.campaign ? <p className="mt-0.5 text-xs text-wine/55">Campagne: {email.campaign}</p> : null}
          </li>
        ))}
      </ul>
      {open?.logId ? (
        <EmailPreviewDialog
          logId={open.logId}
          subject={open.subject}
          sentAt={open.createdAt}
          to={to}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}

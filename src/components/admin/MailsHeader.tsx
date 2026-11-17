import Link from "next/link";
import type { ReactNode } from "react";
import { adminPath } from "@/lib/admin-url";

export type MailsTab = "overzicht" | "verstuurd" | "cijfers";

const TABS: Array<{ id: MailsTab; label: string; path: string }> = [
  { id: "overzicht", label: "Overzicht", path: "/emails" },
  { id: "verstuurd", label: "Verstuurd", path: "/emails?tab=verstuurd" },
  { id: "cijfers", label: "Cijfers", path: "/email-preview" },
];

/** The title and tabs shared by the three mail pages. */
export function MailsHeader({ tab, hostname, children }: { tab: MailsTab; hostname: string; children?: ReactNode }) {
  return (
    <header>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl text-burgundy sm:text-4xl">Mails</h1>
        {children}
      </div>
      <nav aria-label="Onderdelen van Mails" className="mt-5 flex gap-1 overflow-x-auto border-b border-border-subtle">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={adminPath(t.path, hostname)}
            aria-current={t.id === tab ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
              t.id === tab ? "border-burgundy text-burgundy" : "border-transparent text-wine/60 hover:text-burgundy"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

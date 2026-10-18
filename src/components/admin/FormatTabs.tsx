import Link from "next/link";
import { adminPath } from "@/lib/admin-url";

/** Tabs on the "Planning" pages: the series that create Sundays, and the
 * calendar. Single Sundays live under "Alle zondagen"; the old invite-based
 * Sunday Table overview (/sunday-tables) still works by its address. */
export function FormatTabs({
  active,
  hostname,
}: {
  active: "experiences" | "sunday-table" | "jouw-tafel" | "jouw-tafel-kalender";
  hostname?: string;
}) {
  const tabs = [
    { key: "jouw-tafel" as const, label: "Reeksen", href: adminPath("/jouw-tafel", hostname) },
    { key: "jouw-tafel-kalender" as const, label: "Kalender", href: adminPath("/jouw-tafel/kalender", hostname) },
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-border-subtle">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            active === tab.key
              ? "border-burgundy text-burgundy"
              : "border-transparent text-wine/55 hover:text-burgundy"
          }`}
          aria-current={active === tab.key ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

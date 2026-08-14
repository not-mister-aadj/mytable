import Link from "next/link";
import { adminPath } from "@/lib/admin-url";

/** Tabs inside the unified "Tafels" section — Sunday Table lives on a
 * different data model (invite-based, location revealed later, no direct
 * price/capacity like a bookable experience), so it stays its own route.
 * This just makes it feel like one section, one tap from the sidebar. */
export function FormatTabs({
  active,
  hostname,
}: {
  active: "experiences" | "sunday-table";
  hostname?: string;
}) {
  const tabs = [
    { key: "experiences" as const, label: "Experiences", href: adminPath("/events", hostname) },
    { key: "sunday-table" as const, label: "Sunday Table", href: adminPath("/sunday-tables", hostname) },
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

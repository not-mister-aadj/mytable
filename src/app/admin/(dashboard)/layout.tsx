import { AdminShell, type AdminNavItem } from "@/components/admin/AdminShell";
import { adminPath, adminUrlForHost, resolveHostname } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Five sections, each with its own pages. "Vandaag" is what needs doing; the
// rest follows the work: Sundays, people, growth, settings.
type NavDef = { label: string; path: string; exact?: boolean; matchAlso?: string[]; children?: NavDef[] };
const NAV: NavDef[] = [
  { label: "Vandaag", path: "/", exact: true },
  {
    label: "Zondagen",
    path: "/events",
    children: [
      { label: "Alle zondagen", path: "/events", matchAlso: ["/sunday-tables"] },
      { label: "Boekingen", path: "/bookings" },
      { label: "Planning", path: "/jouw-tafel" },
    ],
  },
  {
    label: "Mensen",
    path: "/customers",
    children: [
      { label: "Klanten", path: "/customers" },
      { label: "Wachtlijst", path: "/priority-list" },
      { label: "Wachtlijstantwoorden", path: "/customers/antwoorden" },
    ],
  },
  {
    label: "Groei",
    path: "/analytics",
    children: [
      { label: "Analytics", path: "/analytics" },
      { label: "Outreach", path: "/outreach" },
    ],
  },
  {
    label: "Instellingen",
    path: "/venues",
    children: [
      { label: "Venues", path: "/venues" },
      { label: "Types", path: "/experience-types" },
      { label: "E-mailtemplates", path: "/email-preview" },
    ],
  },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3001";
  const hostname = resolveHostname(host) ?? host.split(":")[0].toLowerCase();

  const toItem = (item: NavDef): AdminNavItem => ({
    label: item.label,
    href: adminPath(item.path, hostname),
    exact: item.exact,
    matchAlso: item.matchAlso?.map((p) => adminPath(p, hostname)),
    children: item.children?.map(toItem),
  });
  const navItems: AdminNavItem[] = NAV.map(toItem);

  async function signOut() {
    "use server";
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
    const proto = h.get("x-forwarded-proto") ?? "http";
    redirect(adminUrlForHost("/login", host, proto));
  }

  return (
    <AdminShell
      userEmail={user.email ?? ""}
      brandHref={adminPath("/", hostname)}
      navItems={navItems}
      signOutAction={signOut}
    >
      {children}
    </AdminShell>
  );
}

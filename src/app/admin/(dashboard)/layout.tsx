import { AdminShell, type AdminNavItem } from "@/components/admin/AdminShell";
import { adminPath, adminUrlForHost, resolveHostname } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Ordered by what actually matters right now: the waitlist is the business
// today, Tafels (incl. the Sunday Table tab) is how it turns into real
// tables, the rest supports the still-live /agenda catalog and booking flow.
const NAV_ITEM_PATHS = [
  { label: "Dashboard", path: "/", exact: true },
  { label: "Wachtlijst", path: "/priority-list" },
  // Sunday Table lives on its own route (different data model — invite-based,
  // no direct price/capacity) but is a tab inside this same section, one tap
  // from the sidebar. See FormatTabs.tsx.
  { label: "Tafels", path: "/events", matchAlsoPaths: ["/sunday-tables"] },
  { label: "Venues", path: "/venues" },
  { label: "Types", path: "/experience-types" },
  { label: "Boekingen", path: "/bookings" },
  { label: "Klanten", path: "/customers" },
  { label: "Analytics", path: "/analytics" },
  { label: "E-mails", path: "/email-preview" },
] as const;

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

  const navItems: AdminNavItem[] = NAV_ITEM_PATHS.map((item) => ({
    label: item.label,
    href: adminPath(item.path, hostname),
    exact: "exact" in item ? item.exact : undefined,
    matchAlso:
      "matchAlsoPaths" in item
        ? item.matchAlsoPaths.map((p) => adminPath(p, hostname))
        : undefined,
  }));

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

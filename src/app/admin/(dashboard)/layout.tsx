import { AdminShell, type AdminNavItem } from "@/components/admin/AdminShell";
import { adminPath, adminUrlForHost } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: adminPath("/"), exact: true },
  { label: "Tafels", href: adminPath("/events") },
  { label: "Venues", href: adminPath("/venues") },
  { label: "Types", href: adminPath("/experience-types") },
  { label: "Boekingen", href: adminPath("/bookings") },
  { label: "Klanten", href: adminPath("/customers") },
  { label: "Wachtlijst", href: adminPath("/waitlist") },
  { label: "Analytics", href: adminPath("/analytics") },
  { label: "E-mails", href: adminPath("/email-preview") },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

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
      brandHref={adminPath("/")}
      navItems={NAV_ITEMS}
      signOutAction={signOut}
    >
      {children}
    </AdminShell>
  );
}

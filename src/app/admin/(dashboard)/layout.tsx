import Link from "next/link";
import { adminPath, adminUrl } from "@/lib/admin-url";
import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    redirect(adminUrl("/login"));
  }

  return (
    <div className="min-h-screen bg-cream text-wine">
      <header className="border-b border-border-subtle bg-beige">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={adminPath("/")} className="font-serif text-xl text-burgundy">
            MyTable Admin
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href={adminPath("/events")} className="hover:text-burgundy">
              Tafels
            </Link>
            <Link href={adminPath("/venues")} className="hover:text-burgundy">
              Venues
            </Link>
            <Link
              href={adminPath("/experience-types")}
              className="hover:text-burgundy"
            >
              Types
            </Link>
            <Link href={adminPath("/bookings")} className="hover:text-burgundy">
              Boekingen
            </Link>
            <span className="text-wine/50">{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="text-wine/70 hover:text-burgundy">
                Uitloggen
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

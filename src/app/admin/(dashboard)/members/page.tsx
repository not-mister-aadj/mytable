import { requireAdmin } from "@/lib/admin-auth";
import { MembersView } from "@/components/admin/MembersView";
import { isDbConfigured } from "@/db/index";
import { getAdminMembersPageData } from "@/lib/admin-members-data";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  await requireAdmin();

  if (!isDbConfigured()) {
    return <p>Database niet geconfigureerd.</p>;
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return (
      <p className="text-wine/70">
        Supabase admin keys ontbreken. Zet{" "}
        <code className="text-wine">NEXT_PUBLIC_SUPABASE_URL</code> en{" "}
        <code className="text-wine">SUPABASE_SERVICE_ROLE_KEY</code> om members
        te laden.
      </p>
    );
  }

  const data = await getAdminMembersPageData();

  return <MembersView data={data} />;
}

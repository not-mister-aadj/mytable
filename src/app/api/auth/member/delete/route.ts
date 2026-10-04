import { NextResponse } from "next/server";
import { getMemberUser } from "@/lib/member-auth";
import { deleteMemberData } from "@/lib/jouw-tafel/account-server";
import { endMembershipsForDeletedAccount } from "@/lib/membership/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * "Account verwijderen" (POST /api/auth/member/delete): only ever the
 * signed-in person's own account. Deletes their waitlist and notify rows,
 * customer profile and activity log (bookings stay, unlinked: see
 * deleteMemberData), then the auth user itself, which takes the quiz
 * answers in its metadata with it. A running membership is cancelled in
 * Stripe straight away (see endMembershipsForDeletedAccount). The browser signs out and clears its
 * local copy of the answers afterwards.
 */
export async function POST() {
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // A running membership stops first: no payments after the account is gone.
    await endMembershipsForDeletedAccount(user.id);
    await deleteMemberData(user.email);
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (error) {
    console.error("[jouw-tafel settings] account delete failed:", error);
    return NextResponse.json({ error: "Could not delete" }, { status: 500 });
  }
  // End the session cookie on this device too.
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // The user is gone; the browser signs out as well.
  }
  return NextResponse.json({ ok: true });
}

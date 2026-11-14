import { NextResponse } from "next/server";
import { getMemberUser } from "@/lib/member-auth";
import { codeRequiredResponse } from "@/lib/auth/mail-login";
import { endComplimentaryMembership } from "@/lib/membership/data";

/**
 * POST /api/membership/end-free: the signed-in person ends their free
 * membership ("Afmelden" in the account). Paid memberships end through
 * the Stripe portal instead.
 */
export async function POST() {
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Signed in from a mail: this step asks for a code first.
  const codeFirst = await codeRequiredResponse();
  if (codeFirst) return codeFirst;
  const ended = await endComplimentaryMembership(user.email);
  return ended ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not_found" }, { status: 404 });
}

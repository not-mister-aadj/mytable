import { NextResponse } from "next/server";
import { attributeReferralSignup } from "@/lib/referral";
import { getMemberUser } from "@/lib/member-auth";

export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code?: string };
  try {
    body = (await request.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const code = body.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const ok = await attributeReferralSignup({
    code,
    refereeEmail: user.email,
    refereeUserId: user.id,
  });

  return NextResponse.json({ ok });
}

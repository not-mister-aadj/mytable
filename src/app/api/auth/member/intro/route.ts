import { NextResponse } from "next/server";
import { getMemberUser } from "@/lib/member-auth";
import { savePersonIntro, type PersonIntroPatch } from "@/lib/sunday-table-intro";

const TEXT_FIELDS = ["askMeAbout", "favoriteSpot", "intoNow"] as const;
type TextField = (typeof TEXT_FIELDS)[number];

/**
 * "Aan tafel" on the settings page (POST /api/auth/member/intro): one of the
 * open answers ({ field, value }), saved on the person and on their Sunday
 * tables still more than a day ahead. Empty clears it.
 */
export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { field?: unknown; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const field = TEXT_FIELDS.includes(body.field as TextField) ? (body.field as TextField) : null;
  if (!field || typeof body.value !== "string") return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  const patch: PersonIntroPatch = { [field]: body.value };
  try {
    // Filling it in under "Je tafelgenoten zien dit" is the consent to share it, as on the booking form.
    await savePersonIntro(user.email, patch, { shareConsent: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[member intro] save failed", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
}

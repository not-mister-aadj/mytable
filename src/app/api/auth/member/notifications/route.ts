import { NextResponse } from "next/server";
import { getMemberUser } from "@/lib/member-auth";
import { setTableMailsOn } from "@/lib/jouw-tafel/account-server";
import { QUIZ_METADATA_KEY, sanitizeQuizState } from "@/lib/jouw-tafel/quiz-logic";

/**
 * "Mail me over nieuwe tafels in mijn steden" on the settings page (POST
 * /api/auth/member/notifications, body { on, locale }). Only for the
 * signed-in person's own email; see setTableMailsOn for what it changes.
 */
export async function POST(request: Request) {
  const user = await getMemberUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { on?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.on !== "boolean") return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const name = sanitizeQuizState((user.user_metadata ?? {})[QUIZ_METADATA_KEY]).answers.name;
  try {
    await setTableMailsOn({ email: user.email, on: body.on, locale: body.locale === "en" ? "en" : "nl", name });
  } catch (error) {
    console.error("[jouw-tafel settings] mail switch failed:", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, on: body.on });
}

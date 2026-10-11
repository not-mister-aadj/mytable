import { NextResponse } from "next/server";
import { getQuizPerson } from "@/lib/jouw-tafel/guest-server";
import { QUIZ_METADATA_KEY, sanitizeQuizState } from "@/lib/jouw-tafel/quiz-logic";

export const dynamic = "force-dynamic";

/**
 * Who is booking, for the date page's booking card
 * (GET /api/jouw-tafel/guest/me): the email, first name and date of birth
 * this browser's guest (or signed-in account) already gave in the quiz, so
 * the card comes filled in. Only their own data: it reads the httpOnly
 * guest cookie or the session. { known: false } for anyone else.
 */
export async function GET() {
  const person = await getQuizPerson().catch(() => null);
  if (!person) return NextResponse.json({ known: false });
  const answers =
    person.kind === "user"
      ? sanitizeQuizState((person.user.user_metadata ?? {})[QUIZ_METADATA_KEY]).answers
      : person.guest.state.answers;
  return NextResponse.json({
    known: true,
    email: person.kind === "user" ? person.user.email : person.guest.email,
    name: answers.name ?? null,
    birthDate: answers.birthDate ?? null,
  });
}

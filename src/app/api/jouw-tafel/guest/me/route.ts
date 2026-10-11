import { NextResponse } from "next/server";
import { getQuizPerson } from "@/lib/jouw-tafel/guest-server";
import { QUIZ_METADATA_KEY, sanitizeQuizState } from "@/lib/jouw-tafel/quiz-logic";
import { getRunningMembershipForUser, membershipSnapshot } from "@/lib/membership/data";
import { freeGuestAvailable, isActiveMember } from "@/lib/membership/logic";
import { guestSeatCents, isMembershipPlanId } from "@/lib/membership/plans";

export const dynamic = "force-dynamic";

/**
 * Who is booking, for the date page's booking card
 * (GET /api/jouw-tafel/guest/me): the email, first name and date of birth
 * this browser's guest (or signed-in account) already gave in the quiz, so
 * the card comes filled in. Only their own data: it reads the httpOnly
 * guest cookie or the session. { known: false } for anyone else.
 * For a signed-in member also `member`: their seat is included, and what a
 * guest costs (nothing, when the free guest of every 3 months is there).
 */
export async function GET() {
  const person = await getQuizPerson().catch(() => null);
  if (!person) return NextResponse.json({ known: false });
  const answers =
    person.kind === "user"
      ? sanitizeQuizState((person.user.user_metadata ?? {})[QUIZ_METADATA_KEY]).answers
      : person.guest.state.answers;
  const membership = person.kind === "user" ? await getRunningMembershipForUser(person.user.id).catch(() => null) : null;
  const member =
    membership && isMembershipPlanId(membership.plan) && isActiveMember(membershipSnapshot(membership))
      ? {
          guestCents: guestSeatCents(membership.plan),
          freeGuest: freeGuestAvailable(membership.freeGuestUsedFor),
          endsAt: membership.cancelAtPeriodEnd ? (membership.currentPeriodEnd?.toISOString() ?? null) : null,
        }
      : null;
  return NextResponse.json({
    member,
    known: true,
    email: person.kind === "user" ? person.user.email : person.guest.email,
    name: answers.name ?? null,
    birthDate: answers.birthDate ?? null,
  });
}

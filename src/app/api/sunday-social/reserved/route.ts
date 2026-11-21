import { NextResponse, type NextRequest } from "next/server";
import { getQuizPerson } from "@/lib/jouw-tafel/guest-server";
import { getRunningMembershipForUser, membershipSnapshot } from "@/lib/membership/data";
import { isActiveMember } from "@/lib/membership/logic";
import { getReservedVenues } from "@/lib/partner-venues";

export const dynamic = "force-dynamic";

/**
 * The bars we reserved for one Sunday (GET /api/sunday-social/reserved?eventId=),
 * with the seats left: only for a signed-in member, who picks one when booking.
 * { venues: null } for everyone else.
 */
export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId")?.trim() ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) return NextResponse.json({ venues: null }, { status: 400 });
  const person = await getQuizPerson().catch(() => null);
  if (person?.kind !== "user") return NextResponse.json({ venues: null });
  const membership = await getRunningMembershipForUser(person.user.id).catch(() => null);
  if (!membership || !isActiveMember(membershipSnapshot(membership))) return NextResponse.json({ venues: null });
  return NextResponse.json({ venues: await getReservedVenues(eventId) });
}

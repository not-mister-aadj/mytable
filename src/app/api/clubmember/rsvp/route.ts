import { NextResponse } from "next/server";
import { isDbConfigured } from "@/db/index";
import { updateSundayTableRsvp } from "@/lib/club/memberships";
import { getMemberUser } from "@/lib/member-auth";
import { PostHogEvents } from "@/lib/posthog/events";
import { captureServerEvent } from "@/lib/posthog/server";

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const user = await getMemberUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const signupId = typeof raw.signupId === "string" ? raw.signupId : "";
  if (!signupId) {
    return NextResponse.json({ error: "Missing signupId" }, { status: 400 });
  }

  const result = await updateSundayTableRsvp({
    signupId,
    email: user.email,
    userId: user.id,
    plusOne: typeof raw.plusOne === "boolean" ? raw.plusOne : undefined,
    cancel: raw.cancel === true,
    reactivate: raw.reactivate === true,
  });

  if ("error" in result) {
    const status =
      result.error === "Forbidden"
        ? 403
        : result.error === "Not found"
          ? 404
          : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  if (raw.reactivate === true) {
    void captureServerEvent(user.email, PostHogEvents.sundayRsvp, {
      signup_id: signupId,
    });
  }

  return NextResponse.json({ ok: true });
}

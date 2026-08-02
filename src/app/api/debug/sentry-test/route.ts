import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

/**
 * Temporary verification endpoint for Sentry first-error setup.
 * Disabled outside development unless DEBUG_SENTRY_TEST=1.
 */
export async function GET(request: Request) {
  const allowed =
    process.env.NODE_ENV === "development" ||
    process.env.DEBUG_SENTRY_TEST === "1";
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const marker =
    url.searchParams.get("marker")?.trim() ||
    `Sentry test error ${new Date().toISOString()}`;

  Sentry.captureException(new Error(marker));
  await Sentry.flush(2000);

  return NextResponse.json({
    ok: true,
    marker,
    message: "Exception sent to Sentry (if DSN is configured).",
  });
}

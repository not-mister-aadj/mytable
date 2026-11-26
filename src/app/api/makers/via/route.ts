import { NextResponse } from "next/server";
import { getApprovedMaker } from "@/lib/makers/server";

/** The first name of an approved maker, for "Via Sanne ..." on the booking card. */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  const maker = await getApprovedMaker(code).catch(() => null);
  if (!maker) return NextResponse.json({ name: null }, { status: 404 });
  const first = maker.name.trim().split(/\s+/)[0] ?? maker.name;
  return NextResponse.json({ name: first }, { headers: { "Cache-Control": "public, max-age=300" } });
}

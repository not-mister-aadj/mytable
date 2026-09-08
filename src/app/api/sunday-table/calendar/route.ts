import { NextResponse } from "next/server";
import {
  buildSundayTableIcs,
  type SundayTableCalendarInput,
} from "@/lib/sunday-table-calendar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city")?.trim() ?? "";
  const date = searchParams.get("date")?.trim() ?? "";
  const type = searchParams.get("type")?.trim() ?? "";
  const locale = searchParams.get("locale") === "en" ? "en" : "nl";
  const signupId = searchParams.get("signup_id")?.trim() || undefined;

  if (!city || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }
  if (type !== "girls_only" && type !== "mixed") {
    return NextResponse.json({ error: "Invalid table type" }, { status: 400 });
  }

  const input: SundayTableCalendarInput = {
    city,
    tableDate: date,
    tableType: type,
    locale,
    signupId,
  };

  const ics = buildSundayTableIcs(input);
  if (!ics) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const filename = `mytable-sunday-table-${date}.ics`;
  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}

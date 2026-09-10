import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient, MEDIA_BUCKET } from "@/lib/supabase/admin";

const MAX_PDF_BYTES = 8 * 1024 * 1024;

/** PDF one-pager that rides along with an outreach template. */
export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen bestand gekozen." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Alleen PDF-bestanden." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF is te groot (max 8 MB)." }, { status: 400 });
  }

  // Keep the original filename for the recipient, but store under a unique path.
  const safeName = file.name.replace(/[^\w.-]+/g, "-").slice(-80) || "bijlage.pdf";
  const path = `outreach/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ path, name: file.name });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload mislukt" },
      { status: 500 },
    );
  }
}

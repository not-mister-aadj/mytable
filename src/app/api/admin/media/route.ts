import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { createSupabaseAdminClient, MEDIA_BUCKET } from "@/lib/supabase/admin";
import {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
  validateImageFile,
} from "@/lib/image-settings";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list("", {
      limit: 200,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, items: [] },
        { status: error.message.includes("not found") ? 200 : 500 },
      );
    }

    const items = (data ?? [])
      .filter((f) => f.name && !f.name.endsWith("/"))
      .map((f) => {
        const path = f.name!;
        const {
          data: { publicUrl },
        } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
        const tag =
          typeof f.metadata?.tag === "string" ? f.metadata.tag : undefined;
        const createdAt =
          typeof f.created_at === "string" ? f.created_at : undefined;
        return { path, url: publicUrl, name: path, tag, createdAt };
      });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Media error", items: [] },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const form = await request.formData();
  const file = form.get("file");
  const tag = String(form.get("tag") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Geen bestand gekozen." }, { status: 400 });
  }
  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
    ? ext
    : "jpg";
  const mime =
    file.type && ALLOWED_IMAGE_MIME.includes(file.type as (typeof ALLOWED_IMAGE_MIME)[number])
      ? file.type
      : `image/${safeExt === "jpg" ? "jpeg" : safeExt}`;
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  try {
    const supabase = createSupabaseAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Afbeelding is te groot (max 10 MB)." },
        { status: 400 },
      );
    }

    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, {
      contentType: mime,
      upsert: false,
      metadata: tag ? { tag } : undefined,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

    return NextResponse.json({ path, url: publicUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { path } = (await request.json()) as { path?: string };
  if (!path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, isDbConfigured } from "@/db/index";
import { sundayTableReviews } from "@/db/schema";
import {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
  validateImageFile,
} from "@/lib/image-settings";
import { createSupabaseAdminClient, MEDIA_BUCKET } from "@/lib/supabase/admin";
import { resolveSundayTableReviewAccess } from "@/lib/sunday-table-reviews";

export const dynamic = "force-dynamic";

function tokenFromRequest(request: Request, form?: FormData): string | null {
  if (form) {
    const fromForm = String(form.get("token") ?? "").trim();
    if (fromForm) return fromForm;
  }
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("token")?.trim();
  return fromQuery || null;
}

export async function GET(request: Request) {
  const token = tokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ error: "Token ontbreekt." }, { status: 400 });
  }

  const access = await resolveSundayTableReviewAccess(token);
  if (!access.ok) {
    const status =
      access.reason === "invalid_token" || access.reason === "not_found"
        ? 404
        : access.reason === "not_eligible"
          ? 403
          : 503;
    return NextResponse.json(
      {
        error:
          access.reason === "not_eligible"
            ? "Deze review-link is alleen voor gasten die erbij waren."
            : access.reason === "db"
              ? "Even niet beschikbaar."
              : "Deze link is ongeldig of verlopen.",
      },
      { status },
    );
  }

  return NextResponse.json({
    city: access.signup.city,
    firstName: access.signup.name?.split(" ")[0] ?? null,
    locale: access.signup.locale === "en" ? "en" : "nl",
    alreadySubmitted: Boolean(access.existing),
    rating: access.existing?.rating ?? null,
  });
}

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database niet geconfigureerd." }, { status: 503 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let token: string | null = null;
  let rating = 0;
  let body: string | null = null;
  let marketingConsent = false;
  let photoFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    token = tokenFromRequest(request, form);
    rating = Number(form.get("rating"));
    const rawBody = String(form.get("body") ?? "").trim();
    body = rawBody || null;
    marketingConsent = String(form.get("marketingConsent") ?? "") === "true";
    const file = form.get("photo");
    photoFile = file instanceof File && file.size > 0 ? file : null;
  } else {
    const json = (await request.json()) as {
      token?: string;
      rating?: number;
      body?: string;
      marketingConsent?: boolean;
    };
    token = json.token?.trim() || null;
    rating = Number(json.rating);
    body = json.body?.trim() || null;
    marketingConsent = Boolean(json.marketingConsent);
  }

  if (!token) {
    return NextResponse.json({ error: "Token ontbreekt." }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Kies een score van 1 tot 5 sterren." },
      { status: 400 },
    );
  }

  const access = await resolveSundayTableReviewAccess(token);
  if (!access.ok) {
    const status =
      access.reason === "invalid_token" || access.reason === "not_found"
        ? 404
        : access.reason === "not_eligible"
          ? 403
          : 503;
    return NextResponse.json(
      {
        error:
          access.reason === "not_eligible"
            ? "Deze review-link is alleen voor gasten die erbij waren."
            : "Deze link is ongeldig of verlopen.",
      },
      { status },
    );
  }

  if (access.existing) {
    return NextResponse.json(
      { error: "Je hebt al een review gedeeld. Dank je." },
      { status: 409 },
    );
  }

  const needsBody = rating < 4 || rating === 5;
  if (needsBody) {
    if (!body || body.length < 20) {
      return NextResponse.json(
        {
          error:
            access.signup.locale === "en"
              ? rating < 4
                ? "Tell us what we could improve (a short note is enough)."
                : "Tell us a bit more (at least a short paragraph)."
              : rating < 4
                ? "Vertel wat we beter kunnen doen (een kort stukje is genoeg)."
                : "Vertel iets meer (minstens een kort stukje tekst).",
        },
        { status: 400 },
      );
    }
  } else {
    body = null;
  }

  if (rating !== 5) {
    marketingConsent = false;
    photoFile = null;
  }

  let photoUrl: string | null = null;
  if (photoFile) {
    const validationError = validateImageFile(photoFile);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    try {
      const supabase = createSupabaseAdminClient();
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      if (buffer.length > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "Afbeelding is te groot (max 10 MB)." },
          { status: 400 },
        );
      }
      const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
        ? ext
        : "jpg";
      const mime =
        photoFile.type &&
        ALLOWED_IMAGE_MIME.includes(
          photoFile.type as (typeof ALLOWED_IMAGE_MIME)[number],
        )
          ? photoFile.type
          : `image/${safeExt === "jpg" ? "jpeg" : safeExt}`;
      const path = `sunday-table-reviews/${access.signup.id}-${Date.now()}.${safeExt}`;
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, buffer, { contentType: mime, upsert: false });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      photoUrl = publicUrl;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Upload mislukt." },
        { status: 500 },
      );
    }
  }

  const locale = access.signup.locale === "en" ? "en" : "nl";
  const db = getDb();
  try {
    await db.insert(sundayTableReviews).values({
      signupId: access.signup.id,
      rating,
      body,
      photoUrl,
      marketingConsent: rating === 5 ? marketingConsent : false,
      locale,
      updatedAt: new Date(),
    });
  } catch {
    const [again] = await db
      .select()
      .from(sundayTableReviews)
      .where(eq(sundayTableReviews.signupId, access.signup.id))
      .limit(1);
    if (again) {
      return NextResponse.json(
        { error: "Je hebt al een review gedeeld. Dank je." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Opslaan mislukt. Probeer het opnieuw." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, rating });
}

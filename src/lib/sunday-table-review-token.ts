import { SignJWT, jwtVerify } from "jose";

const PURPOSE = "sunday_table_review";

function getSecret(): Uint8Array {
  const raw =
    process.env.REVIEW_TOKEN_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();
  if (!raw) {
    throw new Error("REVIEW_TOKEN_SECRET or CRON_SECRET is required");
  }
  return new TextEncoder().encode(raw);
}

export type SundayTableReviewTokenPayload = {
  signupId: string;
  email: string;
  purpose: typeof PURPOSE;
};

export async function signSundayTableReviewToken(input: {
  signupId: string;
  email: string;
  /** Seconds until expiry. Default 21 days. */
  expiresInSec?: number;
}): Promise<string> {
  return new SignJWT({
    signupId: input.signupId,
    email: input.email.toLowerCase(),
    purpose: PURPOSE,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${input.expiresInSec ?? 21 * 24 * 60 * 60}s`)
    .sign(getSecret());
}

export async function verifySundayTableReviewToken(
  token: string,
): Promise<SundayTableReviewTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.purpose !== PURPOSE) return null;
    const signupId =
      typeof payload.signupId === "string" ? payload.signupId : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    if (!signupId || !email) return null;
    return { signupId, email: email.toLowerCase(), purpose: PURPOSE };
  } catch {
    return null;
  }
}

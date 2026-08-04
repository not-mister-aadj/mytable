import { WomenWelcomeEmail } from "@/emails/WomenWelcomeEmail";
import { renderEmailForDelivery } from "@/lib/email/render-email";
import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  isEmailConfigured,
  type EmailSendResult,
} from "@/lib/email/resend";
import { womenWelcomeSubject } from "@/lib/email/subjects";
import {
  GIRLS_WHATSAPP_GROUP_URL,
  readOnboardingFromMetadata,
} from "@/lib/member-onboarding";
import { sundayTableLpPath, type Locale } from "@/i18n/config";
import { getSiteUrl } from "@/lib/admin-url";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function alreadySent(meta: Record<string, unknown> | null | undefined): boolean {
  return (
    meta?.women_welcome_email_sent === true ||
    meta?.women_welcome_email_sent === "true" ||
    typeof meta?.women_welcome_email_sent_at === "string"
  );
}

export async function sendWomenWelcomeEmail(input: {
  to: string;
  locale: Locale;
  firstName?: string;
}): Promise<EmailSendResult> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email not configured" };
  }
  const resend = getResendClient();
  if (!resend) {
    return { ok: false, error: "Resend unavailable" };
  }

  const site = getSiteUrl().replace(/\/$/, "");
  const sundayTableUrl = `${site}${sundayTableLpPath(input.locale)}`;
  const { html, text } = await renderEmailForDelivery(
    WomenWelcomeEmail({
      locale: input.locale,
      firstName: input.firstName,
      whatsappUrl: GIRLS_WHATSAPP_GROUP_URL,
      sundayTableUrl,
    }),
  );

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    replyTo: getEmailReplyTo(),
    to: input.to,
    subject: womenWelcomeSubject(input.locale),
    html,
    text,
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, id: data?.id };
}

/**
 * Send welcome + WhatsApp to women after onboarding. Idempotent per user.
 */
export async function sendWomenWelcomeEmailForUser(
  user: User,
  locale: Locale,
): Promise<{ sent: boolean; reason?: string }> {
  if (!user.email) {
    return { sent: false, reason: "no_email" };
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (alreadySent(meta)) {
    return { sent: false, reason: "already_sent" };
  }

  const { prefs } = readOnboardingFromMetadata(meta);
  if (prefs.gender !== "woman") {
    return { sent: false, reason: "not_woman" };
  }

  const result = await sendWomenWelcomeEmail({
    to: user.email,
    locale,
    firstName: prefs.name.trim() || undefined,
  });

  if (!result.ok) {
    return { sent: false, reason: result.error ?? "send_failed" };
  }

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.updateUser({
      data: {
        women_welcome_email_sent: true,
        women_welcome_email_sent_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[women-welcome] mark sent failed", err);
  }

  return { sent: true };
}

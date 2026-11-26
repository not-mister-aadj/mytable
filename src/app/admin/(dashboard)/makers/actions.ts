"use server";

import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/db/index";
import { makerCommissions, makers } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import { adminPath } from "@/lib/admin-url";
import { getEmailFrom, getEmailReplyTo, getResendClient } from "@/lib/email/resend";
import { makerWelcomeMail } from "@/lib/makers/mails";
import { makerLink, sanitizeMakerCode } from "@/lib/makers/shared";

/** Approves a maker with their code and mails them their link. */
export async function approveMakerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDbConfigured()) return;
  const id = String(formData.get("id") ?? "");
  const code = sanitizeMakerCode(String(formData.get("code") ?? ""));
  if (!id || !code) return;
  const db = getDb();
  const [taken] = await db.select({ id: makers.id }).from(makers).where(eq(makers.code, code)).limit(1);
  if (taken && taken.id !== id) return;
  const [maker] = await db
    .update(makers)
    .set({ status: "approved", code, approvedAt: new Date() })
    .where(eq(makers.id, id))
    .returning();
  if (maker) {
    const resend = getResendClient();
    if (resend) {
      try {
        const { error } = await resend.emails.send({
          from: getEmailFrom(),
          replyTo: getEmailReplyTo(),
          to: maker.email,
          ...makerWelcomeMail({ name: maker.name, locale: maker.locale, link: makerLink(code) }),
        });
        if (error) console.error("[makers] welcome mail failed", error);
      } catch (error) {
        console.error("[makers] welcome mail failed", error);
      }
    }
  }
  revalidatePath(adminPath("/makers"));
}

export async function rejectMakerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDbConfigured()) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getDb().update(makers).set({ status: "rejected" }).where(eq(makers.id, id));
  revalidatePath(adminPath("/makers"));
}

/** Marks what a maker earned so far as paid out: Sundays that took place, and membership months. */
export async function markMakerPaidOutAction(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isDbConfigured()) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const now = new Date();
  await getDb()
    .update(makerCommissions)
    .set({ paidOutAt: now })
    .where(
      and(
        eq(makerCommissions.makerId, id),
        isNull(makerCommissions.paidOutAt),
        or(isNull(makerCommissions.eventStartsAt), lt(makerCommissions.eventStartsAt, now)),
        sql`(${makerCommissions.bookingId} is null or exists (select 1 from bookings b where b.id = ${makerCommissions.bookingId} and b.payment_status = 'paid'))`,
      ),
    );
  revalidatePath(adminPath("/makers"));
}

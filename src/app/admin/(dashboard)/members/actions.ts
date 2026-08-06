"use server";

import { requireAdmin } from "@/lib/admin-auth";
import {
  getAdminMemberDetail,
  type AdminMemberDetail,
} from "@/lib/admin-members-data";

export async function getAdminMemberDetailAction(
  userId: string,
): Promise<{ ok: true; detail: AdminMemberDetail } | { ok: false; error: string }> {
  await requireAdmin();

  if (!userId.trim()) {
    return { ok: false, error: "Ongeldig member-ID" };
  }

  try {
    const detail = await getAdminMemberDetail(userId);
    if (!detail) {
      return { ok: false, error: "Member niet gevonden" };
    }
    return { ok: true, detail };
  } catch (error) {
    console.error("[admin/members] detail failed:", error);
    return { ok: false, error: "Kon memberdetails niet laden" };
  }
}

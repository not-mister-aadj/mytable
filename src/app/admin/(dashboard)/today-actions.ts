"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/index";
import { adminTodos } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-auth";

/** Hides a "Te doen" item until its detail changes. */
export async function dismissTodoAction(key: string, detail: string): Promise<void> {
  await requireAdmin();
  await getDb()
    .insert(adminTodos)
    .values({ key, dismissedDetail: detail, dismissedAt: new Date() })
    .onConflictDoUpdate({ target: adminTodos.key, set: { dismissedDetail: detail, dismissedAt: new Date() } });
  revalidatePath("/admin");
}

/** Shows a clicked-away item again. */
export async function restoreTodoAction(key: string): Promise<void> {
  await requireAdmin();
  await getDb().update(adminTodos).set({ dismissedDetail: null, dismissedAt: null }).where(eq(adminTodos.key, key));
  revalidatePath("/admin");
}

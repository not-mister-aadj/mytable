import { customerActivities } from "@/db/schema";
import { getDb } from "@/db/index";
import type { CustomerActivityType } from "@/lib/customers/types";

export async function logCustomerActivity(input: {
  customerId: string;
  type: CustomerActivityType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = getDb();
  await db.insert(customerActivities).values({
    customerId: input.customerId,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    metadata: input.metadata ?? null,
  });
}

import { revalidatePath } from "next/cache";

export function revalidateEventPaths(slug: string) {
  revalidatePath("/nl/agenda");
  revalidatePath("/en/agenda");
  revalidatePath(`/nl/agenda/${slug}`);
  revalidatePath(`/en/agenda/${slug}`);
  revalidatePath("/nl");
  revalidatePath("/en");
  revalidatePath("/admin/bookings");
}

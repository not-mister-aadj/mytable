import { createHash } from "crypto";

export function hashEmailForMeta(email: string): string {
  return createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
}

export function hashNameForMeta(name: string): string {
  return createHash("sha256")
    .update(name.trim().toLowerCase())
    .digest("hex");
}

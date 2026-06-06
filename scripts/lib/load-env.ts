import { config } from "dotenv";

/** Local dev vars first, then production source vars for sync scripts. */
export function loadLocalEnv(): void {
  config({ path: ".env.local" });
  config({ path: ".env.production.local" });
}

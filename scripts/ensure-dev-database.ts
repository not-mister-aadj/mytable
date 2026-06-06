import { assertDevDatabaseTarget } from "./lib/dev-db-guard";
import { ensureDevSchema } from "./lib/ensure-dev-schema";
import { syncDevFromProd } from "./lib/sync-dev-from-prod";

async function main(): Promise<void> {
  assertDevDatabaseTarget();

  if (process.env.DEV_SYNC_ON_START === "false") {
    console.log("DEV_SYNC_ON_START=false — sync overgeslagen");
    return;
  }

  await ensureDevSchema();
  await syncDevFromProd();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

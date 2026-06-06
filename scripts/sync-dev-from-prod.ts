import { syncDevFromProd } from "./lib/sync-dev-from-prod";

syncDevFromProd().catch((error) => {
  console.error(error);
  process.exit(1);
});

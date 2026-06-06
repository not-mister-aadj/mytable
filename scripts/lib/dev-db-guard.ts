import { loadLocalEnv } from "./load-env";

export function assertDevDatabaseTarget(): void {
  loadLocalEnv();

  const devUrl = process.env.DATABASE_URL?.trim();
  const prodRef = process.env.PROD_SUPABASE_PROJECT_REF?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";

  if (!devUrl) {
    console.error(
      "DATABASE_URL ontbreekt in .env.local — vul MyTable-dev credentials in.",
    );
    process.exit(1);
  }

  if (!prodRef) {
    console.error(
      "PROD_SUPABASE_PROJECT_REF ontbreekt in .env.production.local",
    );
    process.exit(1);
  }

  if (devUrl.includes(prodRef) || supabaseUrl.includes(prodRef)) {
    console.error(
      `FOUT: .env.local wijst nog naar productie (${prodRef}).`,
    );
    console.error(
      "Zet MyTable-dev URL/keys in .env.local (Supabase → MyTable-dev → Settings).",
    );
    process.exit(1);
  }

  const prodUrl = process.env.PROD_DATABASE_URL?.trim();
  if (prodUrl && devUrl === prodUrl) {
    console.error("FOUT: DATABASE_URL en PROD_DATABASE_URL zijn identiek.");
    process.exit(1);
  }
}

export function isDevDatabaseTarget(): boolean {
  loadLocalEnv();
  const devUrl = process.env.DATABASE_URL?.trim();
  const prodRef = process.env.PROD_SUPABASE_PROJECT_REF?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  if (!devUrl || !prodRef) return false;
  if (devUrl.includes(prodRef) || supabaseUrl.includes(prodRef)) return false;
  return true;
}

import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envFile = join(root, ".env.local");

const overrides = {
  NEXT_PUBLIC_SITE_URL: "https://mytable.club",
  NEXT_PUBLIC_ADMIN_URL: "https://dashboard.mytable.club",
  ADMIN_HOST: "dashboard.mytable.club",
  USE_DB_EVENTS: "true",
  NEXT_PUBLIC_USE_DB_EVENTS: "true",
};

const skipIfEmpty = new Set([
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "RESEND_API_KEY",
  "MAPKIT_TEAM_ID",
  "MAPKIT_KEY_ID",
  "MAPKIT_PRIVATE_KEY",
]);

const environments = ["production"];

function parseEnv(path) {
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return vars;
}

if (!existsSync(envFile)) {
  console.error(".env.local not found");
  process.exit(1);
}

const vars = { ...parseEnv(envFile), ...overrides };

if (!existsSync(join(root, ".vercel", "project.json"))) {
  execSync("npx vercel@latest link --yes", { cwd: root, stdio: "inherit" });
}

for (const key of Object.keys(vars).sort()) {
  const value = vars[key];
  if (!value) {
    if (skipIfEmpty.has(key)) {
      console.log(`skip ${key} (empty)`);
      continue;
    }
    console.warn(`skip ${key} (empty)`);
    continue;
  }
  const sensitive = !key.startsWith("NEXT_PUBLIC_");
  for (const env of environments) {
    console.log(`${key} -> ${env}`);
    const args = [
      "vercel@latest",
      "env",
      "add",
      key,
      env,
      "--force",
      "--yes",
      "--value",
      value,
    ];
    if (sensitive) args.push("--sensitive");
    execSync(`npx ${args.map((a) => `"${a.replace(/"/g, '\\"')}"`).join(" ")}`, {
      cwd: root,
      stdio: "pipe",
    });
  }
}

console.log("Done. Redeploy production on Vercel.");

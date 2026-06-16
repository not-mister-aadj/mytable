import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getPostgresClient() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!client) {
    client = postgres(connectionString, { prepare: false });
    dbInstance = drizzle(client, { schema });
  }
  return client;
}

export function getDb() {
  if (!dbInstance) {
    getPostgresClient();
  }
  return dbInstance!;
}

export function isDbConfigured(): boolean {
  return Boolean(connectionString);
}
